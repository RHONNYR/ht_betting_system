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

from database import SessionLocal, User, Titular, Tarjeta, CompraDivisa, HistorialCiclos, DistribucionCapital, HistorialCapitalDiario

# JWT configuration
SECRET_KEY = "rhonny_arbitraje_secret_key_super_secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

security = HTTPBearer()

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

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# Helpers
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

def scrape_bcv_rate():
    # Method 1: Scraping official website
    try:
        url = "http://www.bcv.org.ve/"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            # The USD rate is inside a div with id 'dolar'
            div_dolar = soup.find("div", {"id": "dolar"})
            if div_dolar:
                strong_val = div_dolar.find("strong")
                if strong_val:
                    rate_str = strong_val.text.strip().replace(",", ".")
                    rate = float(rate_str)
                    if rate > 0:
                        bcv_state.cached_rate = rate
                        bcv_state.last_fetch = datetime.datetime.now()
                        return rate
    except Exception as e:
        print(f"BCV Scraping failed: {e}")

    # Method 2: Public API Fallback (pyDolarVenezuela backend or similar)
    try:
        url = "https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            # Depending on API structure
            monitors = data.get("monitors", {})
            bcv_data = monitors.get("bcv", {}) or monitors.get("usd", {})
            rate_val = bcv_data.get("price") or data.get("price")
            if rate_val:
                rate = float(rate_val)
                bcv_state.cached_rate = rate
                bcv_state.last_fetch = datetime.datetime.now()
                return rate
    except Exception as e:
        print(f"BCV Fallback API failed: {e}")
        
    return bcv_state.cached_rate

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
    if bcv_state.manual_rate:
        return {"rate": bcv_state.manual_rate, "source": "Manual"}
    
    # Auto scrape/fetch
    rate = scrape_bcv_rate()
    return {"rate": rate, "source": "BCV Oficial"}

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
        fecha_registro=datetime.datetime.now(),
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

# Titulares & Cards Routes
@app.get("/api/titulares")
def get_titulares(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    titulares = db.query(Titular).all()
    
    # Calculate monthly consumption per card
    now = datetime.datetime.now()
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
        fecha=datetime.datetime.now(),
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
            "bolivares_restantes": c.bolivares_restantes
        })
    return result

@app.post("/api/ciclos")
def create_ciclo(req: CicloCreate, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    ciclo = HistorialCiclos(
        fecha=datetime.datetime.now(),
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
        bolivares_restantes=req.bolivares_restantes
    )
    db.add(ciclo)
    db.commit()
    return {"message": "Ciclo de arbitraje registrado exitosamente", "id": ciclo.id}

# Serve static frontend files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
