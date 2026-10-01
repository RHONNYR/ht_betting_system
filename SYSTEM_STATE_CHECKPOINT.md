# PUNTO DE REFERENCIA OPERATIVO Y CHECKPOINT DEL SISTEMA (GOLDEN BASELINE)

> **Fecha de fijación:** 01 de Octubre de 2026
> **Versión de la Aplicación:** v182
> **Entorno de Producción:** https://arbitraje-rhonny-99.onrender.com
> **Repositorio:** RHONNYR/ht_betting_system (branch main)

---

## 📌 1. Estado Dorado de Operaciones (Golden State)

Este documento actúa como la **memoria histórica oficial y permanente** del sistema. Ante cualquier actualización, refactorización o cambio de diseño, el sistema **NUNCA** debe regresar a saldos anteriores a este punto:

### 💵 Plataforma Zelle
- **Saldo Actual:** **$64.70 USD**
- **Último Movimiento Registrado (en vivo vía Telegram Bot):**
  - **Fecha:** 30/09/2026 09:30 PM
  - **Tipo:** ingreso
  - **Monto:** +.00 USD
  - **Cliente:** Génesis Salazar
  - **Titular:** Génesis Salazar
  - **Detalle:** Registrado vía Bot de Telegram
  - **Estado:** pendiente (listo para remesar)
- **Total de Movimientos Zelle en BD:** 79 transacciones

### 📊 Historial y Módulos Activos
- **Ciclos de Arbitraje:** 23 ciclos históricos completos con sus subcompras parciales asociadas.
- **Historial de Remesas:** 73 remesas registradas en la base de datos.
- **Agenda de Clientes:** 25 clientes registrados y unificados.

---

## 🛡️ 2. Reglas de Salvaguarda Inquebrantables

1. **PROHIBIDO restaurar el snapshot del 13 de agosto (snapshot_pre_limpieza_2026-08-13.json) en saldos operativos:**
   - Dicho snapshot tenía un saldo de ,554.98 en Zelle que ya no corresponde a la realidad operativa del usuario.
   - Si se requiere una recarga de datos en frío, Zelle debe inicializarse en .70 y preservar la transacción de Génesis Salazar.
2. **Protección en main.py (Migración Paso 9):**
   - El arranque del backend verifica y garantiza activamente que el saldo de Zelle sea .70 y que el ingreso de Génesis Salazar exista.
3. **Diseño y Responsividad:**
   - La ventana modal de edición/creación de remesas y ciclos debe mantener **siempre**:
     - max-height: 90vh con overflow-y: auto.
     - Cabecera fija con botón de cierre (✕) siempre visible y accesible.
     - Botones inferiores siempre visibles sin quedar ocultos fuera de la pantalla.
     - Compatibilidad con pantallas de laptops (1366x768, 1440x900) y móviles.
   - Tema visual limpio (Light Modern UI) sin alterar los datos del backend.
