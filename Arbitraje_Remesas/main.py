from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import datetime
import requests
from bs4 import BeautifulSoup
import json
from jose import jwt, JWTError
import bcrypt
from pydantic import BaseModel
from typing import List, Optional

from database import SessionLocal, User, Titular, Tarjeta, CompraDivisa, HistorialCiclos, DistribucionCapital, HistorialCapitalDiario, HistorialRemesas, Cliente, CompraCicloParcial, engine

# JWT configuration
SECRET_KEY = "rhonny_arbitraje_secret_key_super_secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

security = HTTPBearer()

def get_venezuela_time():
    # Render servers run in UTC, so we subtract 4 hours to get Venezuela time (UTC-4)
    return datetime.datetime.utcnow() - datetime.timedelta(hours=4)

app = FastAPI(title="Sistema de Arbitraje y Remesas")

# CORS middleware for local testing/cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class CompraCicloParcialCreate(BaseModel):
    usd_comprados: float
    usd_procesados: float
    tasa_bcv: float
    comision_compra_ves: float
    transferencias_ves: float
    usd_recibidos_binance: float

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

class ClienteCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    genero: Optional[str] = "Masculino"

class BCVModeRequest(BaseModel):
    mode: str

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
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user.password_hash.encode('utf-8')):
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

# Titulares & Cards Routes
@app.get("/api/titulares")
def get_titulares(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    titulares = db.query(Titular).all()
    
    # Calculate monthly consumption per card
    now = get_venezuela_time()
    start_of_month = datetime.datetime(now.year, now.month, 1)
    
    result = []
    for tit in titulares:
        cards_data = []
        for card in tit.tarjetas:
            # Query sum of purchases in this month for this card
            purchases_sum = db.query(CompraDivisa).filter(
                CompraDivisa.tarjeta_id == card.id,
                CompraDivisa.fecha >= start_of_month
            ).all()
            monthly_consumed = sum(p.monto_usd for p in purchases_sum)
            
            cards_data.append({
                "id": card.id,
                "banco": card.banco,
                "tipo_tarjeta": card.tipo_tarjeta,
                "limite_diario": card.limite_diario,
                "limite_mensual": card.limite_mensual,
                "comision_porcentaje": card.comision_porcentaje,
                "consumo_mensual": monthly_consumed
            })
            
        result.append({
            "id": tit.id,
            "nombre": tit.nombre,
            "tercera_edad": tit.tercera_edad,
            "tarjetas": cards_data
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

# Divisas Purchases (Bitácora de Compras)
@app.get("/api/compras")
def get_compras(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    compras = db.query(CompraDivisa).order_by(CompraDivisa.fecha.desc()).limit(100).all()
    result = []
    for c in compras:
        card = c.tarjeta
        tit = card.titular if card else None
        result.append({
            "id": c.id,
            "fecha": c.fecha.strftime("%d/%m/%Y %I:%M %p"),
            "tarjeta_id": c.tarjeta_id,
            "banco": card.banco if card else "N/A",
            "tipo_tarjeta": card.tipo_tarjeta if card else "N/A",
            "titular": tit.nombre if tit else "N/A",
            "monto_usd": c.monto_usd,
            "tasa_bcv": c.tasa_bcv,
            "comision_ves": c.comision_ves
        })
    return result

@app.post("/api/compras")
def create_compra(req: CompraDivisaCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Tarjeta).filter(Tarjeta.id == req.tarjeta_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
        
    # Check senior citizen exception for the 0.5% bank purchase commission
    tit = card.titular
    commission_pct = 0.005  # 0.5%
    if tit and tit.tercera_edad:
        commission_pct = 0.0
        
    monto_ves = req.monto_usd * req.tasa_bcv
    comision_ves = monto_ves * commission_pct
    
    compra = CompraDivisa(
        tarjeta_id=req.tarjeta_id,
        fecha=get_venezuela_time(),
        monto_usd=req.monto_usd,
        tasa_bcv=req.tasa_bcv,
        comision_ves=comision_ves
    )
    db.add(compra)
    db.commit()
    return {"message": "Compra de divisas registrada en la bitácora", "id": compra.id, "comision_ves": comision_ves}

# Cycles Routes
@app.get("/api/ciclos")
def get_ciclos(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclos = db.query(HistorialCiclos).order_by(HistorialCiclos.fecha.desc()).limit(100).all()
    result = []
    for c in ciclos:
        compras = []
        for cp in c.compras_parciales:
            compras.append({
                "id": cp.id,
                "fecha": cp.fecha.strftime("%d/%m/%Y %I:%M %p"),
                "usd_comprados": cp.usd_comprados,
                "usd_procesados": cp.usd_procesados,
                "tasa_bcv": cp.tasa_bcv,
                "comision_compra_ves": cp.comision_compra_ves,
                "transferencias_ves": cp.transferencias_ves,
                "usd_recibidos_binance": cp.usd_recibidos_binance
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
    ciclo = HistorialCiclos(
        fecha=get_venezuela_time(),
        usdt_vendidos=req.usdt_vendidos,
        tasa_venta=req.tasa_venta,
        banco_venta=req.banco_venta,
        divisas_compradas=req.divisas_compradas,
        tasa_bcv=req.tasa_bcv,
        comision_compra_ves=req.comision_compra_ves,
        transferencias_ves=req.transferencias_ves,
        usd_procesados_binance=req.usd_procesados_binance,
        usd_recibidos_binance=req.usd_recibidos_binance,
        ganancia_usd=req.ganancia_usd,
        ganancia_porcentaje=req.ganancia_porcentaje,
        bolivares_restantes=req.bolivares_restantes,
        status=req.status or "completado",
        bolivares_sobre_restantes=req.bolivares_sobre_restantes or 0.0,
        tarjeta_id=req.tarjeta_id
    )
    db.add(ciclo)
    db.commit()
    return {"message": "Ciclo de arbitraje registrado exitosamente", "id": ciclo.id}

@app.get("/api/ciclos/activos")
def get_ciclos_activos(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclos = db.query(HistorialCiclos).filter(HistorialCiclos.status == "abierto").order_by(HistorialCiclos.fecha.desc()).all()
    result = []
    for c in ciclos:
        compras = []
        for cp in c.compras_parciales:
            compras.append({
                "id": cp.id,
                "fecha": cp.fecha.strftime("%d/%m/%Y %I:%M %p"),
                "usd_comprados": cp.usd_comprados,
                "usd_procesados": cp.usd_procesados,
                "tasa_bcv": cp.tasa_bcv,
                "comision_compra_ves": cp.comision_compra_ves,
                "transferencias_ves": cp.transferencias_ves,
                "usd_recibidos_binance": cp.usd_recibidos_binance
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
        usd_comprados=req.usd_comprados,
        usd_procesados=req.usd_procesados,
        tasa_bcv=req.tasa_bcv,
        comision_compra_ves=req.comision_compra_ves,
        transferencias_ves=req.transferencias_ves,
        usd_recibidos_binance=req.usd_recibidos_binance
    )
    db.add(compra)
    
    costo_ves = req.usd_comprados * req.tasa_bcv
    total_ves_gastado = costo_ves + req.comision_compra_ves + req.transferencias_ves
    
    ciclo.bolivares_sobre_restantes = max(0.0, ciclo.bolivares_sobre_restantes - total_ves_gastado)
    
    ciclo.divisas_compradas += req.usd_comprados
    ciclo.usd_procesados_binance += req.usd_procesados
    ciclo.usd_recibidos_binance += req.usd_recibidos_binance
    ciclo.comision_compra_ves += req.comision_compra_ves
    ciclo.transferencias_ves += req.transferencias_ves
    
    bolivares_gastados_total = (ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta) - ciclo.bolivares_sobre_restantes
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta
    
    ciclo.ganancia_usd = ciclo.usd_recibidos_binance - ustd_cost_of_operation
    ciclo.ganancia_porcentaje = (ciclo.usd_recibidos_binance / ustd_cost_of_operation - 1) * 100 if ustd_cost_of_operation > 0 else 0.0
    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
    
    if ciclo.bolivares_sobre_restantes <= 0.01:
        ciclo.status = "completado"
        
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
        
    bolivares_gastados_total = (ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta) - ciclo.bolivares_sobre_restantes
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta
    
    ciclo.ganancia_usd = ciclo.usd_recibidos_binance - ustd_cost_of_operation
    ciclo.ganancia_porcentaje = (ciclo.usd_recibidos_binance / ustd_cost_of_operation - 1) * 100 if ustd_cost_of_operation > 0 else 0.0
    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
    
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
    
    bolivares_gastados_total = ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta
    
    ciclo.ganancia_usd = ciclo.usd_recibidos_binance - ustd_cost_of_operation
    ciclo.ganancia_porcentaje = (ciclo.usd_recibidos_binance / ustd_cost_of_operation - 1) * 100 if ustd_cost_of_operation > 0 else 0.0
    
    db.commit()
    return {"message": "Ciclo cerrado manualmente", "status": ciclo.status}

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
    
    ciclo.divisas_compradas = max(0.0, ciclo.divisas_compradas - compra.usd_comprados)
    ciclo.usd_procesados_binance = max(0.0, ciclo.usd_procesados_binance - compra.usd_procesados)
    ciclo.usd_recibidos_binance = max(0.0, ciclo.usd_recibidos_binance - compra.usd_recibidos_binance)
    ciclo.comision_compra_ves = max(0.0, ciclo.comision_compra_ves - compra.comision_compra_ves)
    ciclo.transferencias_ves = max(0.0, ciclo.transferencias_ves - compra.transferencias_ves)
    
    bolivares_gastados_total = (ciclo.usdt_vendidos * 0.9975 * ciclo.tasa_venta) - ciclo.bolivares_sobre_restantes
    ustd_cost_of_operation = bolivares_gastados_total / ciclo.tasa_venta
    
    ciclo.ganancia_usd = ciclo.usd_recibidos_binance - ustd_cost_of_operation
    ciclo.ganancia_porcentaje = (ciclo.usd_recibidos_binance / ustd_cost_of_operation - 1) * 100 if ustd_cost_of_operation > 0 else 0.0
    ciclo.bolivares_restantes = ciclo.bolivares_sobre_restantes
    
    if ciclo.bolivares_sobre_restantes > 0.01:
        ciclo.status = "abierto"
        
    db.delete(compra)
    db.commit()
    
    return {"message": "Compra parcial eliminada y saldo de sobre restaurado", "bolivares_sobre_restantes": ciclo.bolivares_sobre_restantes}

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
        res = requests.post(url, json=payload, headers=headers, timeout=10)
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
            raise HTTPException(status_code=res.status_code, detail=f"Binance P2P error: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch P2P rates: {str(e)}")

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

    remesa = HistorialRemesas(
        fecha=get_venezuela_time(),
        cliente_nombre=req.cliente_nombre,
        monto_usd=req.monto_usd,
        tasa_p2p=req.tasa_p2p,
        tasa_cliente=req.tasa_cliente,
        monto_ves=req.monto_ves,
        ganancia_usd=req.ganancia_usd,
        metodo_pago=req.metodo_pago,
        banco_receptor=req.banco_receptor,
        costo_adquisicion_usdt=req.costo_adquisicion_usdt,
        comision_binance=req.comision_binance
    )
    db.add(remesa)
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

    remesa.cliente_nombre = req.cliente_nombre
    remesa.monto_usd = req.monto_usd
    remesa.tasa_p2p = req.tasa_p2p
    remesa.tasa_cliente = req.tasa_cliente
    remesa.monto_ves = req.monto_ves
    remesa.ganancia_usd = req.ganancia_usd
    remesa.metodo_pago = req.metodo_pago
    remesa.banco_receptor = req.banco_receptor
    remesa.costo_adquisicion_usdt = req.costo_adquisicion_usdt
    remesa.comision_binance = req.comision_binance
    
    db.commit()
    return {"message": "Remesa actualizada correctamente."}

@app.delete("/api/remesas/{remesa_id}")
def delete_remesa(remesa_id: int, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    remesa = db.query(HistorialRemesas).filter(HistorialRemesas.id == remesa_id).first()
    if not remesa:
        raise HTTPException(status_code=404, detail="Remesa no encontrada.")
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
                {"plataforma": "Bancamiga (VES)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": True, "comision_simulacion": 0.046}
            ]
            
            for plat in new_platforms:
                existing = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == plat["plataforma"]).first()
                if not existing:
                    db.add(DistribucionCapital(**plat))
                    print(f"Migration: Added platform '{plat['plataforma']}'")
            
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
                    {"nombre": "Solanda", "genero": "Femenino"},
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
                
            db.commit()
            db.close()
            print("Database updates completed successfully.")
    except Exception as e:
        print(f"Error during database initialization: {e}")

# Serve static frontend files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
