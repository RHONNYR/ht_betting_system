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
    personal_pin = Column(String, default="0000")

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
    status = Column(String, default="completado")  # "abierto" or "completado"
    bolivares_sobre_restantes = Column(Float, default=0.0)
    tarjeta_id = Column(Integer, nullable=True)
    
    compras_parciales = relationship("CompraCicloParcial", back_populates="ciclo", cascade="all, delete-orphan")

class CompraCicloParcial(Base):
    __tablename__ = "compras_ciclos_parciales"
    id = Column(Integer, primary_key=True, index=True)
    ciclo_id = Column(Integer, ForeignKey("historial_ciclos.id", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    usd_comprados = Column(Float)
    usd_procesados = Column(Float)
    tasa_bcv = Column(Float)
    comision_compra_ves = Column(Float)
    transferencias_ves = Column(Float)
    usd_recibidos_binance = Column(Float)
    banco = Column(String, nullable=True)
    tarjeta_id = Column(Integer, ForeignKey("tarjetas.id", ondelete="SET NULL"), nullable=True)
    
    ciclo = relationship("HistorialCiclos", back_populates="compras_parciales")
    tarjeta = relationship("Tarjeta")

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

class MovimientoZelle(Base):
    __tablename__ = "movimientos_zelle"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    tipo = Column(String)  # "ingreso" / "egreso"
    monto = Column(Float)
    titular = Column(String, nullable=True)
    detalle = Column(String, nullable=True)
    estado = Column(String, default="completado")  # "completado", "pendiente", "remesado"
    remesa_id = Column(Integer, nullable=True)

class CategoriaPersonal(Base):
    __tablename__ = "personal_categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    tipo = Column(String, nullable=False)  # "gasto" o "ingreso"
    icono = Column(String, default="⚙️")
    editable = Column(Boolean, default=True)

    gastos = relationship("GastoPersonal", back_populates="categoria")
    ingresos = relationship("IngresoPersonal", back_populates="categoria")

class GastoPersonal(Base):
    __tablename__ = "personal_gastos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto = Column(Float, nullable=False)
    moneda = Column(String, default="USD")  # "USD" o "VES"
    tasa_bcv = Column(Float, default=0.0)
    monto_usd = Column(Float, nullable=False)  # Unificado
    categoria_id = Column(Integer, ForeignKey("personal_categorias.id"))
    subcategoria = Column(String, nullable=True)  # Ej: "Movistar - Rhonny", "Google Drive"
    detalles = Column(String, nullable=True)
    plataforma_pago = Column(String, default="Mercantil")  # Bancamiga, Zelle, Provincial, etc.
    deuda_id = Column(Integer, ForeignKey("personal_deudas.id", ondelete="SET NULL"), nullable=True)

    categoria = relationship("CategoriaPersonal", back_populates="gastos")
    deuda = relationship("DeudaPersonal", back_populates="pagos")

class DeudaPersonal(Base):
    __tablename__ = "personal_deudas"
    id = Column(Integer, primary_key=True, index=True)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    acreedor = Column(String, nullable=False)  # Cashea, Banco, Persona
    monto_original_usd = Column(Float, nullable=False)
    saldo_pendiente_usd = Column(Float, nullable=False)
    categoria_compra = Column(String, nullable=True)  # Ej: "Insumos Deportivos"
    detalles = Column(String, nullable=True)
    estado = Column(String, default="activa")  # "activa" o "pagada"

    pagos = relationship("GastoPersonal", back_populates="deuda")

class IngresoPersonal(Base):
    __tablename__ = "personal_ingresos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    monto = Column(Float, nullable=False)
    moneda = Column(String, default="USD")  # "USD" o "VES"
    tasa_bcv = Column(Float, default=0.0)
    monto_usd = Column(Float, nullable=False)
    categoria_id = Column(Integer, ForeignKey("personal_categorias.id"))
    detalles = Column(String, nullable=True)

    categoria = relationship("CategoriaPersonal", back_populates="ingresos")

class PresupuestoPersonal(Base):
    __tablename__ = "personal_presupuestos"
    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("personal_categorias.id"), unique=True)
    limite_semanal_usd = Column(Float, default=0.0)
    limite_mensual_usd = Column(Float, default=0.0)


def init_db():
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE compras_ciclos_parciales ADD COLUMN banco VARCHAR(255);"))
    except Exception as e:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE compras_ciclos_parciales ADD COLUMN tarjeta_id INTEGER;"))
    except Exception as e:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN estado VARCHAR(50) DEFAULT 'completado';"))
    except Exception as e:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE movimientos_zelle ADD COLUMN remesa_id INTEGER;"))
    except Exception as e:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN personal_pin VARCHAR DEFAULT '0000';"))
    except Exception as e:
        pass

    # Populate default personal categories if empty
    db = SessionLocal()
    try:
        if db.query(CategoriaPersonal).count() == 0:
            default_categories = [
                # Gastos
                {"nombre": "Mercado", "tipo": "gasto", "icono": "🛒", "editable": False},
                {"nombre": "Restaurantes", "tipo": "gasto", "icono": "🍔", "editable": False},
                {"nombre": "Esparcimiento Social", "tipo": "gasto", "icono": "🍺", "editable": False},
                {"nombre": "Compartir Deportivo", "tipo": "gasto", "icono": "🤝", "editable": False},
                {"nombre": "Mesada Familiar", "tipo": "gasto", "icono": "👵", "editable": False},
                {"nombre": "Gasolina", "tipo": "gasto", "icono": "⛽", "editable": False},
                {"nombre": "Cobretag (Peajes)", "tipo": "gasto", "icono": "🎫", "editable": False},
                {"nombre": "Mantenimiento Carro", "tipo": "gasto", "icono": "🔧", "editable": False},
                {"nombre": "Internet", "tipo": "gasto", "icono": "🌐", "editable": False},
                {"nombre": "Recargas Celular", "tipo": "gasto", "icono": "📱", "editable": False},
                {"nombre": "Servicios & Suscripciones", "tipo": "gasto", "icono": "🚀", "editable": False},
                {"nombre": "Embellecimiento", "tipo": "gasto", "icono": "✂️", "editable": False},
                {"nombre": "Escuela Béisbol", "tipo": "gasto", "icono": "⚾", "editable": False},
                {"nombre": "Entrenamiento Personalizado", "tipo": "gasto", "icono": "🏃", "editable": False},
                {"nombre": "Arbitrajes", "tipo": "gasto", "icono": "🏁", "editable": False},
                {"nombre": "Insumos Deportivos", "tipo": "gasto", "icono": "👟", "editable": False},
                {"nombre": "Cuidado Diario & Salud", "tipo": "gasto", "icono": "💊", "editable": False},
                {"nombre": "Pago de Deuda", "tipo": "gasto", "icono": "💸", "editable": False},
                # Ingresos
                {"nombre": "Salario PDVSA", "tipo": "ingreso", "icono": "💼", "editable": False},
                {"nombre": "Sueldo Auto-asignado", "tipo": "ingreso", "icono": "💵", "editable": False},
                # Otros / Comodín
                {"nombre": "Otros Gastos / Ingresos", "tipo": "gasto", "icono": "⚙️", "editable": False}
            ]
            for cat_data in default_categories:
                cat = CategoriaPersonal(**cat_data)
                db.add(cat)
            db.commit()
    except Exception as e:
        print(f"Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()

