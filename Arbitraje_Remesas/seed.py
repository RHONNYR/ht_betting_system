from database import init_db, SessionLocal, User, Titular, Tarjeta, DistribucionCapital
import bcrypt

def seed_data():
    init_db()
    db = SessionLocal()
    
    # Check if user already exists
    if db.query(User).filter(User.username == "rhonnyr").first() is None:
        # Hash password directly using bcrypt
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw("Farc0705*".encode('utf-8'), salt).decode('utf-8')
        user = User(username="rhonnyr", password_hash=hashed_password)
        db.add(user)
        print("User 'rhonnyr' created.")
    
    # Seed default platforms for capital
    default_platforms = [
        {"plataforma": "Binance (USDT)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.0025},
        {"plataforma": "Zinli", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.04},
        {"plataforma": "Zelle", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.0},
        {"plataforma": "Efectivo USD", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.0},
        {"plataforma": "Banco de Venezuela (VES)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": True, "comision_simulacion": 0.071},
        {"plataforma": "Banco Provincial (VES)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": True, "comision_simulacion": 0.046},
        {"plataforma": "Banco Mercantil (VES)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": True, "comision_simulacion": 0.046},
        {"plataforma": "Banco de Venezuela (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.066},
        {"plataforma": "Banco Provincial (USD)", "saldo_usd": 0.0, "saldo_ves": 0.0, "convertir_ves": False, "comision_simulacion": 0.041}
    ]
    
    for plat in default_platforms:
        if db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == plat["plataforma"]).first() is None:
            new_plat = DistribucionCapital(**plat)
            db.add(new_plat)
            print(f"Platform '{plat['plataforma']}' added.")
            
    # Seed default Titulares and Cards
    default_titulares = [
        {
            "nombre": "Rhonny",
            "tercera_edad": False,
            "tarjetas": [
                {"banco": "BDV", "tipo_tarjeta": "Internacional $", "limite_diario": 2000.0, "limite_mensual": 10000.0, "comision_porcentaje": 0.025},
                {"banco": "BDV", "tipo_tarjeta": "Master Debit", "limite_diario": 1000.0, "limite_mensual": 5000.0, "comision_porcentaje": 0.015},
                {"banco": "Provincial", "tipo_tarjeta": "Master Debit", "limite_diario": 2000.0, "limite_mensual": 20000.0, "comision_porcentaje": 0.0}
            ]
        },
        {
            "nombre": "Solanda",
            "tercera_edad": True,
            "tarjetas": [
                {"banco": "BDV", "tipo_tarjeta": "Internacional $", "limite_diario": 2000.0, "limite_mensual": 10000.0, "comision_porcentaje": 0.025},
                {"banco": "BDV", "tipo_tarjeta": "Master Debit", "limite_diario": 1000.0, "limite_mensual": 5000.0, "comision_porcentaje": 0.015},
                {"banco": "Provincial", "tipo_tarjeta": "Master Debit", "limite_diario": 2000.0, "limite_mensual": 20000.0, "comision_porcentaje": 0.0}
            ]
        },
        {
            "nombre": "Aristides",
            "tercera_edad": True,
            "tarjetas": [
                {"banco": "BDV", "tipo_tarjeta": "Internacional $", "limite_diario": 2000.0, "limite_mensual": 10000.0, "comision_porcentaje": 0.025},
                {"banco": "BDV", "tipo_tarjeta": "Master Debit", "limite_diario": 1000.0, "limite_mensual": 5000.0, "comision_porcentaje": 0.015},
                {"banco": "Provincial", "tipo_tarjeta": "Master Debit", "limite_diario": 2000.0, "limite_mensual": 20000.0, "comision_porcentaje": 0.0}
            ]
        }
    ]
    
    for tit_data in default_titulares:
        existing_tit = db.query(Titular).filter(Titular.nombre == tit_data["nombre"]).first()
        if existing_tit is None:
            tit = Titular(nombre=tit_data["nombre"], tercera_edad=tit_data["tercera_edad"])
            db.add(tit)
            db.commit()
            print(f"Titular '{tit.nombre}' created.")
            
            for card_data in tit_data["tarjetas"]:
                card = Tarjeta(titular_id=tit.id, **card_data)
                db.add(card)
                print(f"  Card {card.banco} ({card.tipo_tarjeta}) added for {tit.nombre}.")
        else:
            print(f"Titular '{tit_data['nombre']}' already exists.")
            
    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
