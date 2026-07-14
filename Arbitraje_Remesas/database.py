from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# Default local SQLite path
LOCAL_DB_PATH = "sqlite:///c:/Users/rhonn/Downloads/ht_betting_system/arbitraje_remesas/database.db"

# DATABASE_URL is set automatically by Render/Railway
DATABASE_URL = os.getenv("DATABASE_URL", LOCAL_DB_PATH)

# Fix for SQLAlchemy which requires postgresql:// instead of postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect to database (SQLite requires check_same_thread)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Titular(Base):
    __tablename__ = "titulares"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    tercera_edad = Column(Boolean, default=False)
    tarjetas = relationship("Tarjeta", back_populates="titular", cascade="all, delete-orphan")

class Tarjeta(Base):
    __tablename__ = "tarjetas"
    id = Column(Integer, primary_key=True, index=True)
    titular_id = Column(Integer, ForeignKey("titulares.id"))
    banco = Column(String)  # BDV, Provincial, Mercantil, etc.
    tipo_tarjeta = Column(String)  # Internacional $, Master Debit, Zinli, etc.
    limite_diario = Column(Float, default=0.0)
    limite_mensual = Column(Float, default=0.0)
    comision_porcentaje = Column(Float, default=0.0)  # e.g., 2.5% -> 0.025
    
    titular = relationship("Titular", back_populates="tarjetas")
    compras = relationship("CompraDivisa", back_populates="tarjeta", cascade="all, delete-orphan")

class CompraDivisa(Base):
    __tablename__ = "compras_divisas"
    id = Column(Integer, primary_key=True, index=True)
    tarjeta_id = Column(Integer, ForeignKey("tarjetas.id"))
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto_usd = Column(Float)
    tasa_bcv = Column(Float)
    comision_ves = Column(Float)
    
    tarjeta = relationship("Tarjeta", back_populates="compras")

class HistorialCiclos(Base):
    __tablename__ = "historial_ciclos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    usdt_vendidos = Column(Float)
    tasa_venta = Column(Float)
    banco_venta = Column(String)
    divisas_compradas = Column(Float)
    tasa_bcv = Column(Float)
    comision_compra_ves = Column(Float)
    transferencias_ves = Column(Float)
    usd_procesados_binance = Column(Float)
    usd_recibidos_binance = Column(Float)
    ganancia_usd = Column(Float)
    ganancia_porcentaje = Column(Float)
    bolivares_restantes = Column(Float)

class DistribucionCapital(Base):
    __tablename__ = "distribucion_capital"
    id = Column(Integer, primary_key=True, index=True)
    plataforma = Column(String, unique=True, index=True)  # Zinli, Binance USDT, Zelle, Cash, Provincial VES, etc.
    saldo_usd = Column(Float, default=0.0)
    saldo_ves = Column(Float, default=0.0)
    convertir_ves = Column(Boolean, default=False)
    # Estimated post-commission percentage deduction for simulation
    comision_simulacion = Column(Float, default=0.0)  # e.g., 0.071 (7.1%)

class HistorialCapitalDiario(Base):
    __tablename__ = "historial_capital_diario"
    id = Column(Integer, primary_key=True, index=True)
    fecha_registro = Column(DateTime, default=datetime.datetime.utcnow)
    total_usd = Column(Float)
    detalle_json = Column(String)  # JSON string representing the snapshot state

class HistorialRemesas(Base):
    __tablename__ = "historial_remesas"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    cliente_nombre = Column(String, default="Cliente")
    monto_usd = Column(Float)
    tasa_p2p = Column(Float)
    tasa_cliente = Column(Float)
    monto_ves = Column(Float)
    ganancia_usd = Column(Float)
    metodo_pago = Column(String)  # Zelle, Zinli, Cash, etc.
    banco_receptor = Column(String)  # Banesco, Pago Móvil, etc.
    costo_adquisicion_usdt = Column(Float)  # e.g., 0.02 (2.0%)
    comision_binance = Column(Float)  # e.g., 0.0035 (0.35%)

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    telefono = Column(String, nullable=True)
    genero = Column(String, default="Masculino")

def init_db():
    Base.metadata.create_all(bind=engine)
