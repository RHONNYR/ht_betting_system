import json
import os
import sys
import datetime
import requests

sys.path.append('.')
from config import settings

def send_telegram_message(token, chat_id, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True
    }
    try:
        r = requests.post(url, json=payload, timeout=15)
        if r.status_code == 200:
            return True
        else:
            print(f"[Telegram] Error al enviar mensaje (HTTP {r.status_code}): {r.text}")
            return False
    except Exception as e:
        print(f"[Telegram] Excepción al enviar mensaje: {e}")
        return False

def run_telegram_notifications():
    # 1. Resolve Bot Token and Chat ID
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or getattr(settings, 'TELEGRAM_CHAT_ID', '').strip()
    
    # Redact print for security
    token_display = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else "No configurado"
    print(f"[Telegram Notifier] Inicializando... Chat ID: {chat_id} | Token: {token_display}")
    
    if not token or not chat_id or token == "TU_BOT_TOKEN_AQUI" or chat_id == "TU_CHAT_ID_AQUI":
        print("[Telegram Notifier] Advertencia: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados. Saltando alertas.")
        return
        
    history_file = os.path.join('data', 'picks', 'picks_history.json')
    if not os.path.exists(history_file):
        print(f"[Telegram Notifier] No existe el historial en {history_file}. Saltando.")
        return
        
    with open(history_file, 'r', encoding='utf-8') as f:
        picks = json.load(f)
        
    state_file = os.path.join('data', 'picks', 'telegram_sent_state.json')
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                state = json.load(f)
        except Exception:
            state = {"sent_upcoming": [], "sent_resolved": []}
    else:
        state = {"sent_upcoming": [], "sent_resolved": []}
        
    if "sent_upcoming" not in state:
        state["sent_upcoming"] = []
    if "sent_resolved" not in state:
        state["sent_resolved"] = []
        
    updated_state = False
    
    # 2. Process Upcoming Picks
    print("[Telegram Notifier] Procesando nuevos picks por enviar...")
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
            
        # A pick is upcoming if it's pending/active and hasn't been sent
        res_bet = p.get('resultado_apuesta')
        is_pending = res_bet is None or res_bet == 'PENDIENTE' or res_bet == ''
        
        if is_pending and str(match_id) not in state["sent_upcoming"]:
            # Format kickoff time from UTC to VET (UTC-4)
            date_str = p.get('fecha')
            time_str = p.get('hora')
            
            fecha_vet = date_str
            hora_vet = time_str
            
            try:
                dt_utc = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                dt_vet = dt_utc - datetime.timedelta(hours=4)
                fecha_vet = dt_vet.strftime("%Y-%m-%d")
                hora_vet = dt_vet.strftime("%H:%M")
            except Exception:
                pass # Fallback to original
                
            tier = int(p.get('tier', 3))
            tier_names = {1: "Tier 1 (Alta Liquidez)", 2: "Tier 2 (Media Liquidez)", 3: "Tier 3 (Exótica)"}
            tier_name = tier_names.get(tier, f"Tier {tier}")
            
            # Suggest dynamic stakes
            if tier == 1:
                stake_pct = "2.0%"
                stake_usd = 20.0
            elif tier == 2:
                stake_pct = "1.0%"
                stake_usd = 10.0
            else:
                stake_pct = "0.5%"
                stake_usd = 5.0
                
            # Formulate HTML message
            msg = (
                f"🆕 <b>NUEVO PICK DETECTADO (HT Over 0.5)</b>\n\n"
                f"🏆 <b>Liga:</b> {p.get('liga')} (<i>{tier_name}</i>)\n"
                f"🆚 <b>Partido:</b> {p.get('local')} vs {p.get('visitante')}\n"
                f"📅 <b>Fecha:</b> {fecha_vet} (VET)\n"
                f"⏰ <b>Hora:</b> {hora_vet} (VET)\n"
                f"📈 <b>Clase:</b> {p.get('clase')} (Prob: {p.get('probabilidad')})\n"
                f"📊 <b>Sustento:</b> {p.get('sustento')}\n"
                f"💵 <b>Cuota Recomendada:</b> {p.get('cuota_recomendada')} ({p.get('bookmaker_recomendado')})\n\n"
                f"⚖️ <b>Stake Sugerido:</b> {stake_pct} de la banca (Ref: ${stake_usd:.2f})\n"
            )
            
            print(f"   -> Enviando alerta de pick para: {p.get('local')} vs {p.get('visitante')}")
            success = send_telegram_message(token, chat_id, msg)
            if success:
                state["sent_upcoming"].append(str(match_id))
                updated_state = True
                
    # 3. Process Resolved Picks
    print("[Telegram Notifier] Procesando resultados de partidos recientes...")
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
            
        res_bet = p.get('resultado_apuesta')
        if res_bet in ['GANADA', 'PERDIDA', 'CANCELADO'] and str(match_id) not in state["sent_resolved"]:
            # Format kickoff time from UTC to VET (UTC-4)
            date_str = p.get('fecha')
            time_str = p.get('hora')
            
            fecha_vet = date_str
            hora_vet = time_str
            
            try:
                dt_utc = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                dt_vet = dt_utc - datetime.timedelta(hours=4)
                fecha_vet = dt_vet.strftime("%Y-%m-%d")
                hora_vet = dt_vet.strftime("%H:%M")
            except Exception:
                pass
                
            tier = int(p.get('tier', 3))
            
            # Dynamic stakes reference
            if tier == 1:
                stake_usd = 20.0
            elif tier == 2:
                stake_usd = 10.0
            else:
                stake_usd = 5.0
                
            odds = p.get('cuota_recomendada')
            odds_val = float(odds) if odds is not None else 1.45
            
            # Calculate financial result for telegram report
            if res_bet == 'GANADA':
                status_icon = "✅"
                profit = stake_usd * (odds_val - 1.0)
                profit_str = f"<b>+${profit:.2f}</b>"
            elif res_bet == 'PERDIDA':
                status_icon = "❌"
                profit_str = f"<b>-${stake_usd:.2f}</b>"
            else:
                status_icon = "🟡"
                profit_str = "<b>$0.00 (Reembolso)</b>"
                
            msg = (
                f"🏁 <b>RESULTADO DE PICK HT OVER 0.5</b>\n\n"
                f"🆚 <b>Partido:</b> {p.get('local')} vs {p.get('visitante')}\n"
                f"🏆 <b>Liga:</b> {p.get('liga')}\n"
                f"📅 <b>Fecha:</b> {fecha_vet} {hora_vet} (VET)\n"
                f"📊 <b>Clase:</b> {p.get('clase')} (Tier {tier})\n"
                f"⏱️ <b>Marcador HT:</b> {p.get('marcador_ht') or 'N/A'}\n\n"
                f"✨ <b>Resultado:</b> {status_icon} <b>{res_bet}</b>\n"
                f"💰 <b>Cuota:</b> {odds_val:.2f}\n"
                f"💵 <b>Balance:</b> {profit_str} (Stake: ${stake_usd:.2f})\n"
            )
            
            print(f"   -> Enviando alerta de resultado para: {p.get('local')} vs {p.get('visitante')} ({res_bet})")
            success = send_telegram_message(token, chat_id, msg)
            if success:
                state["sent_resolved"].append(str(match_id))
                updated_state = True
                
    # 4. Save updated state if changes occurred
    if updated_state:
        os.makedirs(os.path.dirname(state_file), exist_ok=True)
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        print("[Telegram Notifier] Estado guardado correctamente en telegram_sent_state.json.")
        
        # Sincronizar telegram_sent_state.json a GitHub para mantener consistencia
        if getattr(settings, 'GITHUB_ENABLED', False) and os.environ.get("GITHUB_ACTIONS") != "true":
            print("[Telegram Notifier] Sincronizando estado con GitHub...")
            try:
                upload_file_to_github(state_file, 'data/picks/telegram_sent_state.json')
            except Exception as e:
                print(f"[Telegram Notifier] Error al subir estado a GitHub: {e}")
                
if __name__ == "__main__":
    run_telegram_notifications()
