import json
import os
import sys
import datetime
import base64
import requests

sys.path.append('.')
from config import settings
from src.scanner.visual_generator import generate_pick_infographic

def upload_file_to_github(local_file_path, repo_file_path):
    token = getattr(settings, 'GITHUB_TOKEN', '').strip()
    owner = getattr(settings, 'GITHUB_REPO_OWNER', '').strip()
    repo = getattr(settings, 'GITHUB_REPO_NAME', '').strip()
    enabled = getattr(settings, 'GITHUB_ENABLED', False)
    
    if not enabled or not token or not owner or not repo:
        return False
        
    if not os.path.exists(local_file_path):
        return False
        
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{repo_file_path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    sha = None
    try:
        r_get = requests.get(url, headers=headers, timeout=15)
        if r_get.status_code == 200:
            sha = r_get.json().get("sha")
    except Exception:
        pass
        
    try:
        with open(local_file_path, "rb") as f:
            content_bytes = f.read()
        content_base64 = base64.b64encode(content_bytes).decode("utf-8")
    except Exception:
        return False
        
    payload = {
        "message": f"Actualización de estado de Telegram ({repo_file_path})",
        "content": content_base64
    }
    if sha:
        payload["sha"] = sha
        
    try:
        r_put = requests.put(url, headers=headers, json=payload, timeout=20)
        return r_put.status_code in [200, 201]
    except Exception:
        return False

def send_telegram_photo(token, chat_id, photo_path, caption):
    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    try:
        with open(photo_path, 'rb') as f:
            files = {'photo': f}
            data = {
                'chat_id': chat_id,
                'caption': caption,
                'parse_mode': 'HTML'
            }
            r = requests.post(url, data=data, files=files, timeout=20)
            if r.status_code == 200:
                return True
            else:
                print(f"[Telegram] Error al enviar foto (HTTP {r.status_code}): {r.text}")
                return False
    except Exception as e:
        print(f"[Telegram] Excepción al enviar foto: {e}")
        return False

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

def check_and_send_recess_reminder(token, chat_id, state):
    """
    Checks if the current date is in June, July, or August and if the recess reminder
    for the current year has already been sent. If not, sends a calendar reminder
    about the upcoming winter league starts.
    """
    now = datetime.datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Only run in June, July or August
    if current_month not in [6, 7, 8]:
        return False
        
    sent_year = state.get("sent_recess_reminder_year")
    if sent_year == current_year:
        return False
        
    print(f"[Telegram Notifier] Enviando recordatorio estacional de reinicio de ligas para el año {current_year}...")
    
    msg = (
        f"📢 <b>CALENDARIO DE REINICIO DE LIGAS (TEMPORADA {current_year}/{current_year+1})</b>\n\n"
        f"El sistema cuantitativo ha identificado las siguientes ligas europeas principales que se encuentran en receso de verano y sus fechas estimadas de inicio:\n\n"
        f"🇬🇧 <b>Premier League (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🇪🇸 <b>La Liga (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🇩🇪 <b>Bundesliga (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🇵🇹 <b>Primeira Liga (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🇬🇧 <b>Championship (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🇳🇱 <b>Eredivisie (Tier 1)</b> - Reinicio: Agosto {current_year}\n"
        f"🏴 <b>Premiership Escocia (Tier 2)</b> - Reinicio: Agosto {current_year}\n"
        f"🇨🇭 <b>Super League Suiza (Tier 2)</b> - Reinicio: Agosto {current_year}\n\n"
        f"<i>El sistema activará automáticamente el escaneo de cuotas y el radar de equipos candidatos tan pronto como comiencen los primeros partidos oficiales de pretemporada y liga en Agosto.</i>"
    )
    
    success = send_telegram_message(token, chat_id, msg)
    if success:
        state["sent_recess_reminder_year"] = current_year
        return True
    return False

def get_league_status(league_name, league_id, leagues, recent_rates, picks_history):
    l = None
    target_id = None
    try:
        target_id = int(league_id) if league_id is not None else None
    except Exception:
        pass
        
    for x in leagues:
        if (target_id is not None and x.get('league_id') == target_id) or x.get('league_name') == league_name:
            l = x
            break
            
    if not l:
        return 'yellow', 'Neutral', '🟡'
        
    has_picks = False
    for p in picks_history:
        p_liga = p.get('liga')
        p_league_id = p.get('league_id')
        p_target_id = None
        try:
            p_target_id = int(p_league_id) if p_league_id is not None else None
        except Exception:
            pass
            
        if (target_id is not None and p_target_id == target_id) or p_liga == league_name:
            has_picks = True
            break
            
    if not has_picks:
        return 'yellow', 'Neutral', '🟡'
        
    is_approved = l.get('Estado') == 'APROBADA'
    recent_wr = recent_rates.get(l.get('league_name'), 1.0)
    
    resolved_picks = []
    for p in picks_history:
        p_liga = p.get('liga')
        p_league_id = p.get('league_id')
        p_target_id = None
        try:
            p_target_id = int(p_league_id) if p_league_id is not None else None
        except Exception:
            pass
            
        if ((target_id is not None and p_target_id == target_id) or p_liga == league_name) and p.get('resultado_apuesta') in ['GANADA', 'PERDIDA']:
            resolved_picks.append(p)
            
    total_resolved = len(resolved_picks)
    wins = len([p for p in resolved_picks if p.get('resultado_apuesta') == 'GANADA'])
    real_wr = (wins / total_resolved) if total_resolved > 0 else None
    
    if not is_approved or recent_wr < 0.75 or (real_wr is not None and total_resolved >= 3 and real_wr < 0.70):
        return 'red', 'Alerta', '🔴'
    elif is_approved and recent_wr >= 0.82 and (real_wr is None or total_resolved < 3 or real_wr >= 0.75):
        return 'green', 'Clave', '🟢'
        
    return 'yellow', 'Neutral', '🟡'

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

    # Load leagues and recent rates from dashboard_data.js
    leagues = []
    recent_rates = {}
    db_file = os.path.join('data', 'picks', 'dashboard_data.js')
    if os.path.exists(db_file):
        try:
            with open(db_file, 'r', encoding='utf-8') as f_db:
                content = f_db.read()
            json_str = content.replace('window.dashboardData = ', '').strip().rstrip(';')
            data = json.loads(json_str)
            leagues = data.get('leagues', [])
            recent_rates = data.get('league_current_season_recent_rates', {})
        except Exception as e:
            print(f"[Telegram Notifier] Error al parsear dashboard_data.js: {e}")
        
    # Define current time in UTC (naive)
    dt_now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    
    # Sort picks chronologically (ascending, oldest kickoff first)
    def parse_dt(p):
        try:
            return datetime.datetime.strptime(f"{p.get('fecha', '1970-01-01')} {p.get('hora', '00:00')}", "%Y-%m-%d %H:%M")
        except Exception:
            return datetime.datetime.min

    picks = sorted(picks, key=parse_dt)
        
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
    if "sent_reminders" not in state:
        state["sent_reminders"] = []
        
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
            # Evaluate league status
            status_val, status_label, status_emoji = get_league_status(
                p.get('liga'), p.get('league_id'), leagues, recent_rates, picks
            )
            
            # Skip sending if league is in Alerta (red)
            if status_val == 'red':
                print(f"   -> Saltando alerta de pick para partido {match_id} ({p.get('local')} vs {p.get('visitante')}) porque la liga {p.get('liga')} está en ALERTA (rojo).")
                state["sent_upcoming"].append(str(match_id))
                updated_state = True
                continue

            date_str = p.get('fecha')
            time_str = p.get('hora')
            
            # Safeguard: skip upcoming picks that already started
            try:
                dt_kickoff = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                if dt_kickoff < dt_now:
                    print(f"   -> El partido {match_id} ya comenzó ({date_str} {time_str}). Marcando como sent_upcoming en silencio.")
                    state["sent_upcoming"].append(str(match_id))
                    updated_state = True
                    continue
            except Exception:
                pass

            # Format kickoff time from UTC to VET (UTC-4)
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
                stake_usd_tier = 20.0
            elif tier == 2:
                stake_pct = "1.0%"
                stake_usd_tier = 10.0
            else:
                stake_pct = "0.5%"
                stake_usd_tier = 5.0
                
            # Kelly stake sizing (1/10 Kelly)
            prob_str = p.get('probabilidad', '0.0%').replace('%', '')
            try:
                prob_val = float(prob_str) / 100.0
            except:
                prob_val = 0.75
                
            odds = p.get('cuota_recomendada')
            try:
                odds_val = float(odds) if odds is not None else 1.45
            except:
                odds_val = 1.45
                
            b_val = odds_val - 1.0
            kelly_f = (prob_val * b_val - (1.0 - prob_val)) / b_val if b_val > 0 else 0.0
            stake_f = kelly_f * 0.10  # 1/10 Kelly
            
            is_drawdown = p.get('is_drawdown', False)
            if is_drawdown:
                stake_f = stake_f * 0.5  # Cut stake in half
                
            # Clamp Kelly stake between 0.5% and 3.0%
            stake_f = max(0.005, min(0.03, stake_f))
            
            ref_bankroll = 1000.0
            stake_usd_kelly = stake_f * ref_bankroll
            
            # Format drawdown warning prefix if applicable
            drawdown_alert = ""
            if is_drawdown:
                recent_wr = p.get('league_recent_win_rate', 1.0) * 100
                drawdown_alert = f"⚠️ <b>ALERTA RACHA NEGATIVA EN LIGA ({recent_wr:.1f}% WR)</b>\n<i>Esta liga está en racha de pérdidas reciente. Se recomienda precaución o reducir stake.</i>\n\n"
                
            # Formulate HTML message
            msg = (
                f"🆕 <b>NUEVO PICK DETECTADO (HT Over 0.5)</b> {status_emoji} <b>[LIGA {status_label.upper()}]</b>\n\n"
                f"{drawdown_alert}"
                f"🏆 <b>Liga:</b> {p.get('liga')} (<i>{tier_name}</i>)\n"
                f"🆚 <b>Partido:</b> {p.get('local')} vs {p.get('visitante')}\n"
                f"📅 <b>Fecha:</b> {fecha_vet} (VET)\n"
                f"⏰ <b>Hora:</b> {hora_vet} (VET)\n"
                f"📈 <b>Clase:</b> {p.get('clase')} (Prob: {p.get('probabilidad')})\n"
                f"📊 <b>Sustento:</b> {p.get('sustento')}\n"
                f"💵 <b>Cuota Recomendada:</b> {p.get('cuota_recomendada')} ({p.get('bookmaker_recomendado')})\n\n"
                f"⚖️ <b>Stake Sugerido (Tier):</b> {stake_pct} (Ref: ${stake_usd_tier:.2f})\n"
                f"📊 <b>Stake Kelly Dinámico (1/10 Kelly):</b> {stake_f*100:.2f}% (Ref: ${stake_usd_kelly:.2f})\n"
            )
            
            print(f"   -> Enviando alerta de pick para: {p.get('local')} vs {p.get('visitante')}")
            
            # Generate infographic image in a temporary path
            temp_dir = os.path.join('data', 'picks', 'temp_infographics')
            os.makedirs(temp_dir, exist_ok=True)
            temp_path = os.path.join(temp_dir, f"pick_{match_id}.png")
            
            img_success = generate_pick_infographic(p, temp_path)
            
            success = False
            if img_success and os.path.exists(temp_path):
                # Try sending photo first
                success = send_telegram_photo(token, chat_id, temp_path, msg)
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            # Fallback to text message if photo failed
            if not success:
                success = send_telegram_message(token, chat_id, msg)
                
            if success:
                state["sent_upcoming"].append(str(match_id))
                updated_state = True
                
    # 2.5. Process Kickoff Reminders
    print("[Telegram Notifier] Procesando recordatorios de partidos cercanos...")
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
            
        res_bet = p.get('resultado_apuesta')
        is_pending = res_bet is None or res_bet == 'PENDIENTE' or res_bet == ''
        
        if is_pending:
            try:
                date_str = p.get('fecha')
                time_str = p.get('hora')
                dt_kickoff = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                time_diff = dt_kickoff - dt_now
                seconds_to_kickoff = time_diff.total_seconds()
                
                # Send reminder if match starts in 2 hours (7200 seconds) or less
                if 0 <= seconds_to_kickoff <= 7200 and str(match_id) not in state["sent_reminders"]:
                    # Evaluate league status
                    status_val, status_label, status_emoji = get_league_status(
                        p.get('liga'), p.get('league_id'), leagues, recent_rates, picks
                    )
                    
                    # Skip reminder if league is in Alerta (red)
                    if status_val == 'red':
                        print(f"   -> Saltando recordatorio de partido {match_id} porque la liga está en ALERTA (rojo).")
                        state["sent_reminders"].append(str(match_id))
                        updated_state = True
                        continue

                    # Format kickoff time to VET (UTC-4)
                    dt_vet = dt_kickoff - datetime.timedelta(hours=4)
                    fecha_vet = dt_vet.strftime("%Y-%m-%d")
                    hora_vet = dt_vet.strftime("%H:%M")
                    
                    tier = int(p.get('tier', 3))
                    tier_names = {1: "Tier 1 (Alta Liquidez)", 2: "Tier 2 (Media Liquidez)", 3: "Tier 3 (Exótica)"}
                    tier_name = tier_names.get(tier, f"Tier {tier}")
                    
                    # Suggest dynamic stakes
                    if tier == 1:
                        stake_pct = "2.0%"
                        stake_usd_tier = 20.0
                    elif tier == 2:
                        stake_pct = "1.0%"
                        stake_usd_tier = 10.0
                    else:
                        stake_pct = "0.5%"
                        stake_usd_tier = 5.0
                        
                    # Kelly stake sizing (1/10 Kelly)
                    prob_str = p.get('probabilidad', '0.0%').replace('%', '')
                    try:
                        prob_val = float(prob_str) / 100.0
                    except:
                        prob_val = 0.75
                        
                    odds = p.get('cuota_recomendada')
                    try:
                        odds_val = float(odds) if odds is not None else 1.45
                    except:
                        odds_val = 1.45
                        
                    b_val = odds_val - 1.0
                    kelly_f = (prob_val * b_val - (1.0 - prob_val)) / b_val if b_val > 0 else 0.0
                    stake_f = kelly_f * 0.10  # 1/10 Kelly
                    
                    is_drawdown = p.get('is_drawdown', False)
                    if is_drawdown:
                        stake_f = stake_f * 0.5  # Cut stake in half
                        
                    stake_f = max(0.005, min(0.03, stake_f))
                    ref_bankroll = 1000.0
                    stake_usd_kelly = stake_f * ref_bankroll
                    
                    # Format drawdown warning prefix if applicable
                    drawdown_alert = ""
                    if is_drawdown:
                        recent_wr = p.get('league_recent_win_rate', 1.0) * 100
                        drawdown_alert = f"⚠️ <b>ALERTA RACHA NEGATIVA EN LIGA ({recent_wr:.1f}% WR)</b>\n\n"
                        
                    msg = (
                        f"⏰ <b>RECORDATORIO DE PARTIDO (HT Over 0.5)</b> {status_emoji} <b>[LIGA {status_label.upper()}]</b>\n\n"
                        f"{drawdown_alert}"
                        f"🆚 <b>Partido:</b> {p.get('local')} vs {p.get('visitante')}\n"
                        f"🏆 <b>Liga:</b> {p.get('liga')} (<i>{tier_name}</i>)\n"
                        f"⏰ <b>Kickoff:</b> {hora_vet} (VET) | Fecha: {fecha_vet}\n"
                        f"📈 <b>Clase:</b> {p.get('clase')} (Prob: {p.get('probabilidad')})\n"
                        f"💵 <b>Cuota Recomendada:</b> {p.get('cuota_recomendada')} ({p.get('bookmaker_recomendado')})\n\n"
                        f"⚖️ <b>Stake Sugerido (Tier):</b> {stake_pct} (Ref: ${stake_usd_tier:.2f})\n"
                        f"📊 <b>Stake Kelly Dinámico (1/10 Kelly):</b> {stake_f*100:.2f}% (Ref: ${stake_usd_kelly:.2f})\n\n"
                        f"<i>Asegúrate de colocar tu apuesta antes del inicio.</i>"
                    )
                    
                    print(f"   -> Enviando recordatorio para: {p.get('local')} vs {p.get('visitante')}")
                    success = send_telegram_message(token, chat_id, msg)
                    if success:
                        state["sent_reminders"].append(str(match_id))
                        updated_state = True
            except Exception as e:
                print(f"[Telegram Notifier] Error al calcular recordatorio para match_id {match_id}: {e}")
                
    # 3. Process Resolved Picks
    print("[Telegram Notifier] Procesando resultados de partidos recientes...")
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
            
        res_bet = p.get('resultado_apuesta')
        if res_bet in ['GANADA', 'PERDIDA', 'CANCELADO'] and str(match_id) not in state["sent_resolved"]:
            # Evaluate league status
            status_val, status_label, status_emoji = get_league_status(
                p.get('liga'), p.get('league_id'), leagues, recent_rates, picks
            )
            
            # Skip resolved pick notification if league is in Alerta (red)
            if status_val == 'red':
                print(f"   -> Saltando resultado de partido {match_id} ({p.get('local')} vs {p.get('visitante')}) porque la liga está en ALERTA (rojo).")
                state["sent_resolved"].append(str(match_id))
                updated_state = True
                continue

            date_str = p.get('fecha')
            time_str = p.get('hora')
            
            # Safeguard: only send results for matches played in the last 2 days
            try:
                dt_kickoff = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                if (dt_now - dt_kickoff).days > 2:
                    print(f"   -> El resultado del partido {match_id} ({date_str}) es de hace más de 2 días. Marcando como sent_resolved en silencio.")
                    state["sent_resolved"].append(str(match_id))
                    updated_state = True
                    continue
            except Exception:
                pass

            # Format kickoff time from UTC to VET (UTC-4)
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
                
            is_drawdown = p.get('is_drawdown', False)
            if is_drawdown:
                stake_usd = stake_usd * 0.5
                drawdown_suffix = " (Stake reducido por Drawdown Guard)"
            else:
                drawdown_suffix = ""
                
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
                f"🏁 <b>RESULTADO DE PICK HT OVER 0.5</b> {status_emoji} <b>[LIGA {status_label.upper()}]</b>\n\n"
                f"🆚 <b>Partido:</b> {p.get('local')} vs {p.get('visitante')}\n"
                f"🏆 <b>Liga:</b> {p.get('liga')}\n"
                f"📅 <b>Fecha:</b> {fecha_vet} {hora_vet} (VET)\n"
                f"📊 <b>Clase:</b> {p.get('clase')} (Tier {tier})\n"
                f"⏱️ <b>Marcador HT:</b> {p.get('marcador_ht') or 'N/A'}\n\n"
                f"✨ <b>Resultado:</b> {status_icon} <b>{res_bet}</b>\n"
                f"💰 <b>Cuota:</b> {odds_val:.2f}\n"
                f"💵 <b>Balance:</b> {profit_str} (Stake: ${stake_usd:.2f}{drawdown_suffix})\n"
            )
            
            print(f"   -> Enviando alerta de resultado para: {p.get('local')} vs {p.get('visitante')} ({res_bet})")
            success = send_telegram_message(token, chat_id, msg)
            if success:
                state["sent_resolved"].append(str(match_id))
                updated_state = True
                
    # 4. Check for recess/off-season reminder
    recess_reminder_sent = check_and_send_recess_reminder(token, chat_id, state)
    if recess_reminder_sent:
        updated_state = True
        
    # 5. Save updated state if changes occurred
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
