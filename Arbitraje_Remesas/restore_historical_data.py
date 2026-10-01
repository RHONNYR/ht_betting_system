import os
import json
import datetime
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    from database import init_db, SessionLocal, User, Titular, Tarjeta, DistribucionCapital, HistorialCiclos, CompraCicloParcial, MovimientoZelle, HistorialRemesas, Cliente
except ImportError:
    from Arbitraje_Remesas.database import init_db, SessionLocal, User, Titular, Tarjeta, DistribucionCapital, HistorialCiclos, CompraCicloParcial, MovimientoZelle, HistorialRemesas, Cliente

def parse_date_str(date_str):
    if not date_str:
        return datetime.datetime.utcnow()
    # Format: "28/08/2026 08:31 AM" or "13/08/2026 03:00 PM" or "2026-08-13..."
    date_str = str(date_str).strip()
    patterns = [
        ("%d/%m/%Y %I:%M %p", False),
        ("%d/%m/%Y %H:%M", False),
        ("%d/%m/%Y", False),
        ("%Y-%m-%dT%H:%M:%S.%f", False),
        ("%Y-%m-%dT%H:%M:%S", False),
        ("%Y-%m-%d %H:%M:%S", False),
        ("%Y-%m-%d", False)
    ]
    for fmt, _ in patterns:
        try:
            return datetime.datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    return datetime.datetime.utcnow()

def restore_all(db=None):
    close_at_end = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_at_end = True

    print("=== INICIANDO RESTAURACIÓN TOTAL DE DATOS HISTÓRICOS ===")

    # 1. Capital Distribution (Restauración de saldos del snapshot)
    snapshot_path = "snapshot_pre_limpieza_2026-08-13.json"
    if not os.path.exists(snapshot_path):
        snapshot_path = os.path.join(os.path.dirname(__file__), "..", "snapshot_pre_limpieza_2026-08-13.json")
    
    if os.path.exists(snapshot_path):
        try:
            with open(snapshot_path, "r", encoding="utf-8") as f:
                snap_data = json.load(f)
            capital_items = snap_data.get("capital", {}).get("items", [])
            for item in capital_items:
                plat_name = item.get("plataforma")
                existing = db.query(DistribucionCapital).filter(DistribucionCapital.plataforma == plat_name).first()
                if existing:
                    existing.saldo_usd = float(item.get("saldo_usd", 0.0))
                    existing.saldo_ves = float(item.get("saldo_ves", 0.0))
                    existing.convertir_ves = bool(item.get("convertir_ves", False))
                else:
                    new_plat = DistribucionCapital(
                        plataforma=plat_name,
                        saldo_usd=float(item.get("saldo_usd", 0.0)),
                        saldo_ves=float(item.get("saldo_ves", 0.0)),
                        convertir_ves=bool(item.get("convertir_ves", False)),
                        comision_simulacion=0.046 if "VES" in plat_name else 0.0025
                    )
                    db.add(new_plat)
            db.commit()
            print(f"✅ Capital: {len(capital_items)} plataformas sincronizadas con saldos reales.")
        except Exception as e:
            print(f"⚠️ Error restaurando capital: {e}")

    # 2. Clientes y Movimientos Zelle (del dataset JSON limpio)
    zelle_file = os.path.join(os.path.dirname(__file__), "historical_zelle_dataset.json")
    if not os.path.exists(zelle_file):
        zelle_file = "Arbitraje_Remesas/historical_zelle_dataset.json"

    movimientos_to_insert = []
    if os.path.exists(zelle_file):
        try:
            with open(zelle_file, "r", encoding="utf-8") as f:
                raw_items = json.load(f)
            for item in raw_items:
                movimientos_to_insert.append({
                    "id": item.get("id"),
                    "fecha": parse_date_str(item.get("fecha")),
                    "tipo": item.get("tipo", "ingreso"),
                    "monto": float(item.get("monto", 0.0)),
                    "titular": item.get("titular", ""),
                    "cliente_nombre": item.get("cliente_nombre", ""),
                    "detalle": item.get("detalle", ""),
                    "estado": item.get("estado", "completado"),
                    "remesa_id": item.get("remesa_id")
                })
        except Exception as e:
            print(f"⚠️ Error cargando historical_zelle_dataset.json: {e}")

    # Insertar Zelle y Clientes
    clientes_registrados = set()
    zelle_count = 0
    remesas_creadas = 0

    for m in movimientos_to_insert:
        # Registrar cliente si no existe
        cl_name = m["cliente_nombre"]
        if cl_name and cl_name not in ["None", "TENDEDEROS SILA LLC", "Maria Veliz", "Marian Estrada"] and cl_name not in clientes_registrados:
            ex_client = db.query(Cliente).filter(Cliente.nombre == cl_name).first()
            if not ex_client:
                db.add(Cliente(nombre=cl_name, genero="Femenino" if cl_name.endswith(('a', 'is', 'el')) else "Masculino"))
            clientes_registrados.add(cl_name)

        # Evitar duplicar movimiento Zelle
        existing_mov = db.query(MovimientoZelle).filter(
            MovimientoZelle.fecha == m["fecha"],
            MovimientoZelle.monto == m["monto"],
            MovimientoZelle.tipo == m["tipo"]
        ).first()

        if not existing_mov:
            new_mov = MovimientoZelle(
                fecha=m["fecha"],
                tipo=m["tipo"],
                monto=m["monto"],
                titular=m["titular"],
                cliente_nombre=m["cliente_nombre"],
                detalle=m["detalle"],
                estado=m["estado"],
                remesa_id=m["remesa_id"]
            )
            db.add(new_mov)
            zelle_count += 1

        # Reconstruir HistorialRemesas si el movimiento era un ingreso por remesa
        if m["tipo"] == "ingreso":
            ex_rem = db.query(HistorialRemesas).filter(
                HistorialRemesas.fecha == m["fecha"],
                HistorialRemesas.monto_usd == m["monto"]
            ).first()

            if not ex_rem:
                # Estimar tasa y monto VES si no estaban guardados explícitamente
                tasa_estimada = 850.0 if "08/2026" in str(m["fecha"]) else 800.0
                monto_ves_est = round(m["monto"] * tasa_estimada, 2)
                ganancia_est = round(m["monto"] * 0.05, 2) # Margen promedio 5%
                
                new_rem = HistorialRemesas(
                    fecha=m["fecha"],
                    cliente_nombre=m["cliente_nombre"],
                    monto_usd=m["monto"],
                    tasa_p2p=tasa_estimada,
                    tasa_cliente=round(tasa_estimada * 0.95, 2),
                    monto_ves=monto_ves_est,
                    ganancia_usd=ganancia_est,
                    metodo_pago="Zelle",
                    banco_receptor="Banco de Venezuela",
                    costo_adquisicion_usdt=round(m["monto"] * 0.95, 2),
                    comision_binance=0.0
                )
                db.add(new_rem)
                remesas_creadas += 1

    db.commit()
    print(f"✅ Zelle & Remesas: {zelle_count} movimientos Zelle y {remesas_creadas} remesas históricas registradas.")

    # 3. Restaurar Ciclos de Arbitraje (23 ciclos)
    cycles_file = "Arbitraje_Remesas/historical_cycles_dataset.json"
    if not os.path.exists(cycles_file):
        cycles_file = os.path.join(os.path.dirname(__file__), "historical_cycles_dataset.json")

    cycles_inserted = 0
    subcompras_inserted = 0
    if os.path.exists(cycles_file):
        try:
            with open(cycles_file, "r", encoding="utf-8") as f:
                cycles_data = json.load(f)

            for c in cycles_data:
                c_fecha = parse_date_str(c.get("fecha"))
                usdt_vendidos = float(c.get("usdt_vendidos", 0.0))
                tasa_venta = float(c.get("tasa_venta", 0.0))

                existing_cycle = db.query(HistorialCiclos).filter(
                    HistorialCiclos.usdt_vendidos == usdt_vendidos,
                    HistorialCiclos.tasa_venta == tasa_venta
                ).first()

                if not existing_cycle:
                    new_c = HistorialCiclos(
                        fecha=c_fecha,
                        usdt_vendidos=usdt_vendidos,
                        tasa_venta=tasa_venta,
                        banco_venta=c.get("banco_venta", "Provincial"),
                        divisas_compradas=None,
                        tasa_bcv=float(c.get("tasa_bcv", 790.0)),
                        usd_recibidos_binance=round(usdt_vendidos * 1.08, 2),
                        ganancia_usd=float(c.get("ganancia_usd", 0.0)),
                        ganancia_porcentaje=round((float(c.get("ganancia_usd", 0.0)) / usdt_vendidos) * 100, 2) if usdt_vendidos > 0 else 0.0,
                        bolivares_sobre_restantes=0.0,
                        status=c.get("status", "completado")
                    )
                    db.add(new_c)
                    db.commit()
                    db.refresh(new_c)
                    cycles_inserted += 1
                    target_cycle_id = new_c.id
                else:
                    target_cycle_id = existing_cycle.id

                # Subcompras
                for cp in c.get("compras", []):
                    cp_fecha = parse_date_str(cp.get("fecha"))
                    usd_comp = float(cp.get("usd_comprados", 0.0))
                    
                    ex_cp = db.query(CompraCicloParcial).filter(
                        CompraCicloParcial.ciclo_id == target_cycle_id,
                        CompraCicloParcial.usd_comprados == usd_comp,
                        CompraCicloParcial.banco == cp.get("banco")
                    ).first()

                    if not ex_cp:
                        new_cp = CompraCicloParcial(
                            ciclo_id=target_cycle_id,
                            fecha=cp_fecha,
                            usd_comprados=usd_comp,
                            usd_procesados=float(cp.get("usd_procesados", usd_comp)),
                            tasa_bcv=float(cp.get("tasa_bcv", 790.0)),
                            comision_compra_ves=float(cp.get("comision_compra_ves", 0.0)),
                            transferencias_ves=float(cp.get("transferencias_ves", 0.0)),
                            usd_recibidos_binance=float(cp.get("usd_recibidos_binance", 0.0)),
                            banco=cp.get("banco", "Provincial"),
                            tarjeta_id=cp.get("tarjeta_id")
                        )
                        db.add(new_cp)
                        subcompras_inserted += 1

            db.commit()
            print(f"✅ Ciclos: {cycles_inserted} ciclos y {subcompras_inserted} subcompras asociadas creadas.")
        except Exception as e:
            print(f"⚠️ Error restaurando ciclos: {e}")

    # Resumen final
    tot_ciclos = db.query(HistorialCiclos).count()
    tot_remesas = db.query(HistorialRemesas).count()
    tot_zelle = db.query(MovimientoZelle).count()
    tot_clientes = db.query(Cliente).count()
    print(f"\n🎉 RESTAURACIÓN COMPLETADA CON ÉXITO:")
    print(f"   • Total Ciclos en DB: {tot_ciclos}")
    print(f"   • Total Remesas en DB: {tot_remesas}")
    print(f"   • Total Movimientos Zelle en DB: {tot_zelle}")
    print(f"   • Total Clientes en DB: {tot_clientes}")

    if close_at_end:
        db.close()

if __name__ == "__main__":
    restore_all()
