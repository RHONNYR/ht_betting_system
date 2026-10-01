# PUNTO DE REFERENCIA OPERATIVO Y CHECKPOINT DEL SISTEMA (GOLDEN BASELINE)

> **Fecha de fijación:** 01 de Octubre de 2026
> **Versión de la Aplicación:** v183
> **Entorno de Producción:** https://arbitraje-rhonny-99.onrender.com
> **Repositorio:** RHONNYR/ht_betting_system (branch main)

---

## 📌 1. Estado Dorado de Operaciones (Golden State)

Este documento actúa como la **memoria histórica oficial y permanente** del sistema.
Contiene **toda la data histórica recuperada y consolidada desde julio hasta finales de septiembre de 2026** (incluyendo el chat exportado de Telegram con los 98 movimientos de agosto y septiembre):

### 💵 Plataforma Zelle
- **Saldo Actual:** **$64.70 USD**
- **Último Movimiento Registrado (Telegram):**
  - **Fecha:** 29/09/2026 03:48 PM
  - **Tipo:** ingreso
  - **Monto:** +.00 USD
  - **Cliente:** Génesis Salazar
  - **Titular:** Génesis Salazar
  - **Detalle:** Registrado vía Bot de Telegram (+60.00 Génesis Salazar)
  - **Estado:** pendiente
- **Total de Movimientos Zelle en BD:** **171 transacciones**
  - Julio 2026: 30 transacciones
  - Agosto 2026: 74 transacciones
  - Septiembre 2026: 66 transacciones
  - Julio 2025: 1 transacción

### 📊 Historial y Módulos Activos
- **Ciclos de Arbitraje:** 23 ciclos históricos completos con sus subcompras parciales asociadas.
- **Historial de Remesas:** **153 remesas** registradas en la base de datos:
  - Julio 2026: 28 remesas (,297.18 USD)
  - Agosto 2026: 69 remesas (,800.17 USD)
  - Septiembre 2026: 55 remesas (,739.00 USD)
  - Julio 2025: 1 remesa (.00 USD)
- **Agenda de Clientes:** **42 clientes** registrados y normalizados en la base de datos.

---

## 🛡️ 2. Reglas de Salvaguarda Inquebrantables

1. **PROHIBIDO restaurar el snapshot del 13 de agosto (snapshot_pre_limpieza_2026-08-13.json) en saldos operativos:**
   - Dicho snapshot tenía un saldo de ,554.98 en Zelle que ya no corresponde a la realidad operativa del usuario.
   - El dataset maestro completo es Arbitraje_Remesas/historical_zelle_dataset.json con 171 movimientos y saldo base de .70.
2. **Protección en main.py (Migración Paso 8 y 9):**
   - El arranque del backend verifica activamente que existan al menos 160 movimientos y que el saldo de Zelle sea exactamente .70.
3. **Diseño y Responsividad:**
   - La ventana modal de edición/creación de remesas y ciclos debe mantener **siempre**:
     - max-height: 90vh con overflow-y: auto.
     - Cabecera fija con botón de cierre (✕) siempre visible y accesible.
     - Botones inferiores siempre visibles sin quedar ocultos fuera de la pantalla.
     - Compatibilidad con pantallas de laptops (1366x768, 1440x900) y móviles.
   - Tema visual limpio (Light Modern UI) sin alterar los datos del backend.
