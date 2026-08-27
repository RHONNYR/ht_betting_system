from fastapi import FastAPI, Depends, HTTPException, status, Security, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_, literal
import datetime
import os
import math
import requests
from bs4 import BeautifulSoup
import json
from jose import jwt, JWTError
import bcrypt
from pydantic import BaseModel
from typing import List, Optional

from database import SessionLocal, User, Titular, Tarjeta, CompraDivisa, HistorialCiclos, DistribucionCapital, HistorialCapitalDiario, HistorialRemesas, Cliente, CompraCicloParcial, MovimientoZelle, CategoriaPersonal, GastoPersonal, DeudaPersonal, IngresoPersonal, PresupuestoPersonal, SimulacionRutas, CanjeDivisa, engine

# JWT configuration
SECRET_KEY = "rhonny_arbitraje_secret_key_super_secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
APP_VERSION = "v158"  # Responsive table fixes and CSS container overhaul

security = HTTPBearer()

def get_venezuela_time():
    # Render servers run in UTC, so we subtract 4 hours to get Venezuela time (UTC-4)
    return datetime.datetime.utcnow() - datetime.timedelta(hours=4)

def recalculate_ciclo_stats(ciclo, db: Session):
    db.flush()       # Sincronizar inserciones y eliminaciones pendientes en la transacción
    db.refresh(ciclo)  # Recargar ciclo y sus relaciones desde la DB (incluye compras_parciales nuevas)
    
    # ── Separar compras reales de gastos personales ────────────────────────────────
    compras_reales = [
        cp for cp in (ciclo.compras_parciales or [])
        if cp.usd_comprados is not None and cp.usd_comprados > 0.0
    ]
    # Gastos personales = compras parciales donde usd_comprados es 0 o None
    total_gastos_personales_ves = sum(
        (cp.transferencias_ves or 0.0)
        for cp in (ciclo.compras_parciales or [])
        if cp.usd_comprados is None or cp.usd_comprados == 0.0
    )
    
    total_usd_recibidos  = sum((cp.usd_recibidos_binance or 0.0) for cp in compras_reales)
    total_usd_comprados  = sum((cp.usd_comprados        or 0.0) for cp in compras_reales)
    total_usd_procesados = sum((cp.usd_procesados       or 0.0) for cp in compras_reales)
    total_comision_ves   = sum((cp.comision_compra_ves  or 0.0) for cp in compras_reales)
    total_transferencias_ves = sum((cp.transferencias_ves or 0.0) for cp in compras_reales)

    ciclo.usd_recibidos_binance  = round(total_usd_recibidos, 2)
    ciclo.usd_procesados_binance = round(total_usd_procesados, 2)
    ciclo.divisas_compradas      = round(total_usd_comprados, 2)
    ciclo.comision_compra_ves    = round(total_comision_ves, 2)
    ciclo.transferencias_ves     = round(total_transferencias_ves, 2)
    
    # ── Ganancia basada en el SOBRE (envelope formula) ────────────────────────────
    # Lógica: De todo lo que entró al sobre, restamos lo que queda Y lo que se gastó
    # personalmente → lo que reste es el costo real del arbitraje en VES.
    tasa = ciclo.tasa_venta or 0.0
    usdt_vendidos = ciclo.usdt_vendidos or 0.0
    
    # Si no hay compras reales registradas en el ciclo, la ganancia es simplemente 0.0
    # (previene que ciclos de prueba o cancelados muestren una pérdida del 100%)
    if not compras_reales:
        ciclo.ganancia_usd = 0.0
        ciclo.ganancia_porcentaje = 0.0
    else:
        if tasa > 0 and usdt_vendidos > 0:
            ves_inicial = round(usdt_vendidos * 0.9975 * tasa, 2)
            ves_restantes = ciclo.bolivares_sobre_restantes or 0.0
            # VES usados en arbitraje = inicial - lo que queda - gastos personales
            ves_arbitraje = round(ves_inicial - ves_restantes - total_gastos_personales_ves, 2)
            ves_arbitraje = max(0.0, ves_arbitraje)
            costo_usdt = round(ves_arbitraje / tasa, 2)
        else:
            costo_usdt = 0.0
        
        ciclo.ganancia_usd = round(ciclo.usd_recibidos_binance - costo_usdt, 2)
        ciclo.ganancia_porcentaje = round(
            (ciclo.usd_recibidos_binance / costo_usdt - 1) * 100, 2
        ) if costo_usdt > 0 else 0.0
    
    # bolivares_restantes = saldo del sobre (caja) — no interviene en la ganancia
    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes

app = FastAPI(title="Sistema de Arbitraje y Remesas")

# Startup migration to fix legacy purchase bank names in database
@app.on_event("startup")
def run_startup_jobs():
    # 1. Run database migrations to add cliente_nombre and capture_url to movimientos_zelle
    db = SessionLocal()
    try:
        engine_name = db.bind.dialect.name
        if engine_name == "sqlite":
            try:
                db.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN cliente_nombre VARCHAR"))
                db.commit()
            except Exception:
                db.rollback()
            try:
                db.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN capture_url VARCHAR"))
                db.commit()
            except Exception:
                db.rollback()
        else: # PostgreSQL
            try:
                db.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR"))
                db.commit()
            except Exception:
                db.rollback()
            try:
                db.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN IF NOT EXISTS capture_url VARCHAR"))
                db.commit()
            except Exception:
                db.rollback()
                
        # Ensure canjes_divisas table exists
        CanjeDivisa.__table__.create(bind=engine, checkfirst=True)
        
        # Ensure uploads folder exists
        base_dir = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(os.path.join(base_dir, "static", "uploads"), exist_ok=True)
    except Exception as e:
        print(f"Error during startup DB columns migration: {e}")
    finally:
        db.close()

    # 2. Fix legacy purchase bank names
    db = SessionLocal()
    try:
        purchases_with_card = db.query(CompraCicloParcial).filter(CompraCicloParcial.tarjeta_id.isnot(None)).all()
        for p in purchases_with_card:
            card = db.query(Tarjeta).filter(Tarjeta.id == p.tarjeta_id).first()
            if card and p.banco != card.banco:
                p.banco = card.banco
        
        all_purchases = db.query(CompraCicloParcial).all()
        for p in all_purchases:
            if not p.banco or p.banco.strip().lower() in ("rhonny", "none", "banco", ""):
                if p.tarjeta_id:
                    card = db.query(Tarjeta).filter(Tarjeta.id == p.tarjeta_id).first()
                    if card:
                        p.banco = card.banco
                        continue
                ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == p.ciclo_id).first()
                if ciclo:
                    p.banco = ciclo.banco_venta or "Venezuela"
                else:
                    p.banco = "Venezuela"
                    
        db.commit()
    except Exception as e:
        print(f"Error during legacy purchase migration: {e}")
    finally:
        db.close()

    # 3. Setup Telegram Bot webhook
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if bot_token:
        webhook_url = "https://arbitraje-rhonny-99.onrender.com/api/webhooks/telegram"
        api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        try:
            r = requests.post(api_url, json={"url": webhook_url})
            print(f"Telegram webhook registration: {r.status_code} - {r.json()}")
        except Exception as e:
            print(f"Failed to register Telegram webhook: {e}")
    else:
        print("TELEGRAM_BOT_TOKEN not configured. Skipping bot webhook registration.")

# heal_all_cycles_stats removed — startup mass-recalculation was overwriting
# correctly stored ganancia_usd values for all cycles.

# CORS middleware for local testing/cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to disable browser caching for all endpoints and static files
@app.middleware("http")
async def disable_caching_middleware(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# In-memory daily BCV rate override
class BCVState:
    def __init__(self):
        self.manual_rate = None
        self.last_fetch = None
        self.cached_rate = 36.50  # fallback baseline
        self.active_mode = "tomorrow"  # "today" or "tomorrow"
        self.cached_today_rate = None
        self.cached_tomorrow_rate = None

bcv_state = BCVState()

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    username: str

class CapitalUpdate(BaseModel):
    plataforma_id: int
    saldo_usd: float
    saldo_ves: float

class TitularCreate(BaseModel):
    nombre: str
    tercera_edad: bool

class TarjetaCreate(BaseModel):
    titular_id: int
    banco: str
    tipo_tarjeta: str
    limite_diario: float
    limite_mensual: float
    comision_porcentaje: float

class CompraDivisaCreate(BaseModel):
    tarjeta_id: int
    monto_usd: float
    tasa_bcv: float
    fecha: Optional[str] = None

class CicloCreate(BaseModel):
    usdt_vendidos: float
    tasa_venta: float
    banco_venta: str
    divisas_compradas: float
    tasa_bcv: float
    comision_compra_ves: float
    transferencias_ves: float
    usd_procesados_binance: float
    usd_recibidos_binance: float
    ganancia_usd: float
    ganancia_porcentaje: float
    bolivares_restantes: float
    status: Optional[str] = "completado"
    bolivares_sobre_restantes: Optional[float] = 0.0
    tarjeta_id: Optional[int] = None
    fecha: Optional[str] = None

class CicloUpdate(BaseModel):
    fecha: str
    usdt_vendidos: float
    tasa_venta: float
    tarjeta_id: int
    usd_recibidos_binance: float
    tasa_bcv: Optional[float] = None

class CompraCicloParcialCreate(BaseModel):
    usd_comprados: float
    usd_procesados: float
    tasa_bcv: float
    comision_compra_ves: float
    transferencias_ves: float
    usd_recibidos_binance: float
    banco: Optional[str] = None
    tarjeta_id: Optional[int] = None

class CompraCicloParcialUpdate(BaseModel):
    usd_comprados: float
    usd_procesados: float
    tasa_bcv: float
    comision_compra_ves: float
    transferencias_ves: float
    usd_recibidos_binance: float
    banco: Optional[str] = None
    tarjeta_id: Optional[int] = None
    fecha: Optional[str] = None

class PivotVESRequest(BaseModel):
    tarjeta_destino_id: int
    monto_ves_transferido: float
    comision_transferencia_ves: float

class SnapshotItemUpdate(BaseModel):
    plataforma: str
    saldo_usd: float
    saldo_ves: float
    usd_equivalente: float

class SnapshotUpdate(BaseModel):
    fecha: str
    detalle: List[SnapshotItemUpdate]

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class P2PRateRequest(BaseModel):
    fiat: str = "VES"
    asset: str = "USDT"
    trade_type: str = "SELL"
    pay_types: Optional[List[str]] = []
    amount: Optional[float] = None

class RemesaCreate(BaseModel):
    cliente_nombre: str
    monto_usd: float
    tasa_p2p: float
    tasa_cliente: float
    monto_ves: float
    ganancia_usd: float
    metodo_pago: str
    banco_receptor: str
    costo_adquisicion_usdt: float
    comision_binance: float
    cliente_genero: Optional[str] = "Masculino"
    fecha: Optional[str] = None
    zelle_movimiento_id: Optional[int] = None
    ciclo_id: Optional[int] = None

class ClienteCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    genero: Optional[str] = "Masculino"

class MovimientoZelleCreate(BaseModel):
    tipo: str  # "ingreso" / "egreso"
    monto: float
    titular: Optional[str] = None
    detalle: Optional[str] = None
    fecha: Optional[str] = None
    estado: Optional[str] = "completado"  # "completado", "pendiente"
    force: Optional[bool] = False
    cliente_nombre: Optional[str] = None
    capture_url: Optional[str] = None

class CanjeDivisaCreate(BaseModel):
    fecha: Optional[str] = None
    origen_plataforma: str
    monto_entregado: float
    destino_plataforma: str
    monto_recibido: float
    comision_canje_pct: Optional[float] = 6.0
    comision_reposicion_pct: Optional[float] = 2.0
    comisiones_operativas_pct: Optional[float] = 0.55
    ganancia_bruta_usd: Optional[float] = 0.0
    ganancia_neta_usd: Optional[float] = 0.0
    cliente_nombre: Optional[str] = None
    detalles: Optional[str] = None
    capture_url: Optional[str] = None

class CanjeDivisaUpdate(BaseModel):
    fecha: Optional[str] = None
    origen_plataforma: str
    monto_entregado: float
    destino_plataforma: str
    monto_recibido: float
    comision_canje_pct: Optional[float] = 6.0
    comision_reposicion_pct: Optional[float] = 2.0
    comisiones_operativas_pct: Optional[float] = 0.55
    ganancia_bruta_usd: Optional[float] = 0.0
    ganancia_neta_usd: Optional[float] = 0.0
    cliente_nombre: Optional[str] = None
    detalles: Optional[str] = None
    capture_url: Optional[str] = None

class BCVModeRequest(BaseModel):
    mode: str

class CategoriaPersonalCreate(BaseModel):
    nombre: str
    tipo: str  # "gasto" o "ingreso"
    icono: Optional[str] = "⚙️"

class GastoPersonalCreate(BaseModel):
    monto: float
    moneda: str  # "USD" o "VES"
    tasa_bcv: float
    categoria_id: int
    subcategoria: Optional[str] = None
    detalles: Optional[str] = None
    plataforma_pago: str  # Mercantil, Zelle, Provincial, BDV, Efectivo, etc.
    deuda_id: Optional[int] = None
    fecha: Optional[str] = None  # Opcional, para registrar con fechas del pasado
    ciclo_id: Optional[int] = None

class GastoPersonalUpdate(BaseModel):
    monto: float
    moneda: str  # "USD" o "VES"
    tasa_bcv: float
    categoria_id: int
    subcategoria: Optional[str] = None
    detalles: Optional[str] = None
    plataforma_pago: str
    fecha: Optional[str] = None

class DeudaPersonalCreate(BaseModel):
    acreedor: str
    monto_original_usd: float
    moneda: Optional[str] = "USD"               # "USD" o "VES" (para saber cómo se origina la deuda)
    tasa_bcv_registro: Optional[float] = None   # Tasa BCV al momento del registro
    monto_bs_registro: Optional[float] = None   # Equivalente en Bs al momento del registro
    categoria_compra: Optional[str] = None
    detalles: Optional[str] = None
    fecha_creacion: Optional[str] = None

class PagoDeudaRequest(BaseModel):
    monto: float
    moneda: str  # "USD" o "VES"
    tasa_bcv: float
    plataforma_pago: str  # De dónde sale el dinero (Mercantil, Provincial, etc.)
    detalles: Optional[str] = None
    fecha: Optional[str] = None

class IngresoPersonalCreate(BaseModel):
    monto: float
    moneda: str  # "USD" o "VES"
    tasa_bcv: float
    categoria_id: int
    plataforma_pago: Optional[str] = None
    detalles: Optional[str] = None
    fecha: Optional[str] = None

class IngresoPersonalUpdate(BaseModel):
    monto: float
    moneda: str  # "USD" o "VES"
    tasa_bcv: float
    categoria_id: int
    plataforma_pago: Optional[str] = None
    detalles: Optional[str] = None
    fecha: Optional[str] = None

class PresupuestoPersonalUpdate(BaseModel):
    categoria_id: int
    limite_semanal_usd: float
    limite_mensual_usd: float

class PinChangeRequest(BaseModel):
    old_pin: str
    new_pin: str

class PinVerifyRequest(BaseModel):
    pin: str



# Helpers
def get_default_gender(nombre: str) -> str:
    name_parts = nombre.strip().lower().split()
    if not name_parts:
        return "Masculino"
    first_name = name_parts[0]
    female_names = {
        'maria', 'maría', 'ana', 'carmen', 'isabel', 'sol', 'solanda', 
        'beatriz', 'ruth', 'ines', 'inés', 'elena', 'irene', 'abril', 
        'belen', 'belén', 'raquel', 'esther', 'ester', 'pilar', 'luz', 
        'concepcion', 'concepción', 'mercedes', 'rosario', 'dolores', 
        'rocio', 'rocío', 'judith', 'miriam', 'míriam', 'elizabeth', 
        'genesis', 'génesis', 'anaisabel', 'solangie', 'solangel', 'solanda',
        'anais', 'anaís', 'sandra', 'valeria', 'patricia', 'camila', 'alejandra',
        'marian', 'mariana', 'gabriela', 'daniela', 'paola', 'monica', 'mónica'
    }
    if first_name in female_names:
        return "Femenino"
    if first_name.endswith('a') and first_name not in {'josua', 'joshua', 'luca', 'lucas', 'andrea'}:
        return "Femenino"
    return "Masculino"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return username
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

def fetch_both_bcv_rates():
    # Cache check (30 minutes)
    now = get_venezuela_time()
    if bcv_state.last_fetch and bcv_state.cached_today_rate and bcv_state.cached_tomorrow_rate:
        diff = (now - bcv_state.last_fetch).total_seconds()
        if diff < 1800:  # 30 minutes
            return bcv_state.cached_today_rate, bcv_state.cached_tomorrow_rate

    rate_site = None
    rate_api = None
    
    # Method 1: Scraping official website (gives tomorrow's rate after 6 PM)
    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        url = "https://www.bcv.org.ve/"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        res = requests.get(url, headers=headers, timeout=5, verify=False)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            div_dolar = soup.find("div", {"id": "dolar"})
            if div_dolar:
                strong_val = div_dolar.find("strong")
                if strong_val:
                    rate_str = strong_val.text.strip().replace(",", ".")
                    rate_site = float(rate_str)
    except Exception as e:
        print(f"BCV Scraping failed: {e}")

    # Method 2: DolarApi.com VE (gives today's calendar date rate)
    try:
        url = "https://ve.dolarapi.com/v1/dolares/oficial"
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            rate_val = data.get("promedio") or data.get("venta")
            if rate_val:
                rate_api = float(rate_val)
    except Exception as e:
        print(f"BCV Fallback API (DolarApi) failed: {e}")

    # Fallbacks and baseline cache update
    if not rate_site and not rate_api:
        if bcv_state.cached_today_rate and bcv_state.cached_tomorrow_rate:
            return bcv_state.cached_today_rate, bcv_state.cached_tomorrow_rate
        return bcv_state.cached_rate, bcv_state.cached_rate
        
    if not rate_site:
        rate_site = rate_api
    if not rate_api:
        rate_api = rate_site

    bcv_state.cached_rate = rate_site
    bcv_state.cached_today_rate = rate_api
    bcv_state.cached_tomorrow_rate = rate_site
    bcv_state.last_fetch = now
    
    return rate_api, rate_site

def scrape_bcv_rate():
    tasa_hoy, tasa_manana = fetch_both_bcv_rates()
    return tasa_hoy if bcv_state.active_mode == "today" else tasa_manana

# Auth Routes
@app.post("/api/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username_clean = req.username.strip().lower()
    password_clean = req.password.strip()
    user = db.query(User).filter(func.lower(User.username) == username_clean).first()
    if not user or not bcrypt.checkpw(password_clean.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    token = create_access_token({"sub": user.username})
    return {"token": token, "username": user.username}

@app.post("/api/change-password")
def change_password(req: PasswordChange, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not bcrypt.checkpw(req.old_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Contraseña anterior incorrecta")
    
    salt = bcrypt.gensalt()
    user.password_hash = bcrypt.hashpw(req.new_password.encode('utf-8'), salt).decode('utf-8')
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}

# BCV Rates Routes
historical_bcv_cache = {
    "last_fetch": None,
    "data": []
}

def get_historical_bcv_data():
    now = get_venezuela_time()
    if historical_bcv_cache["last_fetch"] and historical_bcv_cache["data"]:
        diff = (now - historical_bcv_cache["last_fetch"]).total_seconds()
        if diff < 3600:  # 1 hour cache
            return historical_bcv_cache["data"]
            
    try:
        url = "https://ve.dolarapi.com/v1/historicos/dolares"
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            oficial_data = [x for x in data if x.get("fuente") == "oficial" and x.get("fecha")]
            oficial_data.sort(key=lambda x: x.get("fecha"))
            historical_bcv_cache["data"] = oficial_data
            historical_bcv_cache["last_fetch"] = now
            return oficial_data
    except Exception as e:
        print(f"Error fetching historical BCV data: {e}")
        
    return historical_bcv_cache["data"]

@app.get("/api/bcv/historical")
def get_historical_bcv_rate(fecha: str, username: str = Depends(get_current_user)):
    target_date = fecha.strip()
    data = get_historical_bcv_data()
    if not data:
        raise HTTPException(status_code=503, detail="No se pudo consultar el histórico de tasas BCV")
        
    exact = [x for x in data if x.get("fecha") == target_date]
    if exact:
        rate = exact[-1].get("promedio") or exact[-1].get("venta") or exact[-1].get("compra")
        if rate:
            return {
                "fecha": target_date,
                "effective_date": target_date,
                "rate": float(rate),
                "exact": True,
                "found": True
            }
            
    prev_records = [x for x in data if x.get("fecha") <= target_date]
    if prev_records:
        closest = prev_records[-1]
        rate = closest.get("promedio") or closest.get("venta") or closest.get("compra")
        if rate:
            return {
                "fecha": target_date,
                "effective_date": closest.get("fecha"),
                "rate": float(rate),
                "exact": False,
                "note": f"Tasa del {closest.get('fecha')} (vigente para el {target_date})",
                "found": True
            }
            
    raise HTTPException(status_code=404, detail=f"No se encontró tasa oficial para la fecha {target_date}")

@app.get("/api/bcv")
def get_bcv_rate(username: str = Depends(get_current_user)):
    tasa_hoy, tasa_manana = fetch_both_bcv_rates()
    
    if bcv_state.manual_rate:
        return {
            "rate": bcv_state.manual_rate,
            "source": "Manual",
            "today_rate": tasa_hoy,
            "tomorrow_rate": tasa_manana,
            "has_tomorrow": abs(tasa_manana - tasa_hoy) > 0.001,
            "active_mode": "manual"
        }
    
    active_rate = tasa_hoy if bcv_state.active_mode == "today" else tasa_manana
    return {
        "rate": active_rate,
        "source": "BCV Oficial",
        "today_rate": tasa_hoy,
        "tomorrow_rate": tasa_manana,
        "has_tomorrow": abs(tasa_manana - tasa_hoy) > 0.001,
        "active_mode": bcv_state.active_mode
    }

@app.post("/api/bcv")
def set_manual_bcv(req: dict, username: str = Depends(get_current_user)):
    rate = req.get("rate")
    if rate is None:
        bcv_state.manual_rate = None
        return {"message": "Tasa manual desactivada, usando tasa oficial"}
    try:
        bcv_state.manual_rate = float(rate)
        return {"message": f"Tasa manual establecida en {bcv_state.manual_rate}", "rate": bcv_state.manual_rate}
    except ValueError:
        raise HTTPException(status_code=400, detail="Tasa inválida")

@app.post("/api/bcv/mode")
def set_bcv_mode(req: BCVModeRequest, username: str = Depends(get_current_user)):
    if req.mode not in ["today", "tomorrow"]:
        raise HTTPException(status_code=400, detail="Modo no válido")
    bcv_state.active_mode = req.mode
    bcv_state.manual_rate = None  # Reset manual override when switching mode
    
    tasa_hoy, tasa_manana = fetch_both_bcv_rates()
    active_rate = tasa_hoy if bcv_state.active_mode == "today" else tasa_manana
    return {
        "message": f"Modo BCV establecido en {bcv_state.active_mode}",
        "rate": active_rate,
        "active_mode": bcv_state.active_mode
    }

# Capital Routes
@app.get("/api/capital")
def get_capital(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    platforms = db.query(DistribucionCapital).all()
    # Get current BCV rate for conversion
    bcv_rate = bcv_state.manual_rate if bcv_state.manual_rate else scrape_bcv_rate()
    
    result = []
    total_usd = 0.0
    total_ves = 0.0
    total_usd_equivalente = 0.0
    total_usd_simulado = 0.0
    
    for plat in platforms:
        usd_equiv = plat.saldo_usd
        if plat.convertir_ves and bcv_rate > 0:
            usd_equiv += plat.saldo_ves / bcv_rate
            
        # Simulación post comisiones
        usd_simulado = usd_equiv * (1 - plat.comision_simulacion)
        
        result.append({
            "id": plat.id,
            "plataforma": plat.plataforma,
            "saldo_usd": plat.saldo_usd,
            "saldo_ves": plat.saldo_ves,
            "convertir_ves": plat.convertir_ves,
            "usd_equivalente": usd_equiv,
            "usd_simulado": usd_simulado,
            "comision_simulacion": plat.comision_simulacion
        })
        
        total_usd += plat.saldo_usd
        total_ves += plat.saldo_ves
        total_usd_equivalente += usd_equiv
        total_usd_simulado += usd_simulado
        
    return {
        "items": result,
        "totales": {
            "total_usd": total_usd,
            "total_ves": total_ves,
            "total_usd_equivalente": total_usd_equivalente,
            "total_usd_simulado": total_usd_simulado,
            "tasa_bcv": bcv_rate
        }
    }

@app.put("/api/capital")
def update_capital(updates: List[CapitalUpdate], username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    for up in updates:
        plat = db.query(DistribucionCapital).filter(DistribucionCapital.id == up.plataforma_id).first()
        if plat:
            plat.saldo_usd = up.saldo_usd
            plat.saldo_ves = up.saldo_ves
    db.commit()
    return {"message": "Capital actualizado exitosamente"}

@app.post("/api/capital/snapshot")
def save_capital_snapshot(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    platforms = db.query(DistribucionCapital).all()
    bcv_rate = bcv_state.manual_rate if bcv_state.manual_rate else scrape_bcv_rate()
    
    total_usd_equivalente = 0.0
    detail = []
    
    for plat in platforms:
        usd_equiv = plat.saldo_usd
        if plat.convertir_ves and bcv_rate > 0:
            usd_equiv += plat.saldo_ves / bcv_rate
        total_usd_equivalente += usd_equiv
        detail.append({
            "plataforma": plat.plataforma,
            "saldo_usd": plat.saldo_usd,
            "saldo_ves": plat.saldo_ves,
            "usd_equivalente": usd_equiv
        })
        
    snapshot = HistorialCapitalDiario(
        fecha_registro=get_venezuela_time(),
        total_usd=total_usd_equivalente,
        detalle_json=json.dumps(detail)
    )
    db.add(snapshot)
    db.commit()
    return {"message": "Snapshot de capital registrado exitosamente", "total_usd": total_usd_equivalente}

@app.get("/api/capital/snapshots")
def get_capital_snapshots(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshots = db.query(HistorialCapitalDiario).order_by(HistorialCapitalDiario.fecha_registro.desc()).limit(60).all()
    result = []
    for snap in snapshots:
        result.append({
            "id": snap.id,
            "fecha": snap.fecha_registro.strftime("%d/%m/%Y %I:%M %p"),
            "total_usd": snap.total_usd,
            "detalle": json.loads(snap.detalle_json)
        })
    return result

@app.put("/api/capital/snapshots/{snap_id}")
def update_capital_snapshot(snap_id: int, req: SnapshotUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    snap = db.query(HistorialCapitalDiario).filter(HistorialCapitalDiario.id == snap_id).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot no encontrado")
        
    total_usd = sum(d.usd_equivalente for d in req.detalle)
    
    try:
        parsed_date = datetime.datetime.strptime(req.fecha, "%d/%m/%Y %I:%M %p")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use DD/MM/YYYY HH:MM AM/PM")
        
    snap.fecha_registro = parsed_date
    snap.total_usd = total_usd
    
    detail = []
    for d in req.detalle:
        detail.append({
            "plataforma": d.plataforma,
            "saldo_usd": d.saldo_usd,
            "saldo_ves": d.saldo_ves,
            "usd_equivalente": d.usd_equivalente
        })
    snap.detalle_json = json.dumps(detail)
    db.commit()
    return {"message": "Snapshot de capital actualizado con éxito"}

@app.delete("/api/capital/snapshots/{snap_id}")
def delete_capital_snapshot(snap_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    snap = db.query(HistorialCapitalDiario).filter(HistorialCapitalDiario.id == snap_id).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot no encontrado")
    db.delete(snap)
    db.commit()
    return {"message": "Snapshot de capital eliminado con éxito"}

# Zelle Ledger Routes
@app.get("/api/zelle/movimientos")
def get_zelle_movimientos(
    desde: str = None,
    hasta: str = None,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Parse dates for filtering query
    inicio_filtro = None
    fin_filtro = None
    if desde:
        try:
            inicio_filtro = datetime.datetime.fromisoformat(desde)
        except Exception:
            pass
    if hasta:
        try:
            fin_filtro = datetime.datetime.fromisoformat(hasta) + datetime.timedelta(days=1)
        except Exception:
            pass

    # 1. Fetch ALL movements sorted chronologically to compute running balances correctly
    all_movs = db.query(MovimientoZelle).order_by(MovimientoZelle.fecha.asc()).all()
    balances_map = {}
    current_balance = 0.0
    for m in all_movs:
        if m.tipo == "ingreso":
            current_balance += m.monto
        elif m.tipo == "egreso":
            current_balance -= m.monto
        balances_map[m.id] = round(current_balance, 2)

    # 2. Query movements to be returned (with optional date filtering)
    query_movs = db.query(MovimientoZelle)
    if inicio_filtro:
        query_movs = query_movs.filter(MovimientoZelle.fecha >= inicio_filtro)
    if fin_filtro:
        query_movs = query_movs.filter(MovimientoZelle.fecha < fin_filtro)
        
    movs = query_movs.order_by(MovimientoZelle.fecha.desc()).limit(150).all()
    
    # Compute weekly totals (from Monday to Sunday of the current week)
    now = get_venezuela_time()
    days_to_monday = now.weekday()
    start_of_week = datetime.datetime(now.year, now.month, now.day) - datetime.timedelta(days=days_to_monday)
    end_of_week = start_of_week + datetime.timedelta(days=7)
    
    start_of_day = datetime.datetime(now.year, now.month, now.day)
    start_of_month = datetime.datetime(now.year, now.month, 1)
    
    # Calcular consumos diario y mensual de ingresos y egresos Zelle (usando los datos de all_movs en memoria)
    daily_ingresos = sum(m.monto for m in all_movs if m.tipo == "ingreso" and m.fecha >= start_of_day)
    monthly_ingresos = sum(m.monto for m in all_movs if m.tipo == "ingreso" and m.fecha >= start_of_month)
    daily_egresos = sum(m.monto for m in all_movs if m.tipo == "egreso" and m.fecha >= start_of_day)
    monthly_egresos = sum(m.monto for m in all_movs if m.tipo == "egreso" and m.fecha >= start_of_month)
    
    weekly_ingresos = sum(m.monto for m in all_movs if m.tipo == "ingreso" and m.fecha >= start_of_week and m.fecha < end_of_week)
    weekly_egresos = sum(m.monto for m in all_movs if m.tipo == "egreso" and m.fecha >= start_of_week and m.fecha < end_of_week)
    pendientes_remesar_usd = sum(m.monto for m in all_movs if m.tipo == "ingreso" and getattr(m, "estado", "completado") == "pendiente")
    
    zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
    saldo_actual = zelle_plat.saldo_usd if zelle_plat else 0.0
    
    # Calcular totales del período filtrado para mostrarlos en el frontend
    filtered_for_sum = all_movs
    if inicio_filtro:
        filtered_for_sum = [m for m in filtered_for_sum if m.fecha >= inicio_filtro]
    if fin_filtro:
        filtered_for_sum = [m for m in filtered_for_sum if m.fecha < fin_filtro]
        
    total_ingresos_filtrado = sum(m.monto for m in filtered_for_sum if m.tipo == "ingreso")
    total_egresos_filtrado = sum(m.monto for m in filtered_for_sum if m.tipo == "egreso")
    
    result = []
    for m in movs:
        result.append({
            "id": m.id,
            "fecha": m.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "tipo": m.tipo,
            "monto": m.monto,
            "titular": m.titular or "-",
            "detalle": m.detalle or "-",
            "estado": getattr(m, "estado", "completado") or "completado",
            "remesa_id": getattr(m, "remesa_id", None),
            "saldo_acumulado": balances_map.get(m.id, 0.0),
            "cliente_nombre": getattr(m, "cliente_nombre", None) or "-",
            "capture_url": getattr(m, "capture_url", None)
        })
        
    return {
        "items": result,
        "summary": {
            "saldo_actual": saldo_actual,
            "weekly_ingresos": weekly_ingresos,
            "weekly_egresos": weekly_egresos,
            "pendientes_remesar_usd": pendientes_remesar_usd,
            "daily_ingresos": daily_ingresos,
            "monthly_ingresos": monthly_ingresos,
            "daily_egresos": daily_egresos,
            "monthly_egresos": monthly_egresos,
            "total_ingresos_filtrado": total_ingresos_filtrado,
            "total_egresos_filtrado": total_egresos_filtrado
        }
    }


@app.post("/api/zelle/movimientos")
def create_zelle_movimiento(req: MovimientoZelleCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    fecha_mov = get_venezuela_time()
    if req.fecha:
        try:
            fecha_mov = datetime.datetime.strptime(req.fecha, "%d/%m/%Y %I:%M %p")
        except ValueError:
            try:
                fecha_mov = datetime.datetime.strptime(req.fecha, "%d/%m/%Y")
            except ValueError:
                pass

    # Detectar duplicados potenciales si no está forzado
    if not req.force:
        start_of_day = datetime.datetime(fecha_mov.year, fecha_mov.month, fecha_mov.day)
        end_of_day = start_of_day + datetime.timedelta(days=1)
        duplicate = db.query(MovimientoZelle).filter(
            MovimientoZelle.tipo == req.tipo,
            MovimientoZelle.monto == req.monto,
            MovimientoZelle.fecha >= start_of_day,
            MovimientoZelle.fecha < end_of_day
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"duplicate_warning:Ya existe un movimiento de tipo '{req.tipo}' por ${req.monto} registrado hoy. ¿Deseas guardarlo de todas formas?"
            )
                
    estado_mov = req.estado or ("pendiente" if req.tipo == "ingreso" and "pendiente" in (req.detalle or "").lower() else "completado")
    
    mov = MovimientoZelle(
        fecha=fecha_mov,
        tipo=req.tipo,
        monto=req.monto,
        titular=req.titular,
        detalle=req.detalle,
        estado=estado_mov,
        cliente_nombre=req.cliente_nombre,
        capture_url=req.capture_url
    )
    db.add(mov)
    
    zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
    if zelle_plat:
        if req.tipo == "ingreso":
            zelle_plat.saldo_usd += req.monto
        elif req.tipo == "egreso":
            zelle_plat.saldo_usd -= req.monto
            
    db.commit()
    return {"message": "Movimiento registrado con éxito", "id": mov.id}

@app.put("/api/zelle/movimientos/{mov_id}")
def update_zelle_movimiento(mov_id: int, req: MovimientoZelleCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    mov = db.query(MovimientoZelle).filter(MovimientoZelle.id == mov_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        
    # Revertir impacto del saldo anterior en la cuenta de Zelle
    zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
    if zelle_plat:
        if mov.tipo == "ingreso":
            zelle_plat.saldo_usd -= mov.monto
        elif mov.tipo == "egreso":
            zelle_plat.saldo_usd += mov.monto
            
    # Procesar fecha
    fecha_mov = get_venezuela_time()
    if req.fecha:
        try:
            fecha_mov = datetime.datetime.strptime(req.fecha, "%d/%m/%Y %I:%M %p")
        except ValueError:
            try:
                fecha_mov = datetime.datetime.strptime(req.fecha, "%d/%m/%Y")
            except ValueError:
                pass
                
    # Actualizar valores
    mov.fecha = fecha_mov
    mov.tipo = req.tipo
    mov.monto = req.monto
    mov.titular = req.titular
    mov.detalle = req.detalle
    mov.estado = req.estado or "completado"
    mov.cliente_nombre = req.cliente_nombre
    mov.capture_url = req.capture_url
    
    # Aplicar impacto del nuevo saldo
    if zelle_plat:
        if req.tipo == "ingreso":
            zelle_plat.saldo_usd += req.monto
        elif req.tipo == "egreso":
            zelle_plat.saldo_usd -= req.monto
            
    db.commit()
    return {"message": "Movimiento de Zelle actualizado con éxito"}

@app.put("/api/zelle/movimientos/{mov_id}/estado")
def update_zelle_movimiento_estado(mov_id: int, req: dict, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    mov = db.query(MovimientoZelle).filter(MovimientoZelle.id == mov_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        
    nuevo_estado = req.get("estado", "completado")
    mov.estado = nuevo_estado
    db.commit()
    return {"message": f"Estado del movimiento Zelle actualizado a '{nuevo_estado}'"}

@app.delete("/api/zelle/movimientos/{mov_id}")
def delete_zelle_movimiento(mov_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    mov = db.query(MovimientoZelle).filter(MovimientoZelle.id == mov_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
        
    zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
    if zelle_plat:
        if mov.tipo == "ingreso":
            zelle_plat.saldo_usd = round(zelle_plat.saldo_usd - mov.monto, 2)
        elif mov.tipo == "egreso":
            zelle_plat.saldo_usd = round(zelle_plat.saldo_usd + mov.monto, 2)
            
    db.delete(mov)
    db.commit()
    return {"message": "Movimiento eliminado con éxito"}

# ----------------------------------------------------
# CANJES Y ARBITRAJE DE DIVISAS (CASH -> ZELLE, ETC.)
# ----------------------------------------------------

@app.get("/api/canjes")
def get_canjes(limit: int = 150, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    canjes = db.query(CanjeDivisa).order_by(CanjeDivisa.fecha.desc()).limit(limit).all()
    result = []
    for c in canjes:
        result.append({
            "id": c.id,
            "fecha": c.fecha.strftime("%d/%m/%Y %I:%M %p") if c.fecha else "",
            "origen_plataforma": c.origen_plataforma,
            "monto_entregado": c.monto_entregado,
            "destino_plataforma": c.destino_plataforma,
            "monto_recibido": c.monto_recibido,
            "comision_canje_pct": c.comision_canje_pct,
            "comision_reposicion_pct": c.comision_reposicion_pct,
            "comisiones_operativas_pct": c.comisiones_operativas_pct,
            "ganancia_bruta_usd": c.ganancia_bruta_usd,
            "ganancia_neta_usd": c.ganancia_neta_usd,
            "cliente_nombre": c.cliente_nombre or "",
            "detalles": c.detalles or "",
            "capture_url": c.capture_url or ""
        })
    return result

@app.post("/api/canjes")
def create_canje(req: CanjeDivisaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    fecha_mov = parse_date_string(req.fecha) if req.fecha else get_venezuela_time()
    
    # 1. Calculate profits
    ganancia_bruta = round(req.monto_recibido - req.monto_entregado, 2)
    deduc_repo = round(req.monto_entregado * ((req.comision_reposicion_pct or 0.0) / 100.0), 2)
    deduc_op = round(req.monto_entregado * ((req.comisiones_operativas_pct or 0.0) / 100.0), 2)
    ganancia_neta = req.ganancia_neta_usd if (req.ganancia_neta_usd is not None and req.ganancia_neta_usd != 0.0) else round(ganancia_bruta - deduc_repo - deduc_op, 2)
    
    # 2. Adjust Origin Capital Platform
    db_plat_orig = map_plataforma_nombre(req.origen_plataforma, "USD")
    plat_orig = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_orig)).first()
    if plat_orig:
        if plat_orig.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            plat_orig.saldo_ves -= (req.monto_entregado * bcv)
        else:
            plat_orig.saldo_usd -= req.monto_entregado

    # 3. Adjust Destination Capital Platform
    db_plat_dest = map_plataforma_nombre(req.destino_plataforma, "USD")
    plat_dest = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_dest)).first()
    if plat_dest:
        if plat_dest.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            plat_dest.saldo_ves += (req.monto_recibido * bcv)
        else:
            plat_dest.saldo_usd += req.monto_recibido

    # 4. Save Canje Record
    canje = CanjeDivisa(
        fecha=fecha_mov,
        origen_plataforma=req.origen_plataforma,
        monto_entregado=req.monto_entregado,
        destino_plataforma=req.destino_plataforma,
        monto_recibido=req.monto_recibido,
        comision_canje_pct=req.comision_canje_pct,
        comision_reposicion_pct=req.comision_reposicion_pct,
        comisiones_operativas_pct=req.comisiones_operativas_pct,
        ganancia_bruta_usd=ganancia_bruta,
        ganancia_neta_usd=ganancia_neta,
        cliente_nombre=req.cliente_nombre,
        detalles=req.detalles,
        capture_url=req.capture_url
    )
    db.add(canje)
    db.commit()
    db.refresh(canje)
    return {"message": "Canje de divisas registrado con éxito", "id": canje.id}

@app.put("/api/canjes/{canje_id}")
def update_canje(canje_id: int, req: CanjeDivisaUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    canje = db.query(CanjeDivisa).filter(CanjeDivisa.id == canje_id).first()
    if not canje:
        raise HTTPException(status_code=404, detail="Canje no encontrado")
        
    # 1. Revert previous capital impacts
    old_plat_orig = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(canje.origen_plataforma, "USD"))).first()
    if old_plat_orig:
        if old_plat_orig.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            old_plat_orig.saldo_ves += (canje.monto_entregado * bcv)
        else:
            old_plat_orig.saldo_usd += canje.monto_entregado

    old_plat_dest = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(canje.destino_plataforma, "USD"))).first()
    if old_plat_dest:
        if old_plat_dest.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            old_plat_dest.saldo_ves -= (canje.monto_recibido * bcv)
        else:
            old_plat_dest.saldo_usd -= canje.monto_recibido

    # 2. Apply new capital impacts
    new_plat_orig = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(req.origen_plataforma, "USD"))).first()
    if new_plat_orig:
        if new_plat_orig.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            new_plat_orig.saldo_ves -= (req.monto_entregado * bcv)
        else:
            new_plat_orig.saldo_usd -= req.monto_entregado

    new_plat_dest = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(req.destino_plataforma, "USD"))).first()
    if new_plat_dest:
        if new_plat_dest.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            new_plat_dest.saldo_ves += (req.monto_recibido * bcv)
        else:
            new_plat_dest.saldo_usd += req.monto_recibido

    # 3. Calculate new profits
    ganancia_bruta = round(req.monto_recibido - req.monto_entregado, 2)
    deduc_repo = round(req.monto_entregado * ((req.comision_reposicion_pct or 0.0) / 100.0), 2)
    deduc_op = round(req.monto_entregado * ((req.comisiones_operativas_pct or 0.0) / 100.0), 2)
    ganancia_neta = req.ganancia_neta_usd if (req.ganancia_neta_usd is not None and req.ganancia_neta_usd != 0.0) else round(ganancia_bruta - deduc_repo - deduc_op, 2)

    if req.fecha:
        canje.fecha = parse_date_string(req.fecha)
    canje.origen_plataforma = req.origen_plataforma
    canje.monto_entregado = req.monto_entregado
    canje.destino_plataforma = req.destino_plataforma
    canje.monto_recibido = req.monto_recibido
    canje.comision_canje_pct = req.comision_canje_pct
    canje.comision_reposicion_pct = req.comision_reposicion_pct
    canje.comisiones_operativas_pct = req.comisiones_operativas_pct
    canje.ganancia_bruta_usd = ganancia_bruta
    canje.ganancia_neta_usd = ganancia_neta
    canje.cliente_nombre = req.cliente_nombre
    canje.detalles = req.detalles
    canje.capture_url = req.capture_url
    
    db.commit()
    db.refresh(canje)
    return {"message": "Canje de divisas actualizado con éxito"}

@app.delete("/api/canjes/{canje_id}")
def delete_canje(canje_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    canje = db.query(CanjeDivisa).filter(CanjeDivisa.id == canje_id).first()
    if not canje:
        raise HTTPException(status_code=404, detail="Canje no encontrado")
        
    # Revert capital impacts
    plat_orig = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(canje.origen_plataforma, "USD"))).first()
    if plat_orig:
        if plat_orig.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            plat_orig.saldo_ves += (canje.monto_entregado * bcv)
        else:
            plat_orig.saldo_usd += canje.monto_entregado

    plat_dest = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(map_plataforma_nombre(canje.destino_plataforma, "USD"))).first()
    if plat_dest:
        if plat_dest.convertir_ves:
            bcv = bcv_state.cached_rate or 36.5
            plat_dest.saldo_ves -= (canje.monto_recibido * bcv)
        else:
            plat_dest.saldo_usd -= canje.monto_recibido

    db.delete(canje)
    db.commit()
    return {"message": "Canje eliminado y capital restaurado con éxito"}

# Telegram Bot Webhook Integration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_ALLOWED_USER_ID = os.getenv("TELEGRAM_ALLOWED_USER_ID")

# In-memory deduplication cache & concurrency lock
import time
import threading

_processed_telegram_updates = {}   # update_id -> timestamp
_processed_telegram_messages = {}  # (chat_id, message_id) -> timestamp
_telegram_lock = threading.Lock()

def _check_and_register_telegram_event(update_id: int, chat_id: int, message_id: int) -> bool:
    """Returns True if duplicate (already processed or currently processing), False otherwise."""
    if not update_id and not (chat_id and message_id):
        return False
        
    now = time.time()
    with _telegram_lock:
        # Purge entries older than 30 minutes (1800s)
        expired_updates = [k for k, v in _processed_telegram_updates.items() if now - v > 1800]
        for k in expired_updates:
            del _processed_telegram_updates[k]
            
        expired_msgs = [k for k, v in _processed_telegram_messages.items() if now - v > 1800]
        for k in expired_msgs:
            del _processed_telegram_messages[k]
            
        # Check if already processed
        if update_id and update_id in _processed_telegram_updates:
            return True
        if chat_id and message_id and (chat_id, message_id) in _processed_telegram_messages:
            return True
            
        # Register immediately to block concurrent duplicates/retries
        if update_id:
            _processed_telegram_updates[update_id] = now
        if chat_id and message_id:
            _processed_telegram_messages[(chat_id, message_id)] = now
            
        return False

def send_telegram_message(chat_id: int, text: str):
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        requests.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }, timeout=10)
    except Exception as e:
        print(f"Error sending message to telegram: {e}")

def download_telegram_file(file_id: str) -> str:
    if not TELEGRAM_BOT_TOKEN:
        return None
    try:
        # 1. Get file path
        get_file_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}"
        res = requests.get(get_file_url, timeout=15).json()
        file_path = res.get("result", {}).get("file_path")
        if not file_path:
            return None
            
        # 2. Download the file data
        download_url = f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"
        file_data = requests.get(download_url, timeout=20).content
        
        # 3. Compress using Pillow and encode to base64
        import io
        import base64
        from PIL import Image
        
        try:
            img = Image.open(io.BytesIO(file_data))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Resize if too large to keep base64 string small (20-30KB)
            max_size = 800
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=60, optimize=True)
            compressed_data = buffer.getvalue()
            
            encoded = base64.b64encode(compressed_data).decode("utf-8")
            return f"data:image/jpeg;base64,{encoded}"
        except Exception as img_err:
            print(f"Pillow compression failed, using raw base64: {img_err}")
            encoded = base64.b64encode(file_data).decode("utf-8")
            mime_type = "image/jpeg"
            if file_path.lower().endswith(".png"):
                mime_type = "image/png"
            elif file_path.lower().endswith(".gif"):
                mime_type = "image/gif"
            return f"data:{mime_type};base64,{encoded}"
    except Exception as e:
        print(f"Error downloading telegram file: {e}")
        return None

import re

@app.post("/api/webhooks/telegram")
async def telegram_webhook(update: dict, db: Session = Depends(get_db)):
    # Ignore edited message updates to prevent re-processing transactions
    if "edited_message" in update and "message" not in update:
        return {"status": "ignored_edit"}
        
    update_id = update.get("update_id")
    message = update.get("message") or update.get("channel_post") or update.get("edited_message") or {}
    chat_id = message.get("chat", {}).get("id")
    message_id = message.get("message_id")
    sender_id = str(message.get("from", {}).get("id", ""))
    
    if not chat_id:
        return {"status": "ignored"}
        
    # Deduplicación inmediata (bloquea reintentos automáticos de Telegram o envíos paralelos)
    if _check_and_register_telegram_event(update_id, chat_id, message_id):
        print(f"Telegram webhook duplicate ignored: update_id={update_id}, msg_id={message_id}")
        return {"status": "already_processed"}
        
    # Validar que el usuario esté autorizado
    if not TELEGRAM_ALLOWED_USER_ID:
        send_telegram_message(chat_id, "⚠️ **Configuración incompleta:** `TELEGRAM_ALLOWED_USER_ID` no está configurado en el servidor.")
        return {"status": "ignored"}
        
    allowed_ids = [x.strip() for x in str(TELEGRAM_ALLOWED_USER_ID).split(",") if x.strip()]
    if sender_id not in allowed_ids:
        send_telegram_message(chat_id, "❌ **Acceso denegado.** Tu ID de Telegram no está autorizado para interactuar con este bot.")
        return {"status": "denied"}
        
    text = message.get("text") or message.get("caption") or ""
    text = text.strip()
    
    # Descargar capture de imagen si existe
    photo_list = message.get("photo", [])
    capture_url = None
    if photo_list:
        largest_photo = photo_list[-1]
        file_id = largest_photo.get("file_id")
        capture_url = download_telegram_file(file_id)
        
    # Expresiones regulares de parseo
    income_match = re.match(r"^\+\s*([0-9]+(?:\.[0-9]+)?)\s+(.+)$", text)
    expense_match = re.match(r"^-\s*([0-9]+(?:\.[0-9]+)?)\s+(.+)$", text)
    
    fecha_mov = get_venezuela_time()
    
    if income_match:
        monto = float(income_match.group(1))
        names_str = income_match.group(2).strip()
        
        # Separar Cliente / Titular por barra diagonal "/"
        if "/" in names_str:
            parts = names_str.split("/", 1)
            cliente = parts[0].strip()
            titular = parts[1].strip()
        else:
            cliente = names_str
            titular = names_str
            
        # Prevención de duplicados en base de datos (ventana de seguridad de 120 segundos para el mismo monto y cliente)
        recent_window = fecha_mov - datetime.timedelta(seconds=120)
        duplicate_entry = db.query(MovimientoZelle).filter(
            MovimientoZelle.tipo == "ingreso",
            MovimientoZelle.monto == monto,
            MovimientoZelle.cliente_nombre == cliente,
            MovimientoZelle.fecha >= recent_window
        ).first()

        if duplicate_entry:
            print(f"Ignored duplicate Telegram Zelle income: {monto} for {cliente} (already recorded ID #{duplicate_entry.id})")
            send_telegram_message(
                chat_id,
                f"⚠️ **Aviso de Duplicado:**\n\n"
                f"Este movimiento de `+${monto:.2f}` ({cliente}) ya fue registrado hace un instante (ID: `#{duplicate_entry.id}`).\n"
                f"🛡️ **Protección Antiduplicados Activa:** No se volvió a sumar a la cuenta Zelle."
            )
            return {"status": "ignored_duplicate", "id": duplicate_entry.id}
            
        # Insertar movimiento como "pendiente"
        mov = MovimientoZelle(
            fecha=fecha_mov,
            tipo="ingreso",
            monto=monto,
            cliente_nombre=cliente,
            titular=titular,
            detalle="Registrado vía Bot de Telegram",
            estado="pendiente",
            capture_url=capture_url
        )
        db.add(mov)
        
        # Sumar al saldo de la cuenta Zelle en DistribucionCapital
        zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
        if zelle_plat:
            zelle_plat.saldo_usd = round(zelle_plat.saldo_usd + monto, 2)
            
        db.commit()
        db.refresh(mov)
        
        saldo_actual = zelle_plat.saldo_usd if zelle_plat else 0.0
        
        msg = (
            f"✅ **Ingreso Zelle Registrado**\n\n"
            f"💵 **Monto:** `${monto:.2f}`\n"
            f"👤 **Cliente:** `{cliente}`\n"
            f"🏦 **Emisor Zelle:** `{titular}`\n"
            f"📸 **Capture:** {'Guardado exitosamente' if capture_url else 'No provisto'}\n\n"
            f"📊 **Saldo Actual Zelle:** `${saldo_actual:.2f}`"
        )
        send_telegram_message(chat_id, msg)
        
    elif expense_match:
        monto = float(expense_match.group(1))
        detalle = expense_match.group(2).strip()
        
        # Prevención de duplicados en base de datos (ventana de seguridad de 120 segundos para el mismo monto y detalle)
        recent_window = fecha_mov - datetime.timedelta(seconds=120)
        duplicate_entry = db.query(MovimientoZelle).filter(
            MovimientoZelle.tipo == "egreso",
            MovimientoZelle.monto == monto,
            MovimientoZelle.detalle == detalle,
            MovimientoZelle.fecha >= recent_window
        ).first()

        if duplicate_entry:
            print(f"Ignored duplicate Telegram Zelle expense: {monto} ({detalle}) (already recorded ID #{duplicate_entry.id})")
            send_telegram_message(
                chat_id,
                f"⚠️ **Aviso de Duplicado:**\n\n"
                f"Este egreso de `-${monto:.2f}` ({detalle}) ya fue registrado hace un instante (ID: `#{duplicate_entry.id}`).\n"
                f"🛡️ **Protección Antiduplicados Activa:** No se volvió a restar de la cuenta Zelle."
            )
            return {"status": "ignored_duplicate", "id": duplicate_entry.id}
            
        # Insertar egreso como "completado"
        mov = MovimientoZelle(
            fecha=fecha_mov,
            tipo="egreso",
            monto=monto,
            detalle=detalle,
            estado="completado",
            capture_url=capture_url
        )
        db.add(mov)
        
        # Restar del saldo de la cuenta Zelle en DistribucionCapital
        zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
        if zelle_plat:
            zelle_plat.saldo_usd = round(zelle_plat.saldo_usd - monto, 2)
            
        db.commit()
        db.refresh(mov)
        
        saldo_actual = zelle_plat.saldo_usd if zelle_plat else 0.0
        
        msg = (
            f"✅ **Egreso Zelle Registrado**\n\n"
            f"💸 **Monto:** `-${monto:.2f}`\n"
            f"📝 **Detalle/Concepto:** `{detalle}`\n"
            f"📸 **Capture:** {'Guardado exitosamente' if capture_url else 'No provisto'}\n\n"
            f"📊 **Saldo Actual Zelle:** `${saldo_actual:.2f}`"
        )
        send_telegram_message(chat_id, msg)
        
    elif text.lower() in ("saldo", "/saldo", "zelle", "capital"):
        zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
        saldo_actual = zelle_plat.saldo_usd if zelle_plat else 0.0
        
        # Contar movimientos pendientes de remesar
        pendientes = db.query(MovimientoZelle).filter(MovimientoZelle.estado == "pendiente").count()
        
        msg = (
            f"📊 **Estado de Cuenta Zelle**\n\n"
            f"🏦 **Saldo en Cuenta:** `${saldo_actual:.2f}`\n"
            f"⏳ **Zelles por Remesar:** `{pendientes}`"
        )
        send_telegram_message(chat_id, msg)
        
    else:
        # Comando no reconocido
        msg = (
            f"❓ **Comando no reconocido**\n\n"
            f"Usa los siguientes formatos:\n"
            f"• `+100 Cliente / Titular` (Registrar Ingreso)\n"
            f"• `-50 Alquiler` (Registrar Egreso)\n"
            f"• `saldo` (Ver saldo actual)\n\n"
            f"*(Puedes adjuntar la imagen del capture en cualquiera de los comandos)*"
        )
        send_telegram_message(chat_id, msg)
        
    return {"status": "processed"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), username: str = Depends(get_current_user)):
    try:
        # Check folders
        base_dir = os.path.dirname(os.path.abspath(__file__))
        upload_dir = os.path.join(base_dir, "static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        # Save file
        filename = f"manual_{int(datetime.datetime.now().timestamp())}_{os.path.basename(file.filename)}"
        local_path = os.path.join(upload_dir, filename)
        with open(local_path, "wb") as f:
            f.write(await file.read())
        return {"capture_url": f"/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {e}")

# Titulares & Cards Routes
@app.get("/api/titulares")
def get_titulares(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    titulares = db.query(Titular).all()
    
    # Calculate monthly and daily consumption per card
    now = get_venezuela_time()
    start_of_month = datetime.datetime(now.year, now.month, 1)
    start_of_day = datetime.datetime(now.year, now.month, now.day)
    
    result = []
    for tit in titulares:
        cards_data = []
        for card in tit.tarjetas:
            # Query sum of purchases in this month for this card
            purchases_sum = db.query(CompraDivisa).filter(
                CompraDivisa.tarjeta_id == card.id,
                CompraDivisa.fecha >= start_of_month
            ).all()
            
            cycle_purchases_sum = db.query(CompraCicloParcial).filter(
                CompraCicloParcial.tarjeta_id == card.id,
                CompraCicloParcial.fecha >= start_of_month
            ).all()
            
            card_comm = card.comision_porcentaje or 0.0
            monthly_consumed = (
                sum(p.monto_usd * (1.0 - card_comm) for p in purchases_sum) +
                sum(cp.usd_procesados if (cp.usd_procesados and cp.usd_procesados > 0) else (cp.usd_comprados * (1.0 - card_comm)) for cp in cycle_purchases_sum)
            )
            
            # Query sum of purchases today for this card
            purchases_today = db.query(CompraDivisa).filter(
                CompraDivisa.tarjeta_id == card.id,
                CompraDivisa.fecha >= start_of_day
            ).all()
            
            cycle_purchases_today = db.query(CompraCicloParcial).filter(
                CompraCicloParcial.tarjeta_id == card.id,
                CompraCicloParcial.fecha >= start_of_day
            ).all()
            
            daily_consumed = (
                sum(p.monto_usd * (1.0 - card_comm) for p in purchases_today) +
                sum(cp.usd_procesados if (cp.usd_procesados and cp.usd_procesados > 0) else (cp.usd_comprados * (1.0 - card_comm)) for cp in cycle_purchases_today)
            )
            
            cards_data.append({
                "id": card.id,
                "banco": card.banco,
                "tipo_tarjeta": card.tipo_tarjeta,
                "limite_diario": card.limite_diario,
                "limite_mensual": card.limite_mensual,
                "comision_porcentaje": card.comision_porcentaje,
                "consumo_mensual": monthly_consumed,
                "consumo_diario": daily_consumed
            })
            
        # Calculate bank-level annual and monthly consumption for this titular
        start_of_year = datetime.datetime(now.year, 1, 1)
        # Find unique bank names that this titular has cards in
        card_ids_by_bank = {}
        for card in tit.tarjetas:
            if card.banco not in card_ids_by_bank:
                card_ids_by_bank[card.banco] = []
            card_ids_by_bank[card.banco].append(card.id)
            
        bancos_limites = []
        for b_name, c_ids in card_ids_by_bank.items():
            annual_consumed = 0.0
            monthly_consumed_bank = 0.0
            
            if c_ids:
                # Annual sum
                cd_year = db.query(CompraDivisa).filter(
                    CompraDivisa.tarjeta_id.in_(c_ids),
                    CompraDivisa.fecha >= start_of_year
                ).all()
                ccp_year = db.query(CompraCicloParcial).filter(
                    CompraCicloParcial.tarjeta_id.in_(c_ids),
                    CompraCicloParcial.fecha >= start_of_year
                ).all()
                annual_consumed = sum(p.monto_usd for p in cd_year) + sum(cp.usd_comprados for cp in ccp_year)
                
                # Monthly sum
                cd_month = db.query(CompraDivisa).filter(
                    CompraDivisa.tarjeta_id.in_(c_ids),
                    CompraDivisa.fecha >= start_of_month
                ).all()
                ccp_month = db.query(CompraCicloParcial).filter(
                    CompraCicloParcial.tarjeta_id.in_(c_ids),
                    CompraCicloParcial.fecha >= start_of_month
                ).all()
                monthly_consumed_bank = sum(p.monto_usd for p in cd_month) + sum(cp.usd_comprados for cp in ccp_month)
                
            bancos_limites.append({
                "banco": b_name,
                "consumo_anual": annual_consumed,
                "limite_anual": 12000.0,
                "consumo_mensual": monthly_consumed_bank,
                "limite_mensual": 1000.0 if b_name.lower() == "mercantil" else 999999.0
            })
            
        result.append({
            "id": tit.id,
            "nombre": tit.nombre,
            "tercera_edad": tit.tercera_edad,
            "tarjetas": cards_data,
            "bancos_limites": bancos_limites
        })
    return result

@app.post("/api/titulares")
def create_titular(req: TitularCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Titular).filter(Titular.nombre == req.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="El titular ya existe")
    tit = Titular(nombre=req.nombre, tercera_edad=req.tercera_edad)
    db.add(tit)
    db.commit()
    return {"message": f"Titular {tit.nombre} creado con éxito", "id": tit.id}

@app.post("/api/tarjetas")
def create_tarjeta(req: TarjetaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    card = Tarjeta(
        titular_id=req.titular_id,
        banco=req.banco,
        tipo_tarjeta=req.tipo_tarjeta,
        limite_diario=req.limite_diario,
        limite_mensual=req.limite_mensual,
        comision_porcentaje=req.comision_porcentaje
    )
    db.add(card)
    db.commit()
    return {"message": "Tarjeta agregada exitosamente", "id": card.id}

@app.delete("/api/tarjetas/{tarjeta_id}")
def delete_tarjeta(tarjeta_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Tarjeta).filter(Tarjeta.id == tarjeta_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    db.delete(card)
    db.commit()
    return {"message": "Tarjeta eliminada exitosamente"}

@app.delete("/api/titulares/{titular_id}")
def delete_titular(titular_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    tit = db.query(Titular).filter(Titular.id == titular_id).first()
    if not tit:
        raise HTTPException(status_code=404, detail="Titular no encontrado")
    db.delete(tit)
    db.commit()
    return {"message": "Titular eliminado exitosamente"}

@app.post("/api/titulares/{titular_id}/reset-limites")
def reset_titular_limites(titular_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    titular = db.query(Titular).filter(Titular.id == titular_id).first()
    if not titular:
        raise HTTPException(status_code=404, detail="Titular no encontrado")
        
    card_ids = [card.id for card in titular.tarjetas]
    if card_ids:
        # Delete standalone compras from Bitácora de Compras for these cards
        db.query(CompraDivisa).filter(CompraDivisa.tarjeta_id.in_(card_ids)).delete(synchronize_session=False)
        
        # Unlink partial purchases in cycles associated with these cards so card & bank limits reset to $0
        subcompras = db.query(CompraCicloParcial).filter(CompraCicloParcial.tarjeta_id.in_(card_ids)).all()
        for sub in subcompras:
            sub.tarjeta_id = None
            
        db.commit()
        
    return {"message": f"Límites de tarjetas y cuentas del titular '{titular.nombre}' reseteados a $0.00 exitosamente."}

# Divisas Purchases (Bitácora de Compras)
@app.get("/api/compras")
def get_compras(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Fetch standalone purchases
    compras_directas = db.query(CompraDivisa).all()
    
    # 2. Fetch partial purchases from cycles
    compras_ciclos = db.query(CompraCicloParcial).all()
    
    result = []
    
    # Process standalone purchases
    for c in compras_directas:
        card = c.tarjeta
        tit = card.titular if card else None
        compra_comm_pct = 0.0 if (tit and tit.tercera_edad) else 0.005
        calc_comision_ves = (c.monto_usd * c.tasa_bcv) * compra_comm_pct
        result.append({
            "id": f"dir-{c.id}", # unique ID string prefix
            "raw_id": c.id,
            "tipo": "Directa",
            "fecha_obj": c.fecha,
            "fecha": c.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "tarjeta_id": c.tarjeta_id,
            "banco": card.banco if card else "N/A",
            "tipo_tarjeta": card.tipo_tarjeta if card else "N/A",
            "titular": tit.nombre if tit else "N/A",
            "monto_usd": c.monto_usd,
            "tasa_bcv": c.tasa_bcv,
            "comision_ves": calc_comision_ves
        })
        
    # Process cycle partial purchases
    for cp in compras_ciclos:
        card = cp.tarjeta
        tit = card.titular if card else None
        # Use commission from cycle purchase directly, or calculate if not present
        calc_comision_ves = cp.comision_compra_ves if cp.comision_compra_ves is not None else 0.0
        result.append({
            "id": f"cic-{cp.id}", # unique ID string prefix
            "raw_id": cp.id,
            "tipo": f"Ciclo #{cp.ciclo_id}",
            "fecha_obj": cp.fecha,
            "fecha": cp.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "tarjeta_id": cp.tarjeta_id,
            "banco": card.banco if card else (cp.banco or "N/A"),
            "tipo_tarjeta": card.tipo_tarjeta if card else "N/A",
            "titular": tit.nombre if tit else "N/A",
            "monto_usd": cp.usd_comprados,
            "tasa_bcv": cp.tasa_bcv,
            "comision_ves": calc_comision_ves
        })
        
    # Sort all combined purchases by date descending
    result.sort(key=lambda x: x["fecha_obj"], reverse=True)
    
    # Return the latest 150 items
    return result[:150]

@app.post("/api/compras")
def create_compra(req: CompraDivisaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
    tit = card.titular
    commission_pct = 0.0 if (tit and tit.tercera_edad) else 0.005
    monto_ves = req.monto_usd * req.tasa_bcv
    comision_ves = monto_ves * commission_pct
    
    compra_fecha = get_venezuela_time()
    if req.fecha:
        compra_fecha = parse_date_string(req.fecha)
        
    compra = CompraDivisa(
        tarjeta_id=req.tarjeta_id,
        fecha=compra_fecha,
        monto_usd=round(req.monto_usd, 2),
        tasa_bcv=round(req.tasa_bcv, 2),
        comision_ves=round(comision_ves, 2)
    )
    db.add(compra)
    db.commit()
    return {"message": "Compra de divisas registrada en la bitácora", "id": compra.id, "comision_ves": round(comision_ves, 2)}

@app.post("/api/compras")
def create_compra_api(req: CompraDivisaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_compra(req, username, db)

@app.put("/api/compras/{compra_id}")
def update_compra(compra_id: int, req: CompraDivisaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    compra = db.query(CompraDivisa).filter(CompraDivisa.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
        
    card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
    tit = card.titular
    commission_pct = 0.0 if (tit and tit.tercera_edad) else 0.005
    monto_ves = req.monto_usd * req.tasa_bcv
    comision_ves = monto_ves * commission_pct
    
    compra.tarjeta_id = req.tarjeta_id
    compra.monto_usd = round(req.monto_usd, 2)
    compra.tasa_bcv = round(req.tasa_bcv, 2)
    compra.comision_ves = round(comision_ves, 2)
    if req.fecha:
        compra.fecha = parse_date_string(req.fecha)
        
    db.commit()
    return {"message": "Compra de divisas actualizada con éxito"}

@app.delete("/api/compras/{compra_id}")
def delete_compra(compra_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    compra = db.query(CompraDivisa).filter(CompraDivisa.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    db.delete(compra)
    db.commit()
    return {"message": "Compra de divisas eliminada con éxito"}

# Cycles Routes
@app.get("/api/ciclos")
def get_ciclos(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclos = db.query(HistorialCiclos).order_by(HistorialCiclos.fecha.desc()).limit(100).all()
    result = []
    for c in ciclos:
        compras = []
        for cp in c.compras_parciales:
            # Exclude personal expenses from the cycle's purchases view
            if cp.usd_comprados is None or cp.usd_comprados == 0.0:
                continue
            card = cp.tarjeta
            tit = card.titular if card else None
            compras.append({
                "id": cp.id,
                "fecha": cp.fecha.strftime("%d/%m/%Y %I:%M %p"),
                "usd_comprados": cp.usd_comprados,
                "usd_procesados": cp.usd_procesados,
                "tasa_bcv": cp.tasa_bcv,
                "comision_compra_ves": cp.comision_compra_ves,
                "transferencias_ves": cp.transferencias_ves,
                "usd_recibidos_binance": cp.usd_recibidos_binance,
                "banco": cp.banco,
                "tarjeta_id": cp.tarjeta_id,
                "titular": tit.nombre if tit else None,
                "tipo_tarjeta": card.tipo_tarjeta if card else None
            })
        result.append({
            "id": c.id,
            "fecha": c.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "usdt_vendidos": c.usdt_vendidos,
            "tasa_venta": c.tasa_venta,
            "banco_venta": c.banco_venta,
            "divisas_compradas": c.divisas_compradas,
            "tasa_bcv": c.tasa_bcv,
            "comision_compra_ves": c.comision_compra_ves,
            "transferencias_ves": c.transferencias_ves,
            "usd_procesados_binance": c.usd_procesados_binance,
            "usd_recibidos_binance": c.usd_recibidos_binance,
            "ganancia_usd": c.ganancia_usd,
            "ganancia_porcentaje": c.ganancia_porcentaje,
            "bolivares_restantes": c.bolivares_restantes,
            "status": c.status or "completado",
            "bolivares_sobre_restantes": c.bolivares_sobre_restantes or 0.0,
            "tarjeta_id": c.tarjeta_id,
            "compras_parciales": compras
        })
    return result

@app.post("/api/ciclos")
def create_ciclo(req: CicloCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    card_banco = None
    if req.tarjeta_id:
        card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_id).first()
        if card:
            card_banco = card.banco
            
    fecha_ciclo = parse_date_string(req.fecha) if req.fecha else get_venezuela_time()
    
    ciclo = HistorialCiclos(
        fecha=fecha_ciclo,
        usdt_vendidos=round(req.usdt_vendidos, 2),
        tasa_venta=round(req.tasa_venta, 2),
        banco_venta=req.banco_venta,
        divisas_compradas=round(req.divisas_compradas, 2),
        tasa_bcv=round(req.tasa_bcv, 2),
        comision_compra_ves=round(req.comision_compra_ves, 2),
        transferencias_ves=round(req.transferencias_ves, 2),
        usd_procesados_binance=round(req.usd_procesados_binance, 2),
        usd_recibidos_binance=round(req.usd_recibidos_binance, 2),
        ganancia_usd=round(req.ganancia_usd, 2),
        ganancia_porcentaje=round(req.ganancia_porcentaje, 2),
        bolivares_restantes=round(req.bolivares_restantes, 2),
        status=req.status or "completado",
        bolivares_sobre_restantes=round(req.bolivares_sobre_restantes or 0.0, 2),
        tarjeta_id=req.tarjeta_id
    )
    db.add(ciclo)
    db.flush()
    
    if req.status == "abierto" and req.divisas_compradas > 0:
        compra_inicial = CompraCicloParcial(
            ciclo_id=ciclo.id,
            fecha=fecha_ciclo,
            usd_comprados=round(req.divisas_compradas, 2),
            usd_procesados=round(req.usd_procesados_binance, 2),
            tasa_bcv=round(req.tasa_bcv, 2),
            comision_compra_ves=round(req.comision_compra_ves, 2),
            transferencias_ves=round(req.transferencias_ves, 2),
            usd_recibidos_binance=round(req.usd_recibidos_binance, 2),
            banco=card_banco or req.banco_venta or "Banco",
            tarjeta_id=req.tarjeta_id
        )
        db.add(compra_inicial)
        
    db.commit()
    return {"message": "Ciclo de arbitraje registrado exitosamente", "id": ciclo.id}

@app.get("/api/ciclos/activos")
def get_ciclos_activos(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclos = db.query(HistorialCiclos).filter(HistorialCiclos.status == "abierto").order_by(HistorialCiclos.fecha.desc()).all()
    result = []
    for c in ciclos:
        compras = []
        for cp in c.compras_parciales:
            # Exclude personal expenses from the cycle's purchases view
            if cp.usd_comprados is None or cp.usd_comprados == 0.0:
                continue
            card = cp.tarjeta
            tit = card.titular if card else None
            compras.append({
                "id": cp.id,
                "fecha": cp.fecha.strftime("%d/%m/%Y %I:%M %p"),
                "usd_comprados": cp.usd_comprados,
                "usd_procesados": cp.usd_procesados,
                "tasa_bcv": cp.tasa_bcv,
                "comision_compra_ves": cp.comision_compra_ves,
                "transferencias_ves": cp.transferencias_ves,
                "usd_recibidos_binance": cp.usd_recibidos_binance,
                "banco": cp.banco,
                "tarjeta_id": cp.tarjeta_id,
                "titular": tit.nombre if tit else None,
                "tipo_tarjeta": card.tipo_tarjeta if card else None
            })
        result.append({
            "id": c.id,
            "fecha": c.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "usdt_vendidos": c.usdt_vendidos,
            "tasa_venta": c.tasa_venta,
            "banco_venta": c.banco_venta,
            "divisas_compradas": c.divisas_compradas,
            "tasa_bcv": c.tasa_bcv,
            "comision_compra_ves": c.comision_compra_ves,
            "transferencias_ves": c.transferencias_ves,
            "usd_procesados_binance": c.usd_procesados_binance,
            "usd_recibidos_binance": c.usd_recibidos_binance,
            "ganancia_usd": c.ganancia_usd,
            "ganancia_porcentaje": c.ganancia_porcentaje,
            "bolivares_restantes": c.bolivares_restantes,
            "status": c.status,
            "bolivares_sobre_restantes": c.bolivares_sobre_restantes,
            "tarjeta_id": c.tarjeta_id,
            "compras_parciales": compras
        })
    return result

@app.post("/api/ciclos/{ciclo_id}/compras")
def create_ciclo_compra_parcial(ciclo_id: int, req: CompraCicloParcialCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    compra = CompraCicloParcial(
        ciclo_id=ciclo_id,
        fecha=get_venezuela_time(),
        usd_comprados=round(req.usd_comprados, 2),
        usd_procesados=round(req.usd_procesados, 2),
        tasa_bcv=round(req.tasa_bcv, 2),
        comision_compra_ves=round(req.comision_compra_ves, 2),
        transferencias_ves=round(req.transferencias_ves, 2),
        usd_recibidos_binance=round(req.usd_recibidos_binance, 2),
        banco=req.banco,
        tarjeta_id=req.tarjeta_id
    )
    db.add(compra)
    
    costo_ves = round(req.usd_comprados * req.tasa_bcv, 2)
    total_ves_gastado = round(costo_ves + req.comision_compra_ves + req.transferencias_ves, 2)
    
    ciclo.bolivares_sobre_restantes = round(max(0.0, (ciclo.bolivares_sobre_restantes or 0.0) - total_ves_gastado), 2)
    
    # Recalcular estadísticas del ciclo centralizado
    recalculate_ciclo_stats(ciclo, db)
    
    if ciclo.bolivares_sobre_restantes <= 0.01:
        ciclo.status = "completado"
        
    # Sincronización automática de saldo en DistribucionCapital para el banco emisor
    bank_clean = (req.banco or ciclo.banco_venta or "").lower()
    target_platform = None
    if "provincial" in bank_clean:
        target_platform = "Banco Provincial (VES)"
    elif "venezuela" in bank_clean or "bdv" in bank_clean:
        target_platform = "Banco de Venezuela (VES)"
    elif "mercantil" in bank_clean:
        target_platform = "Banco Mercantil (VES)"
    elif "bancamiga" in bank_clean:
        target_platform = "Bancamiga (VES)"
        
    if target_platform:
        plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == target_platform).first()
        if plat:
            plat.saldo_ves = round(max(0.0, (plat.saldo_ves or 0.0) - total_ves_gastado), 2)

    db.commit()
    return {"message": "Compra parcial registrada con éxito", "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes, "status": ciclo.status}

@app.post("/api/ciclos/{ciclo_id}/pivot")
def pivot_ciclo_bolivares(ciclo_id: int, req: PivotVESRequest, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    total_deduccion = req.monto_ves_transferido + req.comision_transferencia_ves
    if total_deduccion > ciclo.bolivares_sobre_restantes + 0.01:
        raise HTTPException(status_code=400, detail="Saldo insuficiente en el sobre para realizar esta transferencia")
        
    ciclo.bolivares_sobre_restantes = max(0.0, ciclo.bolivares_sobre_restantes - total_deduccion)
    ciclo.transferencias_ves += req.comision_transferencia_ves
    ciclo.tarjeta_id = req.tarjeta_destino_id
    
    card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_destino_id).first()
    if card:
        ciclo.banco_venta = f"{ciclo.banco_venta} ➔ {card.banco}"
        
    # Recalcular estadísticas del ciclo centralizado
    recalculate_ciclo_stats(ciclo, db)
    
    db.commit()
    return {"message": "Transferencia de bolívares registrada con éxito", "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes}

@app.post("/api/ciclos/{ciclo_id}/close")
def close_ciclo_manual(ciclo_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    ciclo.bolivares_sobre_restantes = 0.0
    ciclo.bolivares_restantes = 0.0
    ciclo.status = "completado"
    
    # Sumar sólo compras de divisas reales (excluyendo gastos personales)
    total_ves_spent_cp = sum(
        ((cp.usd_comprados or 0.0) * (cp.tasa_bcv or 0.0)) + (cp.comision_compra_ves or 0.0) + (cp.transferencias_ves or 0.0) 
        for cp in (ciclo.compras_parciales or []) 
        if cp.usd_comprados is not None and cp.usd_comprados > 0.0
    )
    
    if total_ves_spent_cp > 0:
        bolivares_gastados_total = total_ves_spent_cp
    elif (ciclo.divisas_compradas or 0.0) > 0 and (ciclo.tasa_bcv or 0.0) > 0:
        bolivares_gastados_total = (ciclo.divisas_compradas * (ciclo.tasa_bcv or 0.0)) + (ciclo.comision_compra_ves or 0.0) + (ciclo.transferencias_ves or 0.0)
    else:
        # Si no hay compras parciales registradas, se asume que se gastó todo el sobre en arbitraje
        # pero restando cualquier gasto personal registrado
        total_gastos_personales = sum((cp.transferencias_ves or 0.0) for cp in (ciclo.compras_parciales or []) if cp.usd_comprados is None or cp.usd_comprados == 0.0)
        bolivares_gastados_total = ((ciclo.usdt_vendidos or 0.0) * 0.9975 * (ciclo.tasa_venta or 0.0)) - total_gastos_personales
        
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta if (ciclo.tasa_venta and ciclo.tasa_venta > 0) else 0.0
    
    # Recalcular usd acumulado de compras oficiales/remesas
    total_usd_recibidos = sum((cp.usd_recibidos_binance or 0.0) for cp in (ciclo.compras_parciales or []) if cp.usd_comprados is not None and cp.usd_comprados > 0.0)
    ciclo.usd_recibidos_binance = round(total_usd_recibidos, 2)
    ciclo.usd_procesados_binance = round(total_usd_recibidos, 2)
    ciclo.divisas_compradas = round(total_usd_recibidos, 2)
    
    ciclo.ganancia_usd = round(ciclo.usd_recibidos_binance - ustd_cost_of_operation, 2)
    ciclo.ganancia_porcentaje = round(((ciclo.usd_recibidos_binance / ustd_cost_of_operation) - 1) * 100, 2) if ustd_cost_of_operation > 0 else 0.0
    
    db.commit()
    return {"message": "Ciclo cerrado manteniendo la ganancia real de las compras efectuadas", "status": ciclo.status, "ganancia_usd": ciclo.ganancia_usd}

@app.post("/api/ciclos/{ciclo_id}/reopen")
def reopen_ciclo(ciclo_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    initial_ves = ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta
    total_ves_spent_cp = sum((cp.usd_comprados * cp.tasa_bcv) + cp.comision_compra_ves + cp.transferencias_ves for cp in ciclo.compras_parciales)
    
    if total_ves_spent_cp > 0:
        ciclo.bolivares_sobre_restantes = max(0.0, initial_ves - total_ves_spent_cp)
        bolivares_gastados_total = total_ves_spent_cp
    elif (ciclo.divisas_compradas or 0.0) > 0 and (ciclo.tasa_bcv or 0.0) > 0:
        costo_directo = (ciclo.divisas_compradas * ciclo.tasa_bcv) + (ciclo.comision_compra_ves or 0.0) + (ciclo.transferencias_ves or 0.0)
        ciclo.bolivares_sobre_restantes = max(0.0, initial_ves - costo_directo)
        bolivares_gastados_total = costo_directo
    else:
        ciclo.bolivares_sobre_restantes = initial_ves
        bolivares_gastados_total = 0.0

    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
    ciclo.status = "abierto"
    
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta if ciclo.tasa_venta > 0 else 0.0
    
    ciclo.ganancia_usd = ciclo.usd_recibidos_binance - ustd_cost_of_operation
    ciclo.ganancia_porcentaje = ((ciclo.usd_recibidos_binance / ustd_cost_of_operation) - 1) * 100 if ustd_cost_of_operation > 0 else 0.0
    
    db.commit()
    return {"message": "Sobre reabierto con éxito", "status": ciclo.status, "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes, "ganancia_usd": ciclo.ganancia_usd}

@app.put("/api/ciclos/{ciclo_id}")
def update_ciclo(ciclo_id: int, req: CicloUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    parsed_date = parse_date_string(req.fecha) if req.fecha else ciclo.fecha
        
    card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
    ciclo.fecha = parsed_date
    ciclo.usdt_vendidos = round(req.usdt_vendidos, 2)
    ciclo.tasa_venta = round(req.tasa_venta, 2)
    ciclo.tarjeta_id = req.tarjeta_id
    ciclo.banco_venta = card.banco
    ciclo.usd_recibidos_binance = round(req.usd_recibidos_binance, 2)
    if req.tasa_bcv and req.tasa_bcv > 0:
        ciclo.tasa_bcv = round(req.tasa_bcv, 2)
    
    # Recalculate remaining VES based on new parameters and existing purchases
    initial_ves = round(req.usdt_vendidos * 0.9975 * req.tasa_venta, 2)
    
    total_ves_spent = 0.0
    for cp in ciclo.compras_parciales:
        total_ves_spent += (cp.usd_comprados * cp.tasa_bcv) + cp.comision_compra_ves + cp.transferencias_ves
    total_ves_spent = round(total_ves_spent, 2)
        
    ciclo.bolivares_sobre_restantes = round(max(0.0, initial_ves - total_ves_spent), 2)
    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
    
    if total_ves_spent > 0:
        bolivares_gastados_total = total_ves_spent
    else:
        if ciclo.divisas_compradas > 0 and ciclo.tasa_bcv > 0:
            bolivares_gastados_total = round((ciclo.divisas_compradas * ciclo.tasa_bcv) + (ciclo.comision_compra_ves or 0.0) + (ciclo.transferencias_ves or 0.0), 2)
        else:
            bolivares_gastados_total = round(initial_ves - ciclo.bolivares_sobre_restantes, 2)

    ustd_cost_of_operation = round(bolivares_gastados_total / req.tasa_venta, 2) if req.tasa_venta > 0 else 0.0
    
    ciclo.ganancia_usd = round(ciclo.usd_recibidos_binance - ustd_cost_of_operation, 2)
    ciclo.ganancia_porcentaje = round((ciclo.usd_recibidos_binance / ustd_cost_of_operation - 1) * 100, 2) if ustd_cost_of_operation > 0 else 0.0
    
    if ciclo.bolivares_sobre_restantes > 0.01:
        ciclo.status = "abierto"
    else:
        ciclo.status = "completado"
        
    db.commit()
    return {"message": "Ciclo de arbitraje actualizado con éxito"}

@app.delete("/api/ciclos/{ciclo_id}")
def delete_ciclo(ciclo_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
    db.delete(ciclo)
    db.commit()
    return {"message": "Ciclo de arbitraje eliminado con éxito"}

@app.delete("/api/ciclos/compras/{compra_id}")
def delete_compra_parcial(compra_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    compra = db.query(CompraCicloParcial).filter(CompraCicloParcial.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra parcial no encontrada")
        
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == compra.ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    costo_ves = compra.usd_comprados * compra.tasa_bcv
    total_ves_gastado = costo_ves + compra.comision_compra_ves + compra.transferencias_ves
    
    initial_ves = ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta
    ciclo.bolivares_sobre_restantes = min(initial_ves, ciclo.bolivares_sobre_restantes + total_ves_gastado)
    
    db.delete(compra)
    
    # Recalcular estadísticas del ciclo centralizado
    recalculate_ciclo_stats(ciclo, db)
    
    if ciclo.bolivares_sobre_restantes > 0.01:
        ciclo.status = "abierto"
        
    # Revertir saldo en la cuenta bancaria de DistribucionCapital para el banco emisor
    bank_clean = (compra.banco or ciclo.banco_venta or "").lower()
    target_platform = None
    if "provincial" in bank_clean:
        target_platform = "Banco Provincial (VES)"
    elif "venezuela" in bank_clean or "bdv" in bank_clean:
        target_platform = "Banco de Venezuela (VES)"
    elif "mercantil" in bank_clean:
        target_platform = "Banco Mercantil (VES)"
    elif "bancamiga" in bank_clean:
        target_platform = "Bancamiga (VES)"
        
    if target_platform:
        plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == target_platform).first()
        if plat:
            plat.saldo_ves = round((plat.saldo_ves or 0.0) + total_ves_gastado, 2)

    db.commit()
    
    return {"message": "Compra parcial eliminada y saldo de sobre restaurado", "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes}

@app.put("/api/ciclos/compras/{compra_id}")
def update_compra_parcial(compra_id: int, req: CompraCicloParcialUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    compra = db.query(CompraCicloParcial).filter(CompraCicloParcial.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra parcial no encontrada")
        
    ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == compra.ciclo_id).first()
    if not ciclo:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        
    # ── 1. Revert Old Cost Impact ──────────────────────────────────────────
    old_costo_ves = compra.usd_comprados * compra.tasa_bcv
    old_total_ves_gastado = old_costo_ves + compra.comision_compra_ves + compra.transferencias_ves
    
    initial_ves = (ciclo.usdt_vendidos or 0.0) * 0.9975 * (ciclo.tasa_venta or 0.0)
    ciclo.bolivares_sobre_restantes = min(initial_ves, (ciclo.bolivares_sobre_restantes or 0.0) + old_total_ves_gastado)
    
    # Revert bank balance of old platform
    old_bank_clean = (compra.banco or ciclo.banco_venta or "").lower()
    old_target_platform = None
    if "provincial" in old_bank_clean:
        old_target_platform = "Banco Provincial (VES)"
    elif "venezuela" in old_bank_clean or "bdv" in old_bank_clean:
        old_target_platform = "Banco de Venezuela (VES)"
    elif "mercantil" in old_bank_clean:
        old_target_platform = "Banco Mercantil (VES)"
    elif "bancamiga" in old_bank_clean:
        old_target_platform = "Bancamiga (VES)"
        
    if old_target_platform:
        plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == old_target_platform).first()
        if plat:
            plat.saldo_ves = round((plat.saldo_ves or 0.0) + old_total_ves_gastado, 2)
            
    # ── 2. Apply New Cost Impact ──────────────────────────────────────────
    new_costo_ves = req.usd_comprados * req.tasa_bcv
    new_total_ves_gastado = new_costo_ves + req.comision_compra_ves + req.transferencias_ves
    
    ciclo.bolivares_sobre_restantes = round(max(0.0, (ciclo.bolivares_sobre_restantes or 0.0) - new_total_ves_gastado), 2)
    
    # Deduct from DistribucionCapital new platform
    new_bank_clean = (req.banco or ciclo.banco_venta or "").lower()
    new_target_platform = None
    if "provincial" in new_bank_clean:
        new_target_platform = "Banco Provincial (VES)"
    elif "venezuela" in new_bank_clean or "bdv" in new_bank_clean:
        new_target_platform = "Banco de Venezuela (VES)"
    elif "mercantil" in new_bank_clean:
        new_target_platform = "Banco Mercantil (VES)"
    elif "bancamiga" in new_bank_clean:
        new_target_platform = "Bancamiga (VES)"
        
    if new_target_platform:
        plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == new_target_platform).first()
        if plat:
            plat.saldo_ves = round(max(0.0, (plat.saldo_ves or 0.0) - new_total_ves_gastado), 2)
            
    # ── 3. Update Compra Record ─────────────────────────────────────────────
    if req.fecha:
        compra.fecha = parse_date_string(req.fecha)
    compra.usd_comprados = round(req.usd_comprados, 2)
    compra.usd_procesados = round(req.usd_procesados, 2)
    compra.tasa_bcv = round(req.tasa_bcv, 2)
    compra.comision_compra_ves = round(req.comision_compra_ves, 2)
    compra.transferencias_ves = round(req.transferencias_ves, 2)
    compra.usd_recibidos_binance = round(req.usd_recibidos_binance, 2)
    compra.banco = req.banco
    compra.tarjeta_id = req.tarjeta_id
    
    db.commit()
    
    # ── 4. Recalculate stats ───────────────────────────────────────────────
    recalculate_ciclo_stats(ciclo, db)
    
    if ciclo.bolivares_sobre_restantes > 0.01:
        ciclo.status = "abierto"
    else:
        ciclo.status = "completado"
        
    db.commit()
    return {"message": "Compra parcial actualizada correctamente", "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes, "status": ciclo.status}

# Remittance Routes
@app.post("/api/p2p-rate")
def get_p2p_rate(req: P2PRateRequest, username: str = Depends(get_current_user)):
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "asset": req.asset,
        "fiat": req.fiat,
        "merchantCheck": False,
        "page": 1,
        "payTypes": req.pay_types,
        "publisherType": None,
        "rows": 5,
        "tradeType": req.trade_type
    }
    if req.amount:
        payload["transAmount"] = str(req.amount)
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Origin": "https://p2p.binance.com",
        "Referer": f"https://p2p.binance.com/en/trade/all-payments/{req.asset}?fiat={req.fiat}"
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            advs = data.get("data", [])
            rates = []
            for item in advs:
                adv = item.get("adv", {})
                price = float(adv.get("price"))
                min_single = float(adv.get("minSingleTransAmount"))
                max_single = float(adv.get("maxSingleTransAmount"))
                methods = [m.get("tradeMethodName") for m in item.get("methods", [])]
                rates.append({
                    "price": price,
                    "min_amount": min_single,
                    "max_amount": max_single,
                    "methods": methods,
                    "advertiser": item.get("advertiser", {}).get("nickName")
                })
            return {"success": True, "rates": rates}
        else:
            print(f"Binance P2P non-200 status {res.status_code}")
            return {"success": False, "rates": [], "error": f"Status {res.status_code}"}
    except Exception as e:
        print(f"Error connecting to Binance P2P: {e}")
        return {"success": False, "rates": [], "error": str(e)}

@app.get("/api/stats/dashboard")
def get_stats_dashboard(
    period: Optional[str] = "semana",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = get_venezuela_time()
    
    # Helpers to calculate stats for a single CompraCicloParcial
    def get_cp_stats(cp, ciclo):
        costo_ves = (cp.usd_comprados * cp.tasa_bcv) + (cp.comision_compra_ves or 0.0) + (cp.transferencias_ves or 0.0)
        costo_usdt = costo_ves / ciclo.tasa_venta if (ciclo and ciclo.tasa_venta > 0) else 0.0
        gan_usd = cp.usd_recibidos_binance - costo_usdt
        vol_usd = cp.usd_procesados if (cp.usd_procesados and cp.usd_procesados > 0) else cp.usd_comprados
        return vol_usd, gan_usd

    # 1. Fetch all relevant records
    all_remesas = db.query(HistorialRemesas).all()
    all_ciclos = db.query(HistorialCiclos).all()
    all_compras_parciales = db.query(CompraCicloParcial).all()
    all_canjes = db.query(CanjeDivisa).all()
    
    # Map ciclo_id to the ciclo object for fast lookup
    ciclo_map = {c.id: c for c in all_ciclos}
    
    # Helper to calculate consolidated stats of arbitraje for any given list of dates/ranges
    def get_arbitraje_stats_for_range(start_date, end_date):
        total_vol = 0.0
        total_gan = 0.0
        cycles_counted = set()
        
        # Check all partial purchases executed in this range
        for cp in all_compras_parciales:
            if cp.fecha and cp.fecha >= start_date and cp.fecha < end_date:
                # Exclude personal expenses from statistics completely
                if cp.usd_comprados is None or cp.usd_comprados == 0.0:
                    continue
                ciclo = ciclo_map.get(cp.ciclo_id)
                vol, gan = get_cp_stats(cp, ciclo)
                total_vol += vol
                total_gan += gan
                if cp.ciclo_id:
                    cycles_counted.add(cp.ciclo_id)
                    
        # Also check cycles created in this range that HAVE NO partial purchases (legacy or single-step)
        for c in all_ciclos:
            if c.fecha and c.fecha >= start_date and c.fecha < end_date:
                if not c.compras_parciales: # no partial purchases
                    total_vol += (c.usd_procesados_binance or 0.0)
                    total_gan += (c.ganancia_usd or 0.0)
                    cycles_counted.add(c.id)
                    
        return total_vol, total_gan, len(cycles_counted)

    # Helper to calculate consolidated stats of arbitraje for a specific day
    def get_arbitraje_stats_for_day(day_date):
        total_vol = 0.0
        total_gan = 0.0
        for cp in all_compras_parciales:
            if cp.fecha and cp.fecha.date() == day_date:
                # Exclude personal expenses from statistics completely
                if cp.usd_comprados is None or cp.usd_comprados == 0.0:
                    continue
                ciclo = ciclo_map.get(cp.ciclo_id)
                vol, gan = get_cp_stats(cp, ciclo)
                total_vol += vol
                total_gan += gan
        for c in all_ciclos:
            if c.fecha and c.fecha.date() == day_date:
                if not c.compras_parciales:
                    total_vol += (c.usd_procesados_binance or 0.0)
                    total_gan += (c.ganancia_usd or 0.0)
        return total_vol, total_gan

    # Helper to calculate consolidated stats of arbitraje for a specific month
    def get_arbitraje_stats_for_month(year, month):
        total_vol = 0.0
        total_gan = 0.0
        for cp in all_compras_parciales:
            if cp.fecha and cp.fecha.year == year and cp.fecha.month == month:
                # Exclude personal expenses from statistics completely
                if cp.usd_comprados is None or cp.usd_comprados == 0.0:
                    continue
                ciclo = ciclo_map.get(cp.ciclo_id)
                vol, gan = get_cp_stats(cp, ciclo)
                total_vol += vol
                total_gan += gan
        for c in all_ciclos:
            if c.fecha and c.fecha.year == year and c.fecha.month == month:
                if not c.compras_parciales:
                    total_vol += (c.usd_procesados_binance or 0.0)
                    total_gan += (c.ganancia_usd or 0.0)
        return total_vol, total_gan

    # --- WEEKLY (Monday to Sunday) ---
    days_to_monday = now.weekday()
    start_of_week = datetime.datetime(now.year, now.month, now.day) - datetime.timedelta(days=days_to_monday)
    end_of_week = start_of_week + datetime.timedelta(days=7)
    
    weekly_remesas = [r for r in all_remesas if r.fecha and r.fecha >= start_of_week and r.fecha < end_of_week]
    weekly_canjes = [c for c in all_canjes if c.fecha and c.fecha >= start_of_week and c.fecha < end_of_week]
    
    days_labels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    weekly_data = []
    for idx in range(7):
        day_date = (start_of_week + datetime.timedelta(days=idx)).date()
        
        # Filter remesas for this specific day
        r_day = [r for r in weekly_remesas if r.fecha and r.fecha.date() == day_date]
        vol_rem = sum(r.monto_usd for r in r_day)
        gan_rem = sum(r.ganancia_usd for r in r_day)
        
        # Filter cycle purchases for this specific day
        vol_cic, gan_cic = get_arbitraje_stats_for_day(day_date)
        
        # Filter canjes for this specific day
        c_day = [c for c in weekly_canjes if c.fecha and c.fecha.date() == day_date]
        vol_can = sum(c.monto_recibido for c in c_day)
        gan_can = sum(c.ganancia_neta_usd for c in c_day)
        
        weekly_data.append({
            "label": days_labels[idx],
            "date": day_date.strftime("%d/%m"),
            "volumen_remesas": vol_rem,
            "ganancia_remesas": gan_rem,
            "volumen_ciclos": vol_cic,
            "ganancia_ciclos": gan_cic,
            "volumen_canjes": vol_can,
            "ganancia_canjes": gan_can
        })
        
    # --- MONTHLY (Current Year) ---
    months_labels = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    monthly_data = []
    for m_idx in range(1, 13):
        # Filter for month m_idx
        r_month = [r for r in all_remesas if r.fecha and r.fecha.year == now.year and r.fecha.month == m_idx]
        vol_rem = sum(r.monto_usd for r in r_month)
        gan_rem = sum(r.ganancia_usd for r in r_month)
        
        vol_cic, gan_cic = get_arbitraje_stats_for_month(now.year, m_idx)
        
        c_month = [c for c in all_canjes if c.fecha and c.fecha.year == now.year and c.fecha.month == m_idx]
        vol_can = sum(c.monto_recibido for c in c_month)
        gan_can = sum(c.ganancia_neta_usd for c in c_month)
        
        monthly_data.append({
            "label": months_labels[m_idx - 1],
            "volumen_remesas": vol_rem,
            "ganancia_remesas": gan_rem,
            "volumen_ciclos": vol_cic,
            "ganancia_ciclos": gan_cic,
            "volumen_canjes": vol_can,
            "ganancia_canjes": gan_can
        })
        
    # --- PERIOD FILTER FOR SUMMARY KPIS ---
    if start_date and end_date:
        try:
            sd = datetime.datetime.strptime(start_date.split(" ")[0], "%Y-%m-%d")
            ed = datetime.datetime.strptime(end_date.split(" ")[0], "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
            remesas_summary = [r for r in all_remesas if r.fecha and r.fecha >= sd and r.fecha <= ed]
            canjes_summary = [c for c in all_canjes if c.fecha and c.fecha >= sd and c.fecha <= ed]
            total_arbitrado, total_ganancia_arbitraje, total_ciclos_count = get_arbitraje_stats_for_range(sd, ed)
        except Exception as e:
            remesas_summary = weekly_remesas
            canjes_summary = weekly_canjes
            total_arbitrado, total_ganancia_arbitraje, total_ciclos_count = get_arbitraje_stats_for_range(start_of_week, end_of_week)
    elif period == "mes":
        start_of_month = datetime.datetime(now.year, now.month, 1)
        next_month = now.month + 1 if now.month < 12 else 1
        next_year = now.year if now.month < 12 else now.year + 1
        end_of_month = datetime.datetime(next_year, next_month, 1)
        remesas_summary = [r for r in all_remesas if r.fecha and r.fecha >= start_of_month and r.fecha < end_of_month]
        canjes_summary = [c for c in all_canjes if c.fecha and c.fecha >= start_of_month and c.fecha < end_of_month]
        total_arbitrado, total_ganancia_arbitraje, total_ciclos_count = get_arbitraje_stats_for_range(start_of_month, end_of_month)
    elif period == "historico":
        remesas_summary = all_remesas
        canjes_summary = all_canjes
        start_of_time = datetime.datetime(2020, 1, 1)
        end_of_time = datetime.datetime(now.year + 10, 1, 1)
        total_arbitrado, total_ganancia_arbitraje, total_ciclos_count = get_arbitraje_stats_for_range(start_of_time, end_of_time)
    else:  # default "semana"
        remesas_summary = weekly_remesas
        canjes_summary = weekly_canjes
        total_arbitrado, total_ganancia_arbitraje, total_ciclos_count = get_arbitraje_stats_for_range(start_of_week, end_of_week)
    
    # --- TRAFFIC DAYS (all-time remesas by weekday) ---
    traffic_map = {}
    for r in all_remesas:
        if r.fecha:
            day_name = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][r.fecha.weekday()]
            if day_name not in traffic_map:
                traffic_map[day_name] = {"label": day_name, "volumen": 0.0, "count": 0}
            traffic_map[day_name]["volumen"] += (r.monto_usd or 0.0)
            traffic_map[day_name]["count"] += 1
    traffic_days = list(traffic_map.values())

    # --- TOP CLIENTS ---
    clients_map = {}
    for r in all_remesas:
        name = (r.cliente_nombre or "Desconocido").strip()
        if name not in clients_map:
            clients_map[name] = {"name": name, "volumen": 0.0, "count": 0}
        clients_map[name]["volumen"] += (r.monto_usd or 0.0)
        clients_map[name]["count"] += 1
    top_clients = sorted(clients_map.values(), key=lambda x: x["volumen"], reverse=True)[:10]

    # --- PAYMENT METHODS ---
    methods_map = {}
    for r in all_remesas:
        metodo = (r.metodo_pago or "Otro").strip()
        if metodo not in methods_map:
            methods_map[metodo] = {"metodo": metodo, "volumen": 0.0}
        methods_map[metodo]["volumen"] += (r.monto_usd or 0.0)
    payment_methods = sorted(methods_map.values(), key=lambda x: x["volumen"], reverse=True)

    # --- BANKS DESTINATION ---
    banks_map = {}
    for r in all_remesas:
        banco = (r.banco_receptor or "Otro").strip()
        if banco not in banks_map:
            banks_map[banco] = {"banco": banco, "volumen": 0.0}
        banks_map[banco]["volumen"] += (r.monto_usd or 0.0)
    banks_destination = sorted(banks_map.values(), key=lambda x: x["volumen"], reverse=True)

    # 5. Summary KPIs (Remesas, Arbitraje & Canjes)
    total_remitido = sum((r.monto_usd or 0.0) for r in remesas_summary)
    total_ganancia_remesas = sum((r.ganancia_usd or 0.0) for r in remesas_summary)
    total_operaciones = len(remesas_summary)
    margen_promedio = (total_ganancia_remesas / total_remitido * 100) if total_remitido > 0 else 0.0
    
    total_volumen_canjes = sum((c.monto_recibido or 0.0) for c in canjes_summary)
    total_ganancia_canjes = sum((c.ganancia_neta_usd or 0.0) for c in canjes_summary)
    total_canjes_count = len(canjes_summary)
    
    rentabilidad_promedio = (total_ganancia_arbitraje / total_arbitrado * 100) if total_arbitrado > 0 else 0.0
    
    # Global Consolidated KPIs (All time & current periods)
    all_rem_gain = sum((r.ganancia_usd or 0.0) for r in all_remesas)
    all_canjes_gain = sum((c.ganancia_neta_usd or 0.0) for c in all_canjes)
    
    # Historical total arbitraje stats
    _, all_arb_gain, _ = get_arbitraje_stats_for_range(datetime.datetime(2020, 1, 1), datetime.datetime(now.year + 10, 1, 1))
    
    ganancia_semanal_consolidada = sum(day["ganancia_remesas"] + day["ganancia_ciclos"] + day.get("ganancia_canjes", 0.0) for day in weekly_data)
    current_month_data = monthly_data[now.month - 1]
    ganancia_mensual_consolidada = current_month_data["ganancia_remesas"] + current_month_data["ganancia_ciclos"] + current_month_data.get("ganancia_canjes", 0.0)
    ganancia_historica_consolidada = all_rem_gain + all_arb_gain + all_canjes_gain
    ganancia_rango_consolidada = total_ganancia_remesas + total_ganancia_arbitraje + total_ganancia_canjes
    
    if ganancia_historica_consolidada > 0:
        pct_remesas = (all_rem_gain / ganancia_historica_consolidada) * 100
        pct_arbitraje = (all_arb_gain / ganancia_historica_consolidada) * 100
        pct_canjes = (all_canjes_gain / ganancia_historica_consolidada) * 100
    else:
        pct_remesas = 0.0
        pct_arbitraje = 0.0
        pct_canjes = 0.0
        
    summary = {
        "total_remitido": total_remitido,
        "total_ganancia_remesas": total_ganancia_remesas,
        "margen_promedio": margen_promedio,
        "total_operaciones": total_operaciones,
        "total_arbitrado": total_arbitrado,
        "total_ganancia_arbitraje": total_ganancia_arbitraje,
        "rentabilidad_promedio": rentabilidad_promedio,
        "total_ciclos": total_ciclos_count,
        "total_volumen_canjes": total_volumen_canjes,
        "total_ganancia_canjes": total_ganancia_canjes,
        "total_canjes": total_canjes_count,
        "ganancia_semanal_consolidada": ganancia_semanal_consolidada,
        "ganancia_mensual_consolidada": ganancia_mensual_consolidada,
        "ganancia_historica_consolidada": ganancia_historica_consolidada,
        "ganancia_rango_consolidada": ganancia_rango_consolidada,
        "pct_remesas": pct_remesas,
        "pct_arbitraje": pct_arbitraje,
        "pct_canjes": pct_canjes
    }
        
    return {
        "weekly": weekly_data,
        "monthly": monthly_data,
        "traffic_days": traffic_days,
        "top_clients": top_clients,
        "payment_methods": payment_methods,
        "banks_destination": banks_destination,
        "summary": summary
    }
        
    return {
        "weekly": weekly_data,
        "monthly": monthly_data,
        "traffic_days": traffic_days,
        "top_clients": top_clients,
        "payment_methods": payment_methods,
        "banks_destination": banks_destination,
        "summary": summary
    }

def parse_date_string(date_str: Optional[str]) -> datetime.datetime:
    if not date_str or not str(date_str).strip():
        return get_venezuela_time()
    s = str(date_str).strip()
    formats = [
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y %I:%M %p",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%Y-%m-%d",
        "%d/%m/%Y"
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(s, fmt)
        except ValueError:
            pass
    return get_venezuela_time()

@app.post("/api/remesas")
def create_remesa(req: RemesaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Auto-add client if not exists
    cliente_nombre_clean = req.cliente_nombre.strip()
    if cliente_nombre_clean:
        existing_cliente = db.query(Cliente).filter(Cliente.nombre == cliente_nombre_clean).first()
        if not existing_cliente:
            new_cliente = Cliente(nombre=cliente_nombre_clean, genero=req.cliente_genero)
            db.add(new_cliente)
            db.commit()

    remesa_date = parse_date_string(req.fecha)
    remesa = HistorialRemesas(
        fecha=remesa_date,
        cliente_nombre=req.cliente_nombre,
        monto_usd=round(req.monto_usd, 2),
        tasa_p2p=round(req.tasa_p2p, 2),
        tasa_cliente=round(req.tasa_cliente, 2),
        monto_ves=round(req.monto_ves, 2),
        ganancia_usd=round(req.ganancia_usd, 2),
        metodo_pago=req.metodo_pago,
        banco_receptor=req.banco_receptor,
        costo_adquisicion_usdt=round(req.costo_adquisicion_usdt, 4),
        comision_binance=round(req.comision_binance, 4),
        ciclo_id=req.ciclo_id
    )
    db.add(remesa)
    db.commit()

    # Deducción y vinculación a sobre de ciclo activo
    if req.ciclo_id:
        ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == req.ciclo_id).first()
        if ciclo:
            pm_fee_pct = 0.003 if (req.banco_receptor.strip().lower() == "pago móvil") else 0.0
            total_ves_gastados = round(req.monto_ves * (1.0 + pm_fee_pct), 2)
            
            # Restar del sobre de bolívares restantes
            ciclo.bolivares_sobre_restantes = round(max(0.0, (ciclo.bolivares_sobre_restantes or 0.0) - total_ves_gastados), 2)
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            # Registrar como CompraCicloParcial de gasto silencioso (sin usd_comprados para no alterar la ganancia del arbitraje ni aparecer en el historial)
            compra_parcial = CompraCicloParcial(
                ciclo_id=ciclo.id,
                fecha=remesa_date,
                usd_comprados=0.0,
                usd_procesados=0.0,
                tasa_bcv=round(req.tasa_cliente, 2),
                comision_compra_ves=0.0,
                transferencias_ves=total_ves_gastados,
                usd_recibidos_binance=0.0,
                banco=f"Remesa #{remesa.id} ({req.cliente_nombre})"
            )
            db.add(compra_parcial)
            
            # Nota: Los saldos VES de DistribucionCapital se actualizan manualmente por el usuario.
            # Solo el saldo Zelle se sincroniza de forma automática.
            
            # Recalcular estadísticas del ciclo centralizado
            recalculate_ciclo_stats(ciclo, db)
            
            if ciclo.bolivares_sobre_restantes <= 0.01:
                ciclo.status = "completado"
            
            db.commit()
    
    if req.metodo_pago.strip().lower() == "zelle":
        linked_mov = None
        if req.zelle_movimiento_id:
            linked_mov = db.query(MovimientoZelle).filter(MovimientoZelle.id == req.zelle_movimiento_id).first()
        if not linked_mov:
            # Fallback search 1: Bidirectional substring matching on cliente_nombre
            linked_mov = db.query(MovimientoZelle).filter(
                MovimientoZelle.tipo == "ingreso",
                MovimientoZelle.estado == "pendiente",
                or_(
                    MovimientoZelle.cliente_nombre.ilike(f"%{req.cliente_nombre}%"),
                    literal(req.cliente_nombre).ilike(func.concat('%', MovimientoZelle.cliente_nombre, '%'))
                )
            ).first()
        if not linked_mov:
            # Fallback search 2: Legacy compatibility matching titular
            linked_mov = db.query(MovimientoZelle).filter(
                MovimientoZelle.tipo == "ingreso",
                MovimientoZelle.estado == "pendiente",
                or_(
                    MovimientoZelle.titular.ilike(f"%{req.cliente_nombre}%"),
                    literal(req.cliente_nombre).ilike(func.concat('%', MovimientoZelle.titular, '%'))
                )
            ).first()
            
        if linked_mov:
            linked_mov.estado = "remesado"
            linked_mov.remesa_id = remesa.id
            linked_mov.detalle = (linked_mov.detalle or "") + f" [Remesado - Remesa ID #{remesa.id}]"
        else:
            mov = MovimientoZelle(
                fecha=remesa.fecha,
                tipo="ingreso",
                monto=round(req.monto_usd, 2),
                cliente_nombre=req.cliente_nombre,
                titular=req.cliente_nombre,
                detalle=f"Remesa ID #{remesa.id} de {req.cliente_nombre}",
                estado="remesado",
                remesa_id=remesa.id
            )
            db.add(mov)
            zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
            if zelle_plat:
                zelle_plat.saldo_usd = round(zelle_plat.saldo_usd + req.monto_usd, 2)
        db.commit()
        
    return {"message": "Remesa registrada con éxito", "id": remesa.id}

@app.get("/api/remesas")
def get_remesas(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    remesas = db.query(HistorialRemesas).order_by(HistorialRemesas.fecha.desc()).limit(100).all()
    result = []
    for r in remesas:
        result.append({
            "id": r.id,
            "fecha": r.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "cliente_nombre": r.cliente_nombre,
            "monto_usd": r.monto_usd,
            "tasa_p2p": r.tasa_p2p,
            "tasa_cliente": r.tasa_cliente,
            "monto_ves": r.monto_ves,
            "ganancia_usd": r.ganancia_usd,
            "metodo_pago": r.metodo_pago,
            "banco_receptor": r.banco_receptor,
            "costo_adquisicion_usdt": r.costo_adquisicion_usdt,
            "comision_binance": r.comision_binance
        })
    return result

@app.put("/api/remesas/{remesa_id}")
def update_remesa(remesa_id: int, req: RemesaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    remesa = db.query(HistorialRemesas).filter(HistorialRemesas.id == remesa_id).first()
    if not remesa:
        raise HTTPException(status_code=404, detail="Remesa no encontrada.")
    
    # Auto-add client if not exists
    cliente_nombre_clean = req.cliente_nombre.strip()
    if cliente_nombre_clean:
        existing_cliente = db.query(Cliente).filter(Cliente.nombre == cliente_nombre_clean).first()
        if not existing_cliente:
            new_cliente = Cliente(nombre=cliente_nombre_clean, genero=req.cliente_genero)
            db.add(new_cliente)
            db.commit()

    old_metodo = remesa.metodo_pago.strip().lower()
    old_monto = remesa.monto_usd
    old_cliente = remesa.cliente_nombre

    old_ciclo_id = remesa.ciclo_id
    new_ciclo_id = req.ciclo_id
    old_monto_ves = remesa.monto_ves
    old_banco_receptor = remesa.banco_receptor
    
    # Calculate old total spent including Pago Móvil fee
    old_pm_fee_pct = 0.003 if (old_banco_receptor.strip().lower() == "pago móvil") else 0.0
    old_total_ves_gastados = round(old_monto_ves * (1.0 + old_pm_fee_pct), 2)
    
    # Calculate new total spent including Pago Móvil fee
    new_pm_fee_pct = 0.003 if (req.banco_receptor.strip().lower() == "pago móvil") else 0.0
    new_total_ves_gastados = round(req.monto_ves * (1.0 + new_pm_fee_pct), 2)
    
    # ── 1. Revert Old Cycle Impact ──────────────────────────────────────────
    if old_ciclo_id:
        old_ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == old_ciclo_id).first()
        if old_ciclo:
            old_ciclo.bolivares_sobre_restantes = round((old_ciclo.bolivares_sobre_restantes or 0.0) + old_total_ves_gastados, 2)
            old_ciclo.bolivares_restantes = old_ciclo.bolivares_sobre_restantes
            if old_ciclo.bolivares_sobre_restantes > 0.01:
                old_ciclo.status = "abierto"
            
            # Nota: Reversión de saldos VES omitida — el usuario gestiona esos saldos manualmente.
            
            # Delete old CompraCicloParcial
            cp = db.query(CompraCicloParcial).filter(
                CompraCicloParcial.ciclo_id == old_ciclo.id,
                CompraCicloParcial.banco.like(f"%Remesa #{remesa.id}%")
            ).first()
            if cp:
                db.delete(cp)

    # ── 2. Apply New Cycle Impact ──────────────────────────────────────────
    if new_ciclo_id:
        new_ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == new_ciclo_id).first()
        if new_ciclo:
            new_ciclo.bolivares_sobre_restantes = round(max(0.0, (new_ciclo.bolivares_sobre_restantes or 0.0) - new_total_ves_gastados), 2)
            new_ciclo.bolivares_restantes = new_ciclo.bolivares_sobre_restantes
            if new_ciclo.bolivares_sobre_restantes <= 0.01:
                new_ciclo.status = "completado"
                
            # Nota: Deducción de saldos VES omitida — el usuario gestiona esos saldos manualmente.
            
            # Create a silent CompraCicloParcial (usd_comprados = 0)
            compra_parcial = CompraCicloParcial(
                ciclo_id=new_ciclo.id,
                fecha=remesa.fecha if req.fecha is None else parse_date_string(req.fecha),
                usd_comprados=0.0,
                usd_procesados=0.0,
                tasa_bcv=round(req.tasa_cliente, 2),
                comision_compra_ves=0.0,
                transferencias_ves=new_total_ves_gastados,
                usd_recibidos_binance=0.0,
                banco=f"Remesa #{remesa.id} ({req.cliente_nombre})"
            )
            db.add(compra_parcial)

    if req.fecha:
        remesa.fecha = parse_date_string(req.fecha)
    remesa.cliente_nombre = req.cliente_nombre
    remesa.monto_usd = round(req.monto_usd, 2)
    remesa.tasa_p2p = round(req.tasa_p2p, 2)
    remesa.tasa_cliente = round(req.tasa_cliente, 2)
    remesa.monto_ves = round(req.monto_ves, 2)
    remesa.ganancia_usd = round(req.ganancia_usd, 2)
    remesa.metodo_pago = req.metodo_pago
    remesa.banco_receptor = req.banco_receptor
    remesa.costo_adquisicion_usdt = round(req.costo_adquisicion_usdt, 4)
    remesa.comision_binance = round(req.comision_binance, 4)
    remesa.ciclo_id = req.ciclo_id
    
    db.commit()

    # ── 3. Recalculate Cycle Stats ─────────────────────────────────────────
    if old_ciclo_id:
        old_ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == old_ciclo_id).first()
        if old_ciclo:
            recalculate_ciclo_stats(old_ciclo, db)
    if new_ciclo_id and new_ciclo_id != old_ciclo_id:
        new_ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == new_ciclo_id).first()
        if new_ciclo:
            recalculate_ciclo_stats(new_ciclo, db)
            
    db.commit()

    # Sync Zelle ledger movements
    new_metodo = req.metodo_pago.strip().lower()
    new_monto = req.monto_usd
    new_cliente = req.cliente_nombre
    
    if old_metodo == "zelle" or new_metodo == "zelle":
        zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
        
        if old_metodo == "zelle" and new_metodo != "zelle":
            mov = db.query(MovimientoZelle).filter(
                MovimientoZelle.detalle.like(f"Remesa ID%{remesa_id} de {old_cliente}%")
            ).first()
            if not mov:
                mov = db.query(MovimientoZelle).filter(
                    MovimientoZelle.remesa_id == remesa_id
                ).first()
            if mov:
                db.delete(mov)
            if zelle_plat:
                zelle_plat.saldo_usd -= old_monto
        
        elif old_metodo != "zelle" and new_metodo == "zelle":
            mov = MovimientoZelle(
                fecha=remesa.fecha,
                tipo="ingreso",
                monto=new_monto,
                titular=new_cliente,
                detalle=f"Remesa ID {remesa_id} de {new_cliente}"
            )
            db.add(mov)
            if zelle_plat:
                zelle_plat.saldo_usd += new_monto
                
        elif old_metodo == "zelle" and new_metodo == "zelle":
            mov = db.query(MovimientoZelle).filter(
                MovimientoZelle.detalle.like(f"Remesa ID%{remesa_id} de {old_cliente}%")
            ).first()
            if not mov:
                mov = db.query(MovimientoZelle).filter(
                    MovimientoZelle.remesa_id == remesa_id
                ).first()
            if mov:
                mov.fecha = remesa.fecha
                mov.monto = new_monto
                mov.titular = new_cliente
                mov.detalle = f"Remesa ID {remesa_id} de {new_cliente}"
            else:
                mov = MovimientoZelle(
                    fecha=remesa.fecha,
                    tipo="ingreso",
                    monto=new_monto,
                    titular=new_cliente,
                    detalle=f"Remesa ID {remesa_id} de {new_cliente}"
                )
                db.add(mov)
            
            if zelle_plat:
                zelle_plat.saldo_usd += (new_monto - old_monto)
        db.commit()

    return {"message": "Remesa actualizada correctamente."}

@app.delete("/api/remesas/{remesa_id}")
def delete_remesa(remesa_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    remesa = db.query(HistorialRemesas).filter(HistorialRemesas.id == remesa_id).first()
    if not remesa:
        raise HTTPException(status_code=404, detail="Remesa no encontrada.")
    
    # Revertir impacto en ciclo (sobre activo) y banco si estaba vinculada
    if getattr(remesa, "ciclo_id", None):
        ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == remesa.ciclo_id).first()
        if ciclo:
            pm_fee_pct = 0.003 if (remesa.banco_receptor.strip().lower() == "pago móvil") else 0.0
            total_ves_gastados = round(remesa.monto_ves * (1.0 + pm_fee_pct), 2)
            
            # Devolver bolívares al sobre
            ciclo.bolivares_sobre_restantes = round((ciclo.bolivares_sobre_restantes or 0.0) + total_ves_gastados, 2)
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            # Nota: Reversión de saldo VES omitida — el usuario gestiona esos saldos manualmente.
            
            # Buscar y eliminar CompraCicloParcial correspondiente
            cp = db.query(CompraCicloParcial).filter(
                CompraCicloParcial.ciclo_id == ciclo.id,
                CompraCicloParcial.banco.like(f"%Remesa #{remesa_id}%")
            ).first()
            if cp:
                db.delete(cp)
                
            # Recalcular estadísticas del ciclo centralizado
            recalculate_ciclo_stats(ciclo, db)
            
            if ciclo.bolivares_sobre_restantes > 0.01:
                ciclo.status = "abierto"
                
    # Revert Zelle ledger impact
    if remesa.metodo_pago.strip().lower() == "zelle":
        mov = db.query(MovimientoZelle).filter(
            (MovimientoZelle.remesa_id == remesa_id) | 
            (MovimientoZelle.detalle.contains(f"Remesa ID #{remesa_id}")) |
            (MovimientoZelle.detalle.contains(f"Remesa ID {remesa_id}"))
        ).first()
        if mov:
            if mov.estado == "remesado" or mov.remesa_id == remesa_id:
                # Pre-existing Zelle deposit! Revert status back to pendiente and unlink it
                mov.estado = "pendiente"
                mov.remesa_id = None
                if mov.detalle:
                    mov.detalle = mov.detalle.replace(f" [Remesado - Remesa ID #{remesa_id}]", "").replace(f" [Remesado - Remesa ID {remesa_id}]", "")
            else:
                db.delete(mov)
            
    db.delete(remesa)
    db.commit()
    return {"message": "Remesa eliminada correctamente."}

@app.get("/api/clientes")
def get_clientes(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    clientes = db.query(Cliente).order_by(Cliente.nombre.asc()).all()
    return [{"id": c.id, "nombre": c.nombre, "telefono": c.telefono, "genero": c.genero} for c in clientes]

@app.post("/api/clientes")
def create_cliente(req: ClienteCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    nombre_clean = req.nombre.strip()
    if not nombre_clean:
        raise HTTPException(status_code=400, detail="El nombre del cliente no puede estar vacío.")
    existing = db.query(Cliente).filter(Cliente.nombre == nombre_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este cliente ya está registrado en la agenda.")
    cliente = Cliente(nombre=nombre_clean, telefono=req.telefono, genero=req.genero)
    db.add(cliente)
    db.commit()
    return {"message": "Cliente registrado en la agenda", "id": cliente.id, "nombre": cliente.nombre}

@app.delete("/api/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en la agenda.")
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente eliminado de la agenda"}

@app.put("/api/clientes/{cliente_id}")
def update_cliente(cliente_id: int, req: ClienteCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado en la agenda.")
    
    nombre_clean = req.nombre.strip()
    if not nombre_clean:
        raise HTTPException(status_code=400, detail="El nombre del cliente no puede estar vacío.")
    
    existing = db.query(Cliente).filter(Cliente.nombre == nombre_clean, Cliente.id != cliente_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe otro cliente con este nombre en la agenda.")
    
    cliente.nombre = nombre_clean
    cliente.telefono = req.telefono
    cliente.genero = req.genero
    db.commit()
    return {"message": "Cliente actualizado", "id": cliente.id}

@app.on_event("startup")
def on_startup():
    try:
        from database import init_db, SessionLocal, User, DistribucionCapital
        from seed import seed_data
        print("Initializing database...")
        init_db()
        db = SessionLocal()
        # Seed default data if empty
        if db.query(User).first() is None:
            print("Database is empty. Running seed...")
            db.close()
            seed_data()
        else:
            print("Running database migrations/updates...")
            # 1. Update existing simulation commissions
            # Zinli -> 4.6%
            zinli = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zinli").first()
            if zinli:
                zinli.comision_simulacion = 0.046
                
            # Binance -> 0.25%
            binance = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Binance (USDT)").first()
            if binance:
                binance.comision_simulacion = 0.0025
                
            # Zelle -> 2.0%
            zelle = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
            if zelle:
                zelle.comision_simulacion = 0.02
                
            # 2. Add new platforms if they don't exist
            new_platforms = [
                {"plataforma": "Banco Mercantil (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.046},
                {"plataforma": "Bancamiga (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.041},
                {"plataforma": "Bancamiga (VES)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": True, "comision_simulacion": 0.046},
                {"plataforma": "Mercantil Panamá (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.025},
                {"plataforma": "Airtm (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.02},
                {"plataforma": "Wally (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.02},
                {"plataforma": "PayPal (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.035}
            ]
            
            for plat in new_platforms:
                existing = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == plat["plataforma"]).first()
                if not existing:
                    db.add(DistribucionCapital(**plat))
                    print(f"Migration: Added platform '{plat['plataforma']}'")
                else:
                    existing.comision_simulacion = plat["comision_simulacion"]
            
            # 3. Add titular Anaisabel and card if they don't exist
            anaisabel = db.query(Titular).filter(Titular.nombre == "Anaisabel").first()
            if not anaisabel:
                anaisabel = Titular(nombre="Anaisabel", tercera_edad=False)
                db.add(anaisabel)
                db.commit()
                print("Migration: Added titular 'Anaisabel'")
            
            prov_card = db.query(Tarjeta).filter(Tarjeta.titular_id == anaisabel.id, Tarjeta.banco == "Provincial", Tarjeta.tipo_tarjeta == "Master Debit").first()
            if not prov_card:
                prov_card = Tarjeta(
                    titular_id=anaisabel.id,
                    banco="Provincial",
                    tipo_tarjeta="Master Debit",
                    limite_diario=2000.0,
                    limite_mensual=20000.0,
                    comision_porcentaje=0.0
                )
                db.add(prov_card)
                db.commit()
                print("Migration: Added Provincial card for Anaisabel")
                
            # 4. Migrate Client table to add 'genero' column if missing
            try:
                from sqlalchemy import text
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE clientes ADD COLUMN genero VARCHAR DEFAULT 'Masculino'"))
                print("Migration: Added 'genero' column to 'clientes' table.")
            except Exception as e:
                # If column already exists or any SQL error, ignore
                print(f"Migration 'genero' check/add: {e}")
                
            # 4b. Migrate HistorialCiclos table to add status, bolivares_sobre_restantes, and tarjeta_id columns if missing
            try:
                from sqlalchemy import text
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE historial_ciclos ADD COLUMN status VARCHAR DEFAULT 'completado'"))
                print("Migration: Added 'status' column to 'historial_ciclos' table.")
            except Exception as e:
                print(f"Migration 'status' check/add: {e}")
                
            try:
                from sqlalchemy import text
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE historial_ciclos ADD COLUMN bolivares_sobre_restantes FLOAT DEFAULT 0.0"))
                print("Migration: Added 'bolivares_sobre_restantes' column to 'historial_ciclos' table.")
            except Exception as e:
                print(f"Migration 'bolivares_sobre_restantes' check/add: {e}")

            try:
                from sqlalchemy import text
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE historial_ciclos ADD COLUMN tarjeta_id INTEGER"))
                print("Migration: Added 'tarjeta_id' column to 'historial_ciclos' table.")
            except Exception as e:
                print(f"Migration 'tarjeta_id' check/add: {e}")
                
            # 5. Seed default Clientes if not present
            try:
                default_clientes = [
                    {"nombre": "Solanda Gomez", "genero": "Femenino"},
                    {"nombre": "Aristides", "genero": "Masculino"},
                    {"nombre": "Anaisabel", "genero": "Femenino"}
                ]
                for cl in default_clientes:
                    existing = db.query(Cliente).filter(Cliente.nombre == cl["nombre"]).first()
                    if not existing:
                        new_cl = Cliente(nombre=cl["nombre"], genero=cl["genero"])
                        db.add(new_cl)
                        db.commit()
                        print(f"Migration: Added default client '{cl['nombre']}'")
            except Exception as e:
                print(f"Error seeding default clients: {e}")
                
            # 6. Import historical client names from HistorialRemesas to Cliente table if not present
            try:
                from database import HistorialRemesas
                remesa_names = db.query(HistorialRemesas.cliente_nombre).distinct().all()
                imported_count = 0
                for r_name in remesa_names:
                    name = r_name[0]
                    if name:
                        name_clean = name.strip()
                        if name_clean:
                            existing = db.query(Cliente).filter(Cliente.nombre == name_clean).first()
                            if not existing:
                                gender = get_default_gender(name_clean)
                                new_cl = Cliente(nombre=name_clean, genero=gender)
                                db.add(new_cl)
                                imported_count += 1
                if imported_count > 0:
                    db.commit()
                    print(f"Migration: Imported {imported_count} historical clients from remesas history.")
            except Exception as e:
                print(f"Error importing historical clients: {e}")
                
            # 7. Unify Daly Acedo to Daly Acevedo
            try:
                db.query(HistorialRemesas).filter(HistorialRemesas.cliente_nombre == "Daly Acedo").update({HistorialRemesas.cliente_nombre: "Daly Acevedo"})
                db.query(Cliente).filter(Cliente.nombre == "Daly Acedo").delete()
                db.commit()
                print("Migration: Unified Daly Acedo to Daly Acevedo successfully.")
            except Exception as e:
                print(f"Error unifying Daly Acedo/Acevedo: {e}")
                
            db.commit()
            db.close()
            print("Database updates completed successfully.")
    except Exception as e:
        print(f"Error during database initialization: {e}")

# =====================================================
# PERSONAL FINANCE & FINANCIAL ADVISOR API ENDPOINTS
# =====================================================

def parse_personal_date(date_str: Optional[str]) -> datetime.datetime:
    if not date_str or not str(date_str).strip():
        return get_venezuela_time()
    return parse_date_string(str(date_str).strip())

# 1. CATEGORÍAS
@app.get("/api/personal/categorias")
def get_personal_categorias(tipo: Optional[str] = None, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(CategoriaPersonal)
    if tipo:
        query = query.filter(CategoriaPersonal.tipo == tipo)
    return query.order_by(CategoriaPersonal.nombre.asc()).all()

@app.post("/api/personal/categorias")
def create_personal_categoria(req: CategoriaPersonalCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check uniqueness
    existing = db.query(CategoriaPersonal).filter(CategoriaPersonal.nombre.ilike(req.nombre.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Esta categoría ya existe.")
    
    cat = CategoriaPersonal(
        nombre=req.nombre.strip(),
        tipo=req.tipo,
        icono=req.icono,
        editable=True
    )
    db.add(cat)
    db.commit()
    return {"message": "Categoría creada con éxito", "id": cat.id}

@app.delete("/api/personal/categorias/{cat_id}")
def delete_personal_categoria(cat_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    if not cat.editable:
        raise HTTPException(status_code=400, detail="Esta categoría es del sistema y no puede eliminarse.")
    
    # Check if category is used
    has_gastos = db.query(GastoPersonal).filter(GastoPersonal.categoria_id == cat_id).first()
    has_ingresos = db.query(IngresoPersonal).filter(IngresoPersonal.categoria_id == cat_id).first()
    if has_gastos or has_ingresos:
        raise HTTPException(status_code=400, detail="No se puede eliminar la categoría porque tiene movimientos asociados.")
        
    db.delete(cat)
    db.commit()
    return {"message": "Categoría eliminada con éxito"}

def map_plataforma_nombre(nombre_front: str, moneda: str = "USD") -> str:
    if not nombre_front:
        return ""
    nombre = nombre_front.strip().lower()
    # Si contiene mercantil
    if "mercantil" in nombre:
        return "Banco Mercantil (VES)" if moneda == "VES" else "Banco Mercantil (USD)"
    # Si contiene bancamiga
    if "bancamiga" in nombre:
        return "Bancamiga (VES)" if moneda == "VES" else "Bancamiga (USD)"
    # Si contiene provincial
    if "provincial" in nombre:
        return "Banco Provincial (VES)" if moneda == "VES" else "Banco Provincial (USD)"
    # Si contiene bdv o de venezuela o venezuela
    if "bdv" in nombre or "venezuela" in nombre:
        return "Banco de Venezuela (VES)" if moneda == "VES" else "Banco de Venezuela (USD)"
    # Si contiene zelle
    if "zelle" in nombre:
        return "Zelle"
    # Si contiene binance
    if "binance" in nombre:
        return "Binance (USDT)"
    # Si contiene zinli
    if "zinli" in nombre:
        return "Zinli"
    # Si contiene efectivo
    if "efectivo" in nombre:
        return "Efectivo USD" # no hay Efectivo VES en base de datos, así que asumimos Efectivo USD
    
    # Intenta buscar por coincidencia parcial si no cae en las reglas anteriores
    return nombre_front

# 2. GASTOS PERSONALES (EGRESOS)
@app.get("/api/personal/gastos")
def get_personal_gastos(limit: int = 100, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    gastos = db.query(GastoPersonal).order_by(GastoPersonal.fecha.desc()).limit(limit).all()
    result = []
    for g in gastos:
        result.append({
            "id": g.id,
            "fecha": g.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "monto": g.monto,
            "moneda": g.moneda,
            "tasa_bcv": g.tasa_bcv,
            "monto_usd": g.monto_usd,
            "categoria_id": g.categoria_id,
            "categoria": g.categoria.nombre if g.categoria else "Otros",
            "icono": g.categoria.icono if g.categoria else "⚙️",
            "subcategoria": g.subcategoria,
            "detalles": g.detalles,
            "plataforma_pago": g.plataforma_pago,
            "deuda_id": g.deuda_id
        })
    return result

@app.post("/api/personal/gastos")
def create_personal_gasto(req: GastoPersonalCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate category
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.id == req.categoria_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Categoría no encontrada.")
    
    # Calculate USD equivalent
    monto_usd = req.monto
    if req.moneda == "VES":
        if req.tasa_bcv <= 0:
            raise HTTPException(status_code=400, detail="Para registrar en VES, debes incluir una tasa BCV válida.")
        monto_usd = req.monto / req.tasa_bcv

    # Verify and deduct working capital (unless paid with Cash/Efectivo or similar not registered in Capital)
    plat_pago = req.plataforma_pago.strip()
    db_plat_pago = map_plataforma_nombre(plat_pago, req.moneda)
    capital_target = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_pago)).first()
    
    if capital_target:
        if capital_target.convertir_ves:
            # Cuenta en Bolívares (VES): Sólo alteramos saldo_ves. El saldo en USD se calcula dinámicamente.
            if req.moneda == "VES":
                capital_target.saldo_ves -= req.monto
            else:
                # Si el gasto viene en USD, restamos el equivalente en VES
                capital_target.saldo_ves -= (req.monto * req.tasa_bcv)
        else:
            # Cuenta en Dólares (USD): Sólo alteramos saldo_usd.
            if req.moneda == "USD":
                capital_target.saldo_usd -= req.monto
            else:
                # Si el gasto viene en VES, restamos el equivalente en USD
                capital_target.saldo_usd -= monto_usd
            
    # Save Gasto
    gasto = GastoPersonal(
        fecha=parse_personal_date(req.fecha),
        monto=req.monto,
        moneda=req.moneda,
        tasa_bcv=req.tasa_bcv,
        monto_usd=monto_usd,
        categoria_id=req.categoria_id,
        subcategoria=req.subcategoria,
        detalles=req.detalles,
        plataforma_pago=req.plataforma_pago,
        deuda_id=req.deuda_id,
        ciclo_id=req.ciclo_id
    )
    db.add(gasto)
    db.commit()

    # Si el gasto proviene de un sobre (ciclo activo)
    if req.ciclo_id:
        ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == req.ciclo_id).first()
        if ciclo:
            monto_ves_gasto = req.monto if req.moneda == "VES" else (req.monto * req.tasa_bcv)
            
            # Restar del sobre de bolívares restantes
            ciclo.bolivares_sobre_restantes = round(max(0.0, (ciclo.bolivares_sobre_restantes or 0.0) - monto_ves_gasto), 2)
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            # Registrar como gasto interno del ciclo (CompraCicloParcial sin retorno USD)
            compra_parcial = CompraCicloParcial(
                ciclo_id=ciclo.id,
                fecha=gasto.fecha,
                usd_comprados=0.0,
                usd_procesados=0.0,
                tasa_bcv=req.tasa_bcv,
                comision_compra_ves=0.0,
                transferencias_ves=round(monto_ves_gasto, 2),
                usd_recibidos_binance=0.0,
                banco=f"Gasto: {cat.nombre} - {req.detalles or ''}"
            )
            db.add(compra_parcial)
            
            # Los gastos personales SOLO actualizan el saldo del sobre.
            # La ganancia_usd del ciclo NUNCA se toca aquí.
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            if ciclo.bolivares_sobre_restantes <= 0.01:
                ciclo.status = "completado"
                
            db.commit()
            
    return {"message": "Gasto personal registrado con éxito", "id": gasto.id}

@app.put("/api/personal/gastos/{gasto_id}")
def update_personal_gasto(gasto_id: int, req: GastoPersonalUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    gasto = db.query(GastoPersonal).filter(GastoPersonal.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")
        
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.id == req.categoria_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Categoría no encontrada.")

    # 1. Revert previous capital deduction
    old_plat_pago = gasto.plataforma_pago.strip()
    old_db_plat_pago = map_plataforma_nombre(old_plat_pago, gasto.moneda)
    old_capital = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(old_db_plat_pago)).first()
    if old_capital:
        if old_capital.convertir_ves:
            if gasto.moneda == "VES":
                old_capital.saldo_ves += gasto.monto
            else:
                old_capital.saldo_ves += (gasto.monto * gasto.tasa_bcv)
        else:
            if gasto.moneda == "USD":
                old_capital.saldo_usd += gasto.monto
            else:
                old_capital.saldo_usd += gasto.monto_usd

    # 2. Calculate new USD equivalent
    monto_usd = req.monto
    if req.moneda == "VES":
        if req.tasa_bcv <= 0:
            raise HTTPException(status_code=400, detail="Para registrar en VES, debes incluir una tasa BCV válida.")
        monto_usd = req.monto / req.tasa_bcv

    # 3. Apply new capital deduction
    new_plat_pago = req.plataforma_pago.strip()
    new_db_plat_pago = map_plataforma_nombre(new_plat_pago, req.moneda)
    new_capital = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(new_db_plat_pago)).first()
    if new_capital:
        if new_capital.convertir_ves:
            if req.moneda == "VES":
                new_capital.saldo_ves -= req.monto
            else:
                new_capital.saldo_ves -= (req.monto * req.tasa_bcv)
        else:
            if req.moneda == "USD":
                new_capital.saldo_usd -= req.monto
            else:
                new_capital.saldo_usd -= monto_usd

    # 4. Update fields
    if req.fecha:
        gasto.fecha = parse_personal_date(req.fecha)
    gasto.monto = req.monto
    gasto.moneda = req.moneda
    gasto.tasa_bcv = req.tasa_bcv
    gasto.monto_usd = monto_usd
    gasto.categoria_id = req.categoria_id
    gasto.subcategoria = req.subcategoria
    gasto.detalles = req.detalles
    gasto.plataforma_pago = req.plataforma_pago
    
    db.commit()
    db.refresh(gasto)
    return {"message": "Gasto personal actualizado con éxito"}

@app.delete("/api/personal/gastos/{gasto_id}")
def delete_personal_gasto(gasto_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    gasto = db.query(GastoPersonal).filter(GastoPersonal.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")
        
    # Revert capital deduction
    plat_pago = gasto.plataforma_pago.strip()
    db_plat_pago = map_plataforma_nombre(plat_pago, gasto.moneda)
    capital_target = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_pago)).first()
    
    if capital_target:
        if capital_target.convertir_ves:
            # Cuenta en Bolívares (VES): Sólo revertimos saldo_ves.
            if gasto.moneda == "VES":
                capital_target.saldo_ves += gasto.monto
            else:
                capital_target.saldo_ves += (gasto.monto * gasto.tasa_bcv)
        else:
            # Cuenta en Dólares (USD): Sólo revertimos saldo_usd.
            if gasto.moneda == "USD":
                capital_target.saldo_usd += gasto.monto
            else:
                capital_target.saldo_usd += gasto.monto_usd
            
    # Si estaba vinculado a un ciclo (sobre activo), revertimos impacto en el sobre
    if getattr(gasto, "ciclo_id", None):
        ciclo = db.query(HistorialCiclos).filter(HistorialCiclos.id == gasto.ciclo_id).first()
        if ciclo:
            monto_ves_gasto = gasto.monto if gasto.moneda == "VES" else (gasto.monto * gasto.tasa_bcv)
            
            # Devolver los bolívares al sobre
            ciclo.bolivares_sobre_restantes = round((ciclo.bolivares_sobre_restantes or 0.0) + monto_ves_gasto, 2)
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            # Buscar y eliminar la compra parcial registrada del sobre
            cp = db.query(CompraCicloParcial).filter(
                CompraCicloParcial.ciclo_id == ciclo.id,
                CompraCicloParcial.banco.like(f"%Gasto: {gasto.categoria.nombre}%")
            ).first()
            if cp:
                db.delete(cp)
            
            # Los gastos personales SOLO actualizan el saldo del sobre.
            # La ganancia_usd del ciclo NUNCA se toca aquí.
            ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
            
            if ciclo.bolivares_sobre_restantes > 0.01:
                ciclo.status = "abierto"

    # If it was a debt payment, restore debt balance
    if gasto.deuda_id:
        deuda = db.query(DeudaPersonal).filter(DeudaPersonal.id == gasto.deuda_id).first()
        if deuda:
            deuda.saldo_pendiente_usd += gasto.monto_usd
            deuda.estado = "activa"

    db.delete(gasto)
    db.commit()
    return {"message": "Gasto eliminado, capital y sobre restaurados."}

# 3. INGRESOS PERSONALES
@app.get("/api/personal/ingresos")
def get_personal_ingresos(limit: int = 100, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ingresos = db.query(IngresoPersonal).order_by(IngresoPersonal.fecha.desc()).limit(limit).all()
    result = []
    for i in ingresos:
        result.append({
            "id": i.id,
            "fecha": i.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "monto": i.monto,
            "moneda": i.moneda,
            "tasa_bcv": i.tasa_bcv,
            "monto_usd": i.monto_usd,
            "categoria_id": i.categoria_id,
            "categoria": i.categoria.nombre if i.categoria else "Otros",
            "icono": i.categoria.icono if i.categoria else "⚙️",
            "plataforma_pago": i.plataforma_pago,
            "detalles": i.detalles
        })
    return result

@app.post("/api/personal/ingresos")
def create_personal_ingreso(req: IngresoPersonalCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.id == req.categoria_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Categoría no encontrada.")
        
    monto_usd = req.monto
    if req.moneda == "VES":
        if req.tasa_bcv <= 0:
            raise HTTPException(status_code=400, detail="Para registrar en VES, debes incluir una tasa BCV válida.")
        monto_usd = req.monto / req.tasa_bcv

    # A: Lógica de Sueldo Auto-asignado: Debe debitarse de alguna cuenta de trabajo (ej. Provincial/BDV/Zelle)
    if cat.nombre == "Sueldo Auto-asignado":
        plat_origen = "Provincial VES"
        if "zelle" in (req.detalles or "").lower():
            plat_origen = "Zelle"
        elif "bdv" in (req.detalles or "").lower():
            plat_origen = "BDV (VES)"
        
        db_plat_origen = map_plataforma_nombre(plat_origen, req.moneda)
        capital_origen = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_origen)).first()
        if capital_origen:
            if capital_origen.convertir_ves:
                # Cuenta en bolívares: sólo afecta saldo_ves
                if req.moneda == "VES":
                    capital_origen.saldo_ves -= req.monto
                else:
                    capital_origen.saldo_ves -= (req.monto * req.tasa_bcv)
            else:
                # Cuenta en dólares: sólo afecta saldo_usd
                if req.moneda == "USD":
                    capital_origen.saldo_usd -= req.monto
                else:
                    capital_origen.saldo_usd -= monto_usd

    # B: Lógica de Cuenta de Destino del Ingreso: Debe sumarse a la cuenta donde ingresa el dinero
    if req.plataforma_pago:
        plat_destino = req.plataforma_pago.strip()
        db_plat_destino = map_plataforma_nombre(plat_destino, req.moneda)
        capital_destino = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_destino)).first()
        if capital_destino:
            if capital_destino.convertir_ves:
                # Cuenta en bolívares: sólo afecta saldo_ves
                if req.moneda == "VES":
                    capital_destino.saldo_ves += req.monto
                else:
                    capital_destino.saldo_ves += (req.monto * req.tasa_bcv)
            else:
                # Cuenta en dólares: sólo afecta saldo_usd
                if req.moneda == "USD":
                    capital_destino.saldo_usd += req.monto
                else:
                    capital_destino.saldo_usd += monto_usd

    ingreso = IngresoPersonal(
        fecha=parse_personal_date(req.fecha),
        monto=req.monto,
        moneda=req.moneda,
        tasa_bcv=req.tasa_bcv,
        monto_usd=monto_usd,
        categoria_id=req.categoria_id,
        plataforma_pago=req.plataforma_pago,
        detalles=req.detalles
    )
    db.add(ingreso)
    db.commit()
    return {"message": "Ingreso personal registrado con éxito", "id": ingreso.id}

@app.put("/api/personal/ingresos/{ingreso_id}")
def update_personal_ingreso(ingreso_id: int, req: IngresoPersonalUpdate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ingreso = db.query(IngresoPersonal).filter(IngresoPersonal.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
        
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.id == req.categoria_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Categoría no encontrada.")

    # 1. Revert previous Sueldo Auto-asignado if applicable
    if ingreso.categoria and ingreso.categoria.nombre == "Sueldo Auto-asignado":
        plat_origen = "Provincial VES"
        if "zelle" in (ingreso.detalles or "").lower():
            plat_origen = "Zelle"
        elif "bdv" in (ingreso.detalles or "").lower():
            plat_origen = "BDV (VES)"
            
        db_plat_origen = map_plataforma_nombre(plat_origen, ingreso.moneda)
        old_cap_origen = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_origen)).first()
        if old_cap_origen:
            if old_cap_origen.convertir_ves:
                if ingreso.moneda == "VES":
                    old_cap_origen.saldo_ves += ingreso.monto
                else:
                    old_cap_origen.saldo_ves += (ingreso.monto * ingreso.tasa_bcv)
            else:
                if ingreso.moneda == "USD":
                    old_cap_origen.saldo_usd += ingreso.monto
                else:
                    old_cap_origen.saldo_usd += ingreso.monto_usd

    # 2. Revert previous destination platform addition
    if ingreso.plataforma_pago:
        plat_dest = ingreso.plataforma_pago.strip()
        db_plat_dest = map_plataforma_nombre(plat_dest, ingreso.moneda)
        old_cap_dest = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_dest)).first()
        if old_cap_dest:
            if old_cap_dest.convertir_ves:
                if ingreso.moneda == "VES":
                    old_cap_dest.saldo_ves -= ingreso.monto
                else:
                    old_cap_dest.saldo_ves -= (ingreso.monto * ingreso.tasa_bcv)
            else:
                if ingreso.moneda == "USD":
                    old_cap_dest.saldo_usd -= ingreso.monto
                else:
                    old_cap_dest.saldo_usd -= ingreso.monto_usd

    # 3. Calculate new USD equivalent
    monto_usd = req.monto
    if req.moneda == "VES":
        if req.tasa_bcv <= 0:
            raise HTTPException(status_code=400, detail="Para registrar en VES, debes incluir una tasa BCV válida.")
        monto_usd = req.monto / req.tasa_bcv

    # 4. Apply new Sueldo Auto-asignado debit if applicable
    if cat.nombre == "Sueldo Auto-asignado":
        plat_origen = "Provincial VES"
        if "zelle" in (req.detalles or "").lower():
            plat_origen = "Zelle"
        elif "bdv" in (req.detalles or "").lower():
            plat_origen = "BDV (VES)"
        
        db_plat_origen = map_plataforma_nombre(plat_origen, req.moneda)
        new_cap_origen = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_origen)).first()
        if new_cap_origen:
            if new_cap_origen.convertir_ves:
                if req.moneda == "VES":
                    new_cap_origen.saldo_ves -= req.monto
                else:
                    new_cap_origen.saldo_ves -= (req.monto * req.tasa_bcv)
            else:
                if req.moneda == "USD":
                    new_cap_origen.saldo_usd -= req.monto
                else:
                    new_cap_origen.saldo_usd -= monto_usd

    # 5. Apply new destination platform addition
    if req.plataforma_pago:
        plat_destino = req.plataforma_pago.strip()
        db_plat_destino = map_plataforma_nombre(plat_destino, req.moneda)
        new_cap_destino = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_destino)).first()
        if new_cap_destino:
            if new_cap_destino.convertir_ves:
                if req.moneda == "VES":
                    new_cap_destino.saldo_ves += req.monto
                else:
                    new_cap_destino.saldo_ves += (req.monto * req.tasa_bcv)
            else:
                if req.moneda == "USD":
                    new_cap_destino.saldo_usd += req.monto
                else:
                    new_cap_destino.saldo_usd += monto_usd

    # 6. Update fields
    if req.fecha:
        ingreso.fecha = parse_personal_date(req.fecha)
    ingreso.monto = req.monto
    ingreso.moneda = req.moneda
    ingreso.tasa_bcv = req.tasa_bcv
    ingreso.monto_usd = monto_usd
    ingreso.categoria_id = req.categoria_id
    ingreso.plataforma_pago = req.plataforma_pago
    ingreso.detalles = req.detalles

    db.commit()
    db.refresh(ingreso)
    return {"message": "Ingreso personal actualizado con éxito"}

@app.delete("/api/personal/ingresos/{ingreso_id}")
def delete_personal_ingreso(ingreso_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ingreso = db.query(IngresoPersonal).filter(IngresoPersonal.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
        
    # Revert A: Sueldo Auto-asignado (devolviendo fondos a la cuenta de origen de trabajo)
    if ingreso.categoria and ingreso.categoria.nombre == "Sueldo Auto-asignado":
        plat_origen = "Provincial VES"
        if "zelle" in (ingreso.detalles or "").lower():
            plat_origen = "Zelle"
        elif "bdv" in (ingreso.detalles or "").lower():
            plat_origen = "BDV (VES)"
            
        db_plat_origen = map_plataforma_nombre(plat_origen, ingreso.moneda)
        capital_origen = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_origen)).first()
        if capital_origen:
            if capital_origen.convertir_ves:
                if ingreso.moneda == "VES":
                    capital_origen.saldo_ves += ingreso.monto
                else:
                    capital_origen.saldo_ves += (ingreso.monto * ingreso.tasa_bcv)
            else:
                if ingreso.moneda == "USD":
                    capital_origen.saldo_usd += ingreso.monto
                else:
                    capital_origen.saldo_usd += ingreso.monto_usd

    # Revert B: Suma al capital de destino (restando el dinero ingresado)
    if ingreso.plataforma_pago:
        plat_destino = ingreso.plataforma_pago.strip()
        db_plat_destino = map_plataforma_nombre(plat_destino, ingreso.moneda)
        capital_destino = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(db_plat_destino)).first()
        if capital_destino:
            if capital_destino.convertir_ves:
                if ingreso.moneda == "VES":
                    capital_destino.saldo_ves -= ingreso.monto
                else:
                    capital_destino.saldo_ves -= (ingreso.monto * ingreso.tasa_bcv)
            else:
                if ingreso.moneda == "USD":
                    capital_destino.saldo_usd -= ingreso.monto
                else:
                    capital_destino.saldo_usd -= ingreso.monto_usd

    db.delete(ingreso)
    db.commit()
    return {"message": "Ingreso eliminado y capital revertido."}

# 3.5. MOVIMIENTOS PERSONALES CONSOLIDADOS (HISTORIAL GENERAL)
@app.get("/api/personal/movimientos")
def get_personal_movimientos(limit: int = 50, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    gastos = db.query(GastoPersonal).order_by(GastoPersonal.fecha.desc()).limit(limit).all()
    ingresos = db.query(IngresoPersonal).order_by(IngresoPersonal.fecha.desc()).limit(limit).all()
    
    movimientos = []
    for g in gastos:
        movimientos.append({
            "id": g.id,
            "tipo": "gasto",
            "fecha": g.fecha,
            "monto": g.monto,
            "moneda": g.moneda,
            "tasa_bcv": g.tasa_bcv,
            "monto_usd": g.monto_usd,
            "categoria": g.categoria.nombre if g.categoria else "Otros",
            "icono": g.categoria.icono if g.categoria else "⚙️",
            "subcategoria": g.subcategoria,
            "detalles": g.detalles,
            "plataforma_pago": g.plataforma_pago
        })
        
    for i in ingresos:
        movimientos.append({
            "id": i.id,
            "tipo": "ingreso",
            "fecha": i.fecha,
            "monto": i.monto,
            "moneda": i.moneda,
            "tasa_bcv": i.tasa_bcv,
            "monto_usd": i.monto_usd,
            "categoria": i.categoria.nombre if i.categoria else "Otros",
            "icono": i.categoria.icono if i.categoria else "⚙️",
            "subcategoria": None,
            "detalles": i.detalles,
            "plataforma_pago": "Ingreso"
        })
        
    # Sort by date descending
    movimientos.sort(key=lambda x: x["fecha"], reverse=True)
    
    result = []
    for m in movimientos[:limit]:
        m["fecha"] = m["fecha"].strftime("%d/%m/%Y %I:%M %p")
        result.append(m)
        
    return result

@app.get("/api/personal/movimientos/detalle")
def get_personal_movimientos_detalle(
    tipo: Optional[str] = None,          # "gasto", "ingreso", None=todos
    categoria_id: Optional[int] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    limit: int = 300,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint de movimientos con filtros + totales por categoría."""
    fi = parse_personal_date(fecha_inicio) if fecha_inicio else None
    ff = parse_personal_date(fecha_fin) if fecha_fin else None
    if ff:
        ff = ff.replace(hour=23, minute=59, second=59)

    movimientos = []

    if tipo != "ingreso":
        q = db.query(GastoPersonal)
        if fi: q = q.filter(GastoPersonal.fecha >= fi)
        if ff: q = q.filter(GastoPersonal.fecha <= ff)
        if categoria_id: q = q.filter(GastoPersonal.categoria_id == categoria_id)
        for g in q.order_by(GastoPersonal.fecha.desc()).limit(limit).all():
            movimientos.append({
                "id": g.id, "tipo": "gasto",
                "fecha": g.fecha.strftime("%d/%m/%Y %H:%M"),
                "monto": g.monto, "moneda": g.moneda,
                "tasa_bcv": g.tasa_bcv, "monto_usd": g.monto_usd,
                "categoria": g.categoria.nombre if g.categoria else "Otros",
                "categoria_id": g.categoria_id,
                "icono": g.categoria.icono if g.categoria else "⚙️",
                "subcategoria": g.subcategoria, "detalles": g.detalles,
                "plataforma_pago": g.plataforma_pago
            })

    if tipo != "gasto":
        q2 = db.query(IngresoPersonal)
        if fi: q2 = q2.filter(IngresoPersonal.fecha >= fi)
        if ff: q2 = q2.filter(IngresoPersonal.fecha <= ff)
        if categoria_id: q2 = q2.filter(IngresoPersonal.categoria_id == categoria_id)
        for i in q2.order_by(IngresoPersonal.fecha.desc()).limit(limit).all():
            movimientos.append({
                "id": i.id, "tipo": "ingreso",
                "fecha": i.fecha.strftime("%d/%m/%Y %H:%M"),
                "monto": i.monto, "moneda": i.moneda,
                "tasa_bcv": i.tasa_bcv, "monto_usd": i.monto_usd,
                "categoria": i.categoria.nombre if i.categoria else "Otros",
                "categoria_id": i.categoria_id,
                "icono": i.categoria.icono if i.categoria else "⚙️",
                "subcategoria": None, "detalles": i.detalles,
                "plataforma_pago": "Ingreso"
            })

    movimientos.sort(key=lambda x: x["fecha"], reverse=True)

    # Totales por categoría
    totales_cat: dict = {}
    for m in movimientos:
        key = f"{m['icono']} {m['categoria']}"
        if key not in totales_cat:
            totales_cat[key] = {"count": 0, "total_usd": 0.0, "tipo": m["tipo"]}
        totales_cat[key]["count"] += 1
        totales_cat[key]["total_usd"] = round(totales_cat[key]["total_usd"] + (m["monto_usd"] or 0.0), 2)

    total_general = round(sum(t["total_usd"] for t in totales_cat.values()), 2)

    return {
        "movimientos": movimientos[:limit],
        "totales_por_categoria": [
            {"categoria": k, "count": v["count"], "total_usd": v["total_usd"],
             "porcentaje": round(v["total_usd"] / total_general * 100, 1) if total_general > 0 else 0,
             "tipo": v["tipo"]}
            for k, v in sorted(totales_cat.items(), key=lambda x: x[1]["total_usd"], reverse=True)
        ],
        "total_general_usd": total_general,
        "total_registros": len(movimientos)
    }

# 4. DEUDAS
@app.get("/api/personal/deudas")
def get_personal_deudas(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    deudas = db.query(DeudaPersonal).order_by(DeudaPersonal.estado.asc(), DeudaPersonal.fecha_creacion.desc()).all()
    result = []
    for d in deudas:
        result.append({
            "id": d.id,
            "fecha_creacion": d.fecha_creacion.strftime("%d/%m/%Y") if d.fecha_creacion else None,
            "acreedor": d.acreedor,
            "monto_original_usd": d.monto_original_usd,
            "monto_bs_registro": d.monto_bs_registro,
            "tasa_bcv_registro": d.tasa_bcv_registro,
            "saldo_pendiente_usd": d.saldo_pendiente_usd,
            "categoria_compra": d.categoria_compra,
            "detalles": d.detalles,
            "estado": d.estado,
        })
    return result

@app.post("/api/personal/deudas")
def create_personal_deuda(req: DeudaPersonalCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    # Si llega en VES, calcular el equivalente USD
    monto_usd = req.monto_original_usd
    monto_bs = req.monto_bs_registro
    tasa_bcv = req.tasa_bcv_registro

    if req.moneda == "VES" and tasa_bcv and tasa_bcv > 0:
        monto_usd = round(req.monto_original_usd / tasa_bcv, 2)  # monto_original_usd aquí es el monto en Bs
        monto_bs = round(req.monto_original_usd, 2)
        tasa_bcv = round(tasa_bcv, 2)
    elif req.moneda == "USD" and tasa_bcv and tasa_bcv > 0:
        monto_bs = round(monto_usd * tasa_bcv, 2)
        monto_usd = round(monto_usd, 2)
        tasa_bcv = round(tasa_bcv, 2)
    else:
        monto_usd = round(monto_usd, 2)

    deuda = DeudaPersonal(
        fecha_creacion=parse_personal_date(req.fecha_creacion),
        acreedor=req.acreedor.strip(),
        monto_original_usd=monto_usd,
        saldo_pendiente_usd=monto_usd,
        monto_bs_registro=monto_bs,
        tasa_bcv_registro=tasa_bcv,
        categoria_compra=req.categoria_compra,
        detalles=req.detalles,
        estado="activa"
    )
    db.add(deuda)
    db.commit()
    return {"message": "Deuda registrada con éxito", "id": deuda.id}

@app.put("/api/personal/deudas/{deuda_id}")
def edit_personal_deuda(deuda_id: int, req: DeudaPersonalCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    deuda = db.query(DeudaPersonal).filter(DeudaPersonal.id == deuda_id).first()
    if not deuda:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")
    
    deuda.acreedor = req.acreedor.strip()
    deuda.categoria_compra = req.categoria_compra
    deuda.detalles = req.detalles
    if req.tasa_bcv_registro:
        deuda.tasa_bcv_registro = round(req.tasa_bcv_registro, 2)
    if req.monto_bs_registro:
        deuda.monto_bs_registro = round(req.monto_bs_registro, 2)

    # Recalculate pending balance
    suma_pagos = sum(p.monto_usd for p in deuda.pagos)
    nuevo_monto_usd = req.monto_original_usd
    if req.moneda == "VES" and req.tasa_bcv_registro and req.tasa_bcv_registro > 0:
        nuevo_monto_usd = round(req.monto_original_usd / req.tasa_bcv_registro, 2)
    deuda.monto_original_usd = nuevo_monto_usd
    deuda.saldo_pendiente_usd = max(0.0, nuevo_monto_usd - suma_pagos)
    
    if deuda.saldo_pendiente_usd <= 0.05:
        deuda.saldo_pendiente_usd = 0.0
        deuda.estado = "pagada"
    else:
        deuda.estado = "activa"
        
    db.commit()
    return {"message": "Deuda editada con éxito", "id": deuda.id, "saldo_pendiente": deuda.saldo_pendiente_usd}

@app.delete("/api/personal/deudas/{deuda_id}")
def delete_personal_deuda(deuda_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    deuda = db.query(DeudaPersonal).filter(DeudaPersonal.id == deuda_id).first()
    if not deuda:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")
    
    # Desassociate any payment expenses
    for p in deuda.pagos:
        p.deuda_id = None
        
    db.delete(deuda)
    db.commit()
    return {"message": "Deuda eliminada con éxito"}

@app.post("/api/personal/deudas/{deuda_id}/pagar")
def pay_personal_deuda(deuda_id: int, req: PagoDeudaRequest, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    deuda = db.query(DeudaPersonal).filter(DeudaPersonal.id == deuda_id).first()
    if not deuda:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")
    if deuda.estado == "pagada":
        raise HTTPException(status_code=400, detail="Esta deuda ya está totalmente pagada.")
        
    monto_usd = req.monto
    if req.moneda == "VES":
        if req.tasa_bcv <= 0:
            raise HTTPException(status_code=400, detail="Para registrar en VES, debes incluir una tasa BCV válida.")
        monto_usd = req.monto / req.tasa_bcv

    # Find the "Pago de Deuda" category
    cat = db.query(CategoriaPersonal).filter(CategoriaPersonal.nombre == "Pago de Deuda").first()
    if not cat:
        # Fallback to create it if seed failed
        cat = CategoriaPersonal(nombre="Pago de Deuda", tipo="gasto", icono="💸", editable=False)
        db.add(cat)
        db.commit()

    # Deduct capital from origin account
    plat_pago = req.plataforma_pago.strip()
    capital_target = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma.ilike(plat_pago)).first()
    if capital_target:
        if req.moneda == "VES":
            capital_target.saldo_ves -= req.monto
            if capital_target.convertir_ves and req.tasa_bcv > 0:
                capital_target.saldo_usd = capital_target.saldo_ves / req.tasa_bcv
        else:
            capital_target.saldo_usd -= monto_usd

    # Create Gasto
    gasto = GastoPersonal(
        fecha=parse_personal_date(req.fecha),
        monto=req.monto,
        moneda=req.moneda,
        tasa_bcv=req.tasa_bcv,
        monto_usd=monto_usd,
        categoria_id=cat.id,
        subcategoria=f"Pago a {deuda.acreedor}",
        detalles=req.detalles or f"Abono a deuda con {deuda.acreedor}",
        plataforma_pago=req.plataforma_pago,
        deuda_id=deuda.id
    )
    db.add(gasto)
    
    # Update Debt balance
    deuda.saldo_pendiente_usd = max(0.0, deuda.saldo_pendiente_usd - monto_usd)
    if deuda.saldo_pendiente_usd <= 0.05: # allow tiny rounding error
        deuda.saldo_pendiente_usd = 0.0
        deuda.estado = "pagada"
        
    db.commit()
    return {"message": "Abono a deuda registrado con éxito", "saldo_restante": deuda.saldo_pendiente_usd}

@app.get("/api/personal/deudas/{deuda_id}/abonos")
def get_deuda_abonos(deuda_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Devuelve todos los pagos/abonos registrados para una deuda específica."""
    deuda = db.query(DeudaPersonal).filter(DeudaPersonal.id == deuda_id).first()
    if not deuda:
        raise HTTPException(status_code=404, detail="Deuda no encontrada.")

    pagos = db.query(GastoPersonal).filter(
        GastoPersonal.deuda_id == deuda_id
    ).order_by(GastoPersonal.fecha.desc()).all()

    total_pagado = round(sum(p.monto_usd for p in pagos), 2)
    porcentaje_pagado = round(total_pagado / deuda.monto_original_usd * 100, 1) if deuda.monto_original_usd > 0 else 0

    return {
        "deuda": {
            "id": deuda.id,
            "acreedor": deuda.acreedor,
            "monto_original_usd": deuda.monto_original_usd,
            "monto_bs_registro": deuda.monto_bs_registro,
            "tasa_bcv_registro": deuda.tasa_bcv_registro,
            "saldo_pendiente_usd": deuda.saldo_pendiente_usd,
            "categoria_compra": deuda.categoria_compra,
            "detalles": deuda.detalles,
            "estado": deuda.estado,
            "fecha_creacion": deuda.fecha_creacion.strftime("%d/%m/%Y") if deuda.fecha_creacion else None,
        },
        "total_pagado_usd": total_pagado,
        "porcentaje_pagado": porcentaje_pagado,
        "total_abonos": len(pagos),
        "abonos": [
            {
                "id": p.id,
                "fecha": p.fecha.strftime("%d/%m/%Y %H:%M") if p.fecha else None,
                "monto": p.monto,
                "moneda": p.moneda,
                "tasa_bcv": p.tasa_bcv,
                "monto_usd": p.monto_usd,
                "plataforma_pago": p.plataforma_pago,
                "detalles": p.detalles,
            }
            for p in pagos
        ]
    }

# 5. ASESOR FINANCIERO Y DASHBOARD PERSONAL
@app.get("/api/personal/dashboard")
def get_personal_dashboard(
    desde: str = None,
    hasta: str = None,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    venezuela_now = get_venezuela_time()

    # Resolver rango de fechas según los parámetros recibidos
    if desde and hasta:
        try:
            inicio_mes = datetime.datetime.fromisoformat(desde)
            fin_periodo = datetime.datetime.fromisoformat(hasta) + datetime.timedelta(days=1)
        except Exception:
            inicio_mes = datetime.datetime(venezuela_now.year, venezuela_now.month, 1)
            fin_periodo = None
    else:
        inicio_mes = datetime.datetime(venezuela_now.year, venezuela_now.month, 1)
        fin_periodo = None
    
    # 1. Total debts pending
    total_deudas = db.query(func.sum(DeudaPersonal.saldo_pendiente_usd)).filter(DeudaPersonal.estado == "activa").scalar() or 0.0
    
    # 2. Total expenses in the selected period
    gastos_q = db.query(GastoPersonal).filter(GastoPersonal.fecha >= inicio_mes)
    if fin_periodo:
        gastos_q = gastos_q.filter(GastoPersonal.fecha < fin_periodo)
    gastos_mes = gastos_q.all()
    total_gastos_mes = sum(g.monto_usd for g in gastos_mes)
    
    # Gastos por categoría para el gráfico circular
    gastos_por_categoria = {}
    for g in gastos_mes:
        cat_name = g.categoria.nombre if g.categoria else "Otros"
        icono = g.categoria.icono if g.categoria else "⚙️"
        if cat_name == "Pago de Deuda" and g.subcategoria:
            acreedor = g.subcategoria.replace("Pago a ", "")
            key = f"💸 Deuda: {acreedor}"
        else:
            key = f"{icono} {cat_name}"
        gastos_por_categoria[key] = gastos_por_categoria.get(key, 0.0) + g.monto_usd

    # 3. Total incomes in the selected period
    ingresos_q = db.query(IngresoPersonal).filter(IngresoPersonal.fecha >= inicio_mes)
    if fin_periodo:
        ingresos_q = ingresos_q.filter(IngresoPersonal.fecha < fin_periodo)
    ingresos_mes = ingresos_q.all()
    total_ingresos_mes = sum(i.monto_usd for i in ingresos_mes)
    
    # Ingresos por categoría/detalle discretizados para el gráfico circular
    ingresos_por_categoria = {}
    for i in ingresos_mes:
        # Usar detalles para discretizar si existe, sino el nombre de la categoría
        nombre_ingreso = i.detalles.strip() if i.detalles else (i.categoria.nombre if i.categoria else "Otros")
        if nombre_ingreso:
            # Capitalizar primera letra para estética
            nombre_ingreso = nombre_ingreso[0].upper() + nombre_ingreso[1:]
        else:
            nombre_ingreso = "Otros"
            
        # No truncar: el tooltip del gráfico muestra el nombre completo
        if len(nombre_ingreso) > 40:
            nombre_ingreso = nombre_ingreso[:38] + "..."
            
        icono = i.categoria.icono if (i.categoria and i.categoria.icono) else "💵"
        key = f"{icono} {nombre_ingreso}"
        ingresos_por_categoria[key] = ingresos_por_categoria.get(key, 0.0) + i.monto_usd
        
    # 4. Cálculo de Ganancia Operativa del Negocio en el mes actual (Ciclos + Remesas)
    # Se suman TODOS los ciclos del mes (abiertos y cerrados) porque ganancia_usd
    # se actualiza en tiempo real con cada compra registrada. El cierre del ciclo
    # es solo una marca administrativa de que se agotaron los bolívares del sobre,
    # no el momento en que nace la ganancia.
    ciclos_q = db.query(HistorialCiclos).filter(HistorialCiclos.fecha >= inicio_mes)
    if fin_periodo:
        ciclos_q = ciclos_q.filter(HistorialCiclos.fecha < fin_periodo)
    ciclos_mes = ciclos_q.all()
    ganancia_ciclos = sum(c.ganancia_usd for c in ciclos_mes if c.ganancia_usd is not None)
    
    # Remesas del periodo seleccionado
    remesas_q = db.query(HistorialRemesas).filter(HistorialRemesas.fecha >= inicio_mes)
    if fin_periodo:
        remesas_q = remesas_q.filter(HistorialRemesas.fecha < fin_periodo)
    remesas_mes = remesas_q.all()
    ganancia_remesas = sum(r.ganancia_usd for r in remesas_mes if r.ganancia_usd is not None)
    
    ganancia_negocio = round(ganancia_ciclos + ganancia_remesas, 2)
    
    # Inyectar las ganancias del negocio en la distribución de ingresos para el gráfico
    if ganancia_ciclos > 0:
        ingresos_por_categoria["💼 Arbitraje (Ciclos)"] = round(ganancia_ciclos, 2)
    if ganancia_remesas > 0:
        ingresos_por_categoria["✈️ Remesas"] = round(ganancia_remesas, 2)
    
    # 5. Sueldo Óptimo Recomendado (40% de la ganancia del negocio)
    sueldo_sugerido = ganancia_negocio * 0.40
    
    # 6. Ingreso Total Consolidado (Negocio + Personal)
    total_ingresos_consolidado = round(ganancia_negocio + total_ingresos_mes, 2)
    
    # 7. Crecimiento Neto Real (incluye ganancia del negocio + ingresos personales - gastos)
    crecimiento_neto = round(total_ingresos_consolidado - total_gastos_mes, 2)
    
    # 7. Asesor Financiero Pro - Alertas Semáforo
    alertas = []
    
    # Alerta Roja: Déficit real (gastos > ingreso total consolidado)
    if total_gastos_mes > total_ingresos_consolidado:
        diff = round(total_gastos_mes - total_ingresos_consolidado, 2)
        # Find category with maximum expense this month to offer actionable tip
        max_cat = "Otros"
        max_val = 0.0
        for k, v in gastos_por_categoria.items():
            if v > max_val:
                max_val = v
                max_cat = k
        alertas.append({
            "tipo": "rojo",
            "mensaje": f"⚠️ ALERTA DE DÉFICIT: Tus gastos de este mes superan tu ingreso total consolidado por ${round(diff, 2)} USD. Estás drenando tu capital de trabajo. Se recomienda recortar gastos en {max_cat} inmediatamente."
        })
    elif total_gastos_mes > 0 and total_ingresos_consolidado > 0:
        # Alerta Amarilla: Gasto alto (más del 85% del ingreso consolidado)
        ratio = total_gastos_mes / total_ingresos_consolidado
        if ratio > 0.85:
            alertas.append({
                "tipo": "amarillo",
                "mensaje": f"⚠️ ALERTA DE AHORRO: Has consumido el {round(ratio * 100)}% de tu ingreso total del mes (negocio + personal). Tu margen de seguridad es mínimo."
            })
            
    # Alerta de inversión / reinversión (Verde)
    if ganancia_negocio > 0:
        alertas.append({
            "tipo": "verde",
            "mensaje": f"📈 ASESOR PRO: Has generado ${round(ganancia_negocio, 2)} USD en ganancias de negocio este mes. Tu sueldo asignado saludable recomendado es de hasta ${round(sueldo_sugerido, 2)} USD, permitiéndote reinvertir ${round(ganancia_negocio - sueldo_sugerido, 2)} USD para hacer crecer tu capital de trabajo."
        })
    else:
        alertas.append({
            "tipo": "verde",
            "mensaje": "💡 CONSEJO ADVISOR: Registra tus ciclos de arbitraje y remesas para que el asesor pueda sugerir el sueldo de reinversión óptimo."
        })

    # Alerta de Deudas
    deudas_activas = db.query(DeudaPersonal).filter(DeudaPersonal.estado == "activa").all()
    if len(deudas_activas) > 0:
        alertas.append({
            "tipo": "amarillo",
            "mensaje": f"💳 CONTROL DE DEUDAS: Tienes {len(deudas_activas)} cuentas por pagar activas que suman ${round(total_deudas, 2)} USD. Trata de destinar un 10% de tu sueldo a amortizarlas de forma prioritaria."
        })
        
    return {
        "total_deudas": total_deudas,
        "total_gastos_mes": total_gastos_mes,
        "total_ingresos_mes": total_ingresos_mes,
        "total_ingresos_consolidado": total_ingresos_consolidado,
        "crecimiento_neto": crecimiento_neto,
        "sueldo_sugerido": sueldo_sugerido,
        "ganancia_negocio": ganancia_negocio,
        "gastos_por_categoria": gastos_por_categoria,
        "ingresos_por_categoria": ingresos_por_categoria,
        "alertas": alertas
    }

# 6. VERIFICAR Y CAMBIAR PIN PERSONAL
@app.post("/api/personal/verify-pin")
def verify_personal_pin(req: PinVerifyRequest, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    # Retrieve user personal pin (defaulting to "0000" if null or empty)
    stored_pin = user.personal_pin or "0000"
    if req.pin != stored_pin:
        raise HTTPException(status_code=400, detail="PIN incorrecto")
        
    return {"message": "PIN verificado correctamente", "success": True}

@app.post("/api/personal/change-pin")
def change_personal_pin(req: PinChangeRequest, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    stored_pin = user.personal_pin or "0000"
    if req.old_pin != stored_pin:
        raise HTTPException(status_code=400, detail="PIN anterior incorrecto")
        
    if not req.new_pin or len(req.new_pin) != 4 or not req.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="El nuevo PIN debe ser de exactamente 4 dígitos numéricos.")
        
    user.personal_pin = req.new_pin
    db.commit()
    return {"message": "PIN actualizado exitosamente"}


# ============================================================
# BLOQUE 7: ORQUESTADOR DE ESTRATEGIAS (PILAR A)
# ============================================================
class CalcularEstrategiaRequest(BaseModel):
    capital: float
    tasa_usdt_p2p: float
    tasa_compra_efectivo: float
    comision_cash_zelle: float
    tasa_bcv: float
    spread_zelle_usdt: float
    tasa_remesa_cliente: float
    comision_maker_p2p: float
    comision_bpay_bdv: float
    comision_bpay_provincial: float
    comision_bpay_mercantil: float
    pago_movil_auto: bool = False

class GuardarEstrategiaRequest(CalcularEstrategiaRequest):
    pass

@app.post("/api/estrategias/calcular")
def calcular_estrategias(req: CalcularEstrategiaRequest, username: str = Depends(get_current_user)):
    cap = req.capital
    
    # Determinar comision de pago movil (0.3%)
    pm_fee = 0.003 if req.pago_movil_auto else 0.0

    # 1. R1: Ciclo Remesas Tradicional
    roi_r1 = 0.0
    ganancia_r1 = 0.0
    if req.tasa_remesa_cliente > 0 and req.tasa_usdt_p2p > 0 and cap > 0:
        try:
            costo_adq_pct = req.spread_zelle_usdt
            comision_bin_pct = req.comision_maker_p2p
            f_costo = 1.0 + (costo_adq_pct / 100.0) + (comision_bin_pct / 100.0)
            
            # Réplica exacta del simulador frontend
            ves_recibir = round(cap * req.tasa_remesa_cliente, 2)
            ves_gastados_totales = round(ves_recibir * (1.0 + pm_fee), 2)
            usdt_gastados = round(ves_gastados_totales / req.tasa_usdt_p2p, 2)
            costo_real_usd = round(usdt_gastados * f_costo, 2)
            
            ganancia_r1 = round(cap - costo_real_usd, 2)
            roi_r1 = round((ganancia_r1 / cap) * 100.0, 2)
        except Exception:
            pass

    # 2. R2: Provincial (Arbitraje BCV)
    roi_r2_prov = 0.0
    ganancia_r2_prov = 0.0
    cost_factor_prov = req.tasa_bcv * (1 + 0.005 + pm_fee)
    if cost_factor_prov > 0 and req.tasa_usdt_p2p > 0:
        try:
            bs_inicial_r2_prov = cap * (1 - (req.comision_maker_p2p / 100)) * req.tasa_usdt_p2p
            suggested_usd_prov = math.floor(bs_inicial_r2_prov / cost_factor_prov)
            bolivares_gastados_prov = suggested_usd_prov * cost_factor_prov
            usd_neto_prov = suggested_usd_prov * (1 - (req.comision_bpay_provincial / 100))
            usdt_final_r2_prov = usd_neto_prov * (1 - 0.041)  # 4.1% Binance deposit fee
            usd_cost_operation_prov = bolivares_gastados_prov / req.tasa_usdt_p2p
            if usd_cost_operation_prov > 0:
                roi_r2_prov = ((usdt_final_r2_prov - usd_cost_operation_prov) / usd_cost_operation_prov) * 100
                ganancia_r2_prov = usdt_final_r2_prov - usd_cost_operation_prov
        except Exception:
            pass

    # 3. R2: Mercantil (Arbitraje BCV)
    roi_r2_merc = 0.0
    ganancia_r2_merc = 0.0
    cost_factor_merc = req.tasa_bcv * (1 + 0.005 + pm_fee)
    if cost_factor_merc > 0 and req.tasa_usdt_p2p > 0:
        try:
            bs_inicial_r2_merc = cap * (1 - (req.comision_maker_p2p / 100)) * req.tasa_usdt_p2p
            suggested_usd_merc = math.floor(bs_inicial_r2_merc / cost_factor_merc)
            bolivares_gastados_merc = suggested_usd_merc * cost_factor_merc
            usd_neto_merc = suggested_usd_merc * (1 - (req.comision_bpay_mercantil / 100))
            usdt_final_r2_merc = usd_neto_merc * (1 - 0.041)  # 4.1% Binance deposit fee
            usd_cost_operation_merc = bolivares_gastados_merc / req.tasa_usdt_p2p
            if usd_cost_operation_merc > 0:
                roi_r2_merc = ((usdt_final_r2_merc - usd_cost_operation_merc) / usd_cost_operation_merc) * 100
                ganancia_r2_merc = usdt_final_r2_merc - usd_cost_operation_merc
        except Exception:
            pass

    # 4. R2: BDV Tercera Edad (Arbitraje BCV)
    roi_r2_bdv = 0.0
    ganancia_r2_bdv = 0.0
    cost_factor_bdv = req.tasa_bcv * (1 + 0.0 + pm_fee)
    if cost_factor_bdv > 0 and req.tasa_usdt_p2p > 0:
        try:
            bs_inicial_r2_bdv = cap * (1 - (req.comision_maker_p2p / 100)) * req.tasa_usdt_p2p
            suggested_usd_bdv = math.floor(bs_inicial_r2_bdv / cost_factor_bdv)
            bolivares_gastados_bdv = suggested_usd_bdv * cost_factor_bdv
            usd_neto_bdv = suggested_usd_bdv * (1 - (req.comision_bpay_bdv / 100))
            usdt_final_r2_bdv = usd_neto_bdv * (1 - 0.041)  # 4.1% Binance deposit fee
            usd_cost_operation_bdv = bolivares_gastados_bdv / req.tasa_usdt_p2p
            if usd_cost_operation_bdv > 0:
                roi_r2_bdv = ((usdt_final_r2_bdv - usd_cost_operation_bdv) / usd_cost_operation_bdv) * 100
                ganancia_r2_bdv = usdt_final_r2_bdv - usd_cost_operation_bdv
        except Exception:
            pass

    # 5. R5: AirTM Backup
    # Ofrece remesas pero pagando por AirTM (spread ~0.5% menor que Zelle)
    roi_r5 = max(0.0, roi_r1 - 1.0)
    ganancia_r5 = cap * (roi_r5 / 100)

    # 6. R6: Zinli Premium
    # Clientes premium con tasa de cambio favorable (Zinli limit)
    roi_r6 = roi_r1 + 1.2
    ganancia_r6 = cap * (roi_r6 / 100)

    # 7. R4: Flujo Inverso Bs -> USDT
    # Venta de USDT directamente a tasa algo menor (compras P2P maker y vendes)
    roi_r4 = 1.6  # ROI estático promedio de spread local sin Zelle
    ganancia_r4 = cap * (roi_r4 / 100)

    # 8. R8: Arbitraje P2P Maker
    # Spread compra/venta rápido en Binance VES (comision maker Binance)
    roi_r8 = 0.22  # ROI unitario por vuelta
    ganancia_r8 = cap * (roi_r8 / 100)

    # 9. R9: Ciclo Cash-to-Zelle
    roi_r9 = 0.0
    ganancia_r9 = 0.0
    if req.tasa_compra_efectivo > 0 and req.tasa_usdt_p2p > 0:
        try:
            bs_r9 = cap * req.tasa_usdt_p2p
            usd_cash_r9 = bs_r9 / req.tasa_compra_efectivo
            usd_zelle_r9 = usd_cash_r9 * (1 + (req.comision_cash_zelle / 100))
            usdt_final_r9 = usd_zelle_r9 * (1 - (req.spread_zelle_usdt / 100))
            roi_r9 = ((usdt_final_r9 - cap) / cap) * 100
            ganancia_r9 = usdt_final_r9 - cap
        except Exception:
            pass

    # 10. R7: Binance Earn (Pasivo)
    roi_r7 = 0.5  # 0.5% mensual estimado
    ganancia_r7 = cap * (roi_r7 / 100)

    # Armar lista de resultados
    rutas = [
        {"id": "R2_PROV", "nombre": "Arbitraje Provincial (BCV)", "roi": round(roi_r2_prov, 2), "ganancia": round(ganancia_r2_prov, 2), "velocidad": "Mismo día (Tarde)", "zelle": "NO consume", "riesgo": "Aprobación de cupo"},
        {"id": "R9_CASH", "nombre": "Ciclo Cash-to-Zelle", "roi": round(roi_r9, 2), "ganancia": round(ganancia_r9, 2), "velocidad": "1-2 días", "zelle": "SÍ (Entrada)", "riesgo": "Filtros de Zelle / Efectivo físico"},
        {"id": "R2_MERC", "nombre": "Arbitraje Mercantil (BCV)", "roi": round(roi_r2_merc, 2), "ganancia": round(ganancia_r2_merc, 2), "velocidad": "Siguiente día", "zelle": "NO consume", "riesgo": "Aprobación de cupo"},
        {"id": "R1_REMESAS", "nombre": "Ciclo Remesas Tradicional", "roi": round(roi_r1, 2), "ganancia": round(ganancia_r1, 2), "velocidad": "1-3 horas", "zelle": "SÍ (Salida)", "riesgo": "Límites Zelle / Volumen de clientes"},
        {"id": "R2_BDV", "nombre": "Arbitraje BDV (Tercera Edad)", "roi": round(roi_r2_bdv, 2), "ganancia": round(ganancia_r2_bdv, 2), "velocidad": "Inmediato", "zelle": "NO consume", "riesgo": "Aprobación de cupo"},
        {"id": "R5_AIRTM", "nombre": "AirTM Backup Remesas", "roi": round(roi_r5, 2), "ganancia": round(ganancia_r5, 2), "velocidad": "1-3 horas", "zelle": "NO consume (AirTM)", "riesgo": "Menos volumen de clientes"},
        {"id": "R6_ZINLI", "nombre": "Zinli Premium (Cupo Limit)", "roi": round(roi_r6, 2), "ganancia": round(ganancia_r6, 2), "velocidad": "1-3 horas", "zelle": "NO consume (Zinli)", "riesgo": "Cupo de $1000/mes máximo"},
        {"id": "R4_INVERSO", "nombre": "Flujo Inverso Bs ➔ USDT", "roi": round(roi_r4, 2), "ganancia": round(ganancia_r4, 2), "velocidad": "Mismo día", "zelle": "NO consume", "riesgo": "Spread cambiario volátil"},
        {"id": "R8_MAKER", "nombre": "Arbitraje P2P Maker (VES)", "roi": round(roi_r8, 2), "ganancia": round(ganancia_r8, 2), "velocidad": "Rápido (Múltiples vueltas)", "zelle": "NO consume", "riesgo": "Riesgo de bloqueo de cuentas VES"},
        {"id": "R7_EARN", "nombre": "Binance Earn (Dinero en espera)", "roi": round(roi_r7, 2), "ganancia": round(ganancia_r7, 2), "velocidad": "Pasivo", "zelle": "NO consume", "riesgo": "Ninguno (Retiro inmediato)"}
    ]

    # Ordenar rutas por ROI de mayor a menor
    rutas_ordenadas = sorted(rutas, key=lambda x: x["roi"], reverse=True)

    # Generar sugerencia inteligente del Orquestador
    sug_detalles = []
    
    # 1. Identificar mejor ruta libre de Zelle
    mejor_no_zelle = next((r for r in rutas_ordenadas if "NO consume" in r["zelle"]), None)
    # 2. Identificar mejor ruta con Zelle
    mejor_con_zelle = next((r for r in rutas_ordenadas if "SÍ" in r["zelle"]), None)

    if mejor_no_zelle and mejor_no_zelle["roi"] > 4.0:
        sug_detalles.append(f"Prioriza la ruta bancaria **{mejor_no_zelle['nombre']}** con ROI de **{mejor_no_zelle['roi']}%** para no desgastar límites de Zelle.")
    
    if mejor_con_zelle:
        if mejor_con_zelle["id"] == "R9_CASH":
            sug_detalles.append(f"El **Ciclo Cash-to-Zelle** está ofreciendo un excelente ROI de **{mejor_con_zelle['roi']}%**. Tu capital de ${cap} cabe perfecto en el límite diario ($2,500). Puedes ejecutarlo sin exceder el cupo.")
        else:
            sug_detalles.append(f"El **Ciclo Remesas Tradicional** ofrece **{mejor_con_zelle['roi']}%** de ROI. Cuida no rebasar tu límite mensual de $20,000.")

    # Alerta de bancos pesados
    sug_detalles.append("Si los bancos están rebotando compras de divisas hoy, coloca los bolívares en remesas express o mantén el USDT en Binance Earn temporalmente para que no quede inactivo.")

    recomendacion = " | ".join(sug_detalles)

    return {
        "capital": cap,
        "rutas": rutas_ordenadas,
        "recomendacion": recomendacion
    }

@app.post("/api/estrategias/guardar")
def guardar_simulacion(req: GuardarEstrategiaRequest, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    sim = SimulacionRutas(
        tasa_usdt_p2p=req.tasa_usdt_p2p,
        tasa_compra_efectivo=req.tasa_compra_efectivo,
        comision_cash_zelle=req.comision_cash_zelle,
        tasa_bcv=req.tasa_bcv,
        spread_zelle_usdt=req.spread_zelle_usdt,
        tasa_remesa_cliente=req.tasa_remesa_cliente,
        comision_maker_p2p=req.comision_maker_p2p,
        comision_bpay_bdv=req.comision_bpay_bdv,
        comision_bpay_provincial=req.comision_bpay_provincial,
        comision_bpay_mercantil=req.comision_bpay_mercantil,
        capital=req.capital
    )
    db.add(sim)
    db.commit()
    return {"message": "Simulación guardada en el historial", "id": sim.id}

@app.get("/api/estrategias/historial")
def get_historial_simulaciones(limit: int = 15, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    sims = db.query(SimulacionRutas).order_by(SimulacionRutas.fecha.desc()).limit(limit).all()
    res = []
    for s in sims:
        res.append({
            "id": s.id,
            "fecha": s.fecha.strftime("%d/%m/%Y %H:%M"),
            "capital": s.capital,
            "tasa_usdt_p2p": s.tasa_usdt_p2p,
            "tasa_compra_efectivo": s.tasa_compra_efectivo,
            "comision_cash_zelle": s.comision_cash_zelle,
            "tasa_bcv": s.tasa_bcv,
            "spread_zelle_usdt": s.spread_zelle_usdt,
            "tasa_remesa_cliente": s.tasa_remesa_cliente
        })
    return res


# ── ADMIN DIAGNOSTIC ENDPOINT ────────────────────────────────────────────────
@app.post("/api/admin/clean-zelle")
def admin_clean_zelle(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes duplicate Zelle ledger entries and reconciles Zelle platform balance."""
    # 1. Update ID 35 to link to remesa 53 and correct its metadata
    m35 = db.query(MovimientoZelle).filter(MovimientoZelle.id == 35).first()
    if m35:
        m35.remesa_id = 53
        m35.estado = "remesado"
        m35.detalle = "Remesa ID #53 de José Figueroa"
        
    # 2. Duplicate IDs to delete
    duplicate_ids = [34, 66, 58, 33, 55, 54, 56, 50]
    deleted_count = 0
    for mid in duplicate_ids:
        m = db.query(MovimientoZelle).filter(MovimientoZelle.id == mid).first()
        if m:
            db.delete(m)
            deleted_count += 1
            
    db.commit()
    
    # 3. Reconcile Zelle platform balance based on net sum of remaining movements
    remaining_movs = db.query(MovimientoZelle).all()
    total_ingresos = sum(m.monto for m in remaining_movs if m.tipo == "ingreso")
    total_egresos = sum(m.monto for m in remaining_movs if m.tipo == "egreso")
    net_balance = round(total_ingresos - total_egresos, 2)
    
    zelle_plat = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == "Zelle").first()
    old_balance = 0.0
    if zelle_plat:
        old_balance = zelle_plat.saldo_usd
        zelle_plat.saldo_usd = net_balance
        
    db.commit()
    
    return {
        "message": "Zelle ledger cleaned and reconciled successfully",
        "deleted_count": deleted_count,
        "old_balance": old_balance,
        "new_balance": net_balance
    }

@app.get("/api/admin/diagnose")
def admin_diagnose(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns raw cycle data for debugging profit calculations."""
    ciclos = db.query(HistorialCiclos).all()
    result = []
    for c in ciclos:
        compras = c.compras_parciales or []
        compras_reales = [cp for cp in compras if cp.usd_comprados is not None and cp.usd_comprados > 0.0]
        gastos_personales = [cp for cp in compras if cp.usd_comprados is None or cp.usd_comprados == 0.0]
        
        tasa = c.tasa_venta or 0.0
        usdt_vendidos = c.usdt_vendidos or 0.0
        ves_inicial = round(usdt_vendidos * 0.9975 * tasa, 2) if tasa > 0 else 0.0
        ves_restantes = c.bolivares_sobre_restantes or 0.0
        total_gastos_ves = sum(cp.transferencias_ves or 0.0 for cp in gastos_personales)
        ves_arbitraje = round(ves_inicial - ves_restantes - total_gastos_ves, 2)
        costo_usdt = round(ves_arbitraje / tasa, 2) if tasa > 0 else 0.0
        usd_recibidos = sum(cp.usd_recibidos_binance or 0.0 for cp in compras_reales)
        ganancia_calculada = round(usd_recibidos - costo_usdt, 2)
        
        result.append({
            "id": c.id,
            "status": c.status,
            "tasa_venta": tasa,
            "usdt_vendidos": usdt_vendidos,
            "ves_inicial": ves_inicial,
            "bolivares_sobre_restantes": ves_restantes,
            "total_gastos_personales_ves": total_gastos_ves,
            "ves_para_arbitraje": ves_arbitraje,
            "costo_usdt_calculado": costo_usdt,
            "usd_recibidos_total": round(usd_recibidos, 2),
            "ganancia_calculada": ganancia_calculada,
            "ganancia_en_db": c.ganancia_usd,
            "num_compras_reales": len(compras_reales),
            "num_gastos_personales": len(gastos_personales),
            "compras_reales": [{"banco": cp.banco, "usd_comprados": cp.usd_comprados, "usd_recibidos_binance": cp.usd_recibidos_binance, "tasa_bcv": cp.tasa_bcv, "transferencias_ves": cp.transferencias_ves} for cp in compras_reales],
            "gastos_personales": [{"banco": cp.banco, "transferencias_ves": cp.transferencias_ves} for cp in gastos_personales],
        })
    return result

@app.post("/api/admin/repair-profits")
def admin_repair_profits(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Recalculate profits for all cycles using individual purchase costs.
    Same formula as close_ciclo. Safe to call on open or closed cycles.
    """
    ciclos = db.query(HistorialCiclos).all()
    repaired = []
    for c in ciclos:
        old_ganancia = c.ganancia_usd
        compras_reales = [cp for cp in (c.compras_parciales or []) if cp.usd_comprados is not None and cp.usd_comprados > 0.0]
        
        if not compras_reales:
            c.ganancia_usd = 0.0
            c.ganancia_porcentaje = 0.0
            repaired.append({"id": c.id, "old_ganancia": old_ganancia, "new_ganancia": 0.0, "reason": "no compras reales"})
            continue
        
        tasa = c.tasa_venta or 0.0
        if tasa <= 0:
            repaired.append({"id": c.id, "old_ganancia": old_ganancia, "new_ganancia": old_ganancia, "skipped": True, "reason": "tasa_venta=0"})
            continue
        
        # Costo real en VES por compras individuales (mismo que usa close_ciclo)
        total_ves_cost = sum(
            ((cp.usd_comprados or 0.0) * (cp.tasa_bcv or 0.0))
            + (cp.comision_compra_ves or 0.0)
            + (cp.transferencias_ves or 0.0)
            for cp in compras_reales
        )
        usd_recibidos = sum((cp.usd_recibidos_binance or 0.0) for cp in compras_reales)
        costo_usdt = round(total_ves_cost / tasa, 2)
        nueva_ganancia = round(usd_recibidos - costo_usdt, 2)
        
        c.ganancia_usd = nueva_ganancia
        c.ganancia_porcentaje = round((usd_recibidos / costo_usdt - 1) * 100, 2) if costo_usdt > 0 else 0.0
        c.usd_recibidos_binance = round(usd_recibidos, 2)
        
        repaired.append({"id": c.id, "old_ganancia": old_ganancia, "new_ganancia": nueva_ganancia})
    
    db.commit()
    return {"repaired": len([r for r in repaired if not r.get("skipped")]), "details": repaired}


# Serve static frontend files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
