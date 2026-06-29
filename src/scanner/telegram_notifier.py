import json
import os
import sys
import datetime
import requests
import base64

sys.path.append('.')
from config import settings
from src.scanner.visual_generator import generate_pick_infographic

COUNTRY_EMOJIS = {
    'Germany': '🇩🇪', 'Finland': '🇫🇮', 'Iceland': '🇮🇸', 'Estonia': '🇪🇪',
    'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'USA': '🇺🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Spain': '🇪🇸', 'Italy': '🇮🇹', 'France': '🇫🇷', 'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Switzerland': '🇨🇭',
    'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Japan': '🇯🇵', 'Korea': '🇰🇷',
    'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Denmark': '🇩🇰', 'Ireland': '🇮🇪'
}

def get_league_info(liga_name):
    # Buscar en la configuración de ligas para obtener el país
    for info in settings.API_FOOTBALL_LEAGUE_TARGETS.values():
        if info['league_name'] == liga_name:
            country = info.get('country', '')
            emoji = COUNTRY_EMOJIS.get(country, '⚽')
            return country, emoji
    return '', '⚽'

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
    now = datetime.datetime.now()
    current_year = now.year
    current_month = now.month
    
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
    # 1. Resolver Bot Token y Chat ID
    token = os.environ.get("TELEGRAM_BOT_TOKEN") or getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID") or getattr(settings, 'TELEGRAM_CHAT_ID', '').strip()
    
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

    # Cargar datos de ligas desde el dashboard
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
            
    # Cargar estado de notificaciones enviadas
    state_file = os.path.join('data', 'picks', 'telegram_sent_state.json')
    state = {"sent_weekly_picks_ids": [], "last_weekly_summary_date": "", "sent_daily_agenda_date": "", "sent_resolved_daily": []}
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                for k, v in loaded.items():
                    state[k] = v
        except Exception:
            pass
            
    if not isinstance(state.get("sent_weekly_picks_ids"), list):
        state["sent_weekly_picks_ids"] = []
    if not isinstance(state.get("sent_resolved_daily"), list):
        state["sent_resolved_daily"] = []
        
    dt_now_utc = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    dt_now_vet = dt_now_utc - datetime.timedelta(hours=4)
    current_date_vet_str = dt_now_vet.strftime("%Y-%m-%d")
    
    # Ordenar cronológicamente
    def parse_dt(p):
        try:
            return datetime.datetime.strptime(f"{p.get('fecha', '1970-01-01')} {p.get('hora', '00:00')}", "%Y-%m-%d %H:%M")
        except Exception:
            return datetime.datetime.min

    picks = sorted(picks, key=parse_dt)
    updated_state = False

    def utc_to_vet_str(date_str, time_str):
        try:
            dt_utc = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            dt_vet = dt_utc - datetime.timedelta(hours=4)
            return dt_vet.strftime("%Y-%m-%d"), dt_vet.strftime("%H:%M")
        except:
            return date_str, time_str

    # --- REPORTE 1: RESUMEN SEMANAL DE PICKS ---
    upcoming_picks = []
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
        res_bet = p.get('resultado_apuesta')
        is_pending = res_bet is None or res_bet == 'PENDIENTE' or res_bet == ''
        
        date_str = p.get('fecha')
        time_str = p.get('hora')
        try:
            dt_kickoff = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            if is_pending and dt_kickoff > dt_now_utc:
                status_val, _, _ = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
                if status_val != 'red':
                    upcoming_picks.append(p)
        except Exception:
            pass

    print(f"[Telegram Notifier] {len(upcoming_picks)} picks futuros aptos para el resumen semanal.")

    upcoming_ids = [str(p['match_id']) for p in upcoming_picks]
    new_ids = [x for x in upcoming_ids if x not in state["sent_weekly_picks_ids"]]
    
    days_since_last = 99
    if state.get("last_weekly_summary_date"):
        try:
            last_date = datetime.datetime.strptime(state["last_weekly_summary_date"], "%Y-%m-%d")
            days_since_last = (dt_now_vet - last_date).days
        except:
            pass
            
    if len(upcoming_picks) > 0 and (len(new_ids) > 0 or days_since_last >= 7):
        print("[Telegram Notifier] Generando resumen semanal...")
        msg = f"📋 <b>NUEVOS PICKS PROGRAMADOS (PRÓXIMOS 7 DÍAS)</b>\n"
        msg += f"<i>Total picks detectados: {len(upcoming_picks)}</i>\n\n"
        
        grouped_picks = {}
        for p in upcoming_picks:
            fecha_vet, hora_vet = utc_to_vet_str(p['fecha'], p['hora'])
            grouped_picks.setdefault(fecha_vet, []).append((p, hora_vet))
            
        for f_vet in sorted(grouped_picks.keys()):
            try:
                dt_f = datetime.datetime.strptime(f_vet, "%Y-%m-%d")
                dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
                day_name = dias[dt_f.weekday()]
                date_header = f"📅 <b>{day_name} {f_vet}</b>"
            except:
                date_header = f"📅 <b>{f_vet}</b>"
                
            msg += f"{date_header}\n"
            for p, h_vet in grouped_picks[f_vet]:
                country, emoji = get_league_info(p.get('liga'))
                status_val, status_label, status_emoji = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
                
                clase_lbl = "Premium" if p.get('clase') == 'Clase A' else "Valor"
                tier = int(p.get('tier', 3))
                stake_pct = "2.0%" if tier == 1 else ("1.0%" if tier == 2 else "0.5%")
                
                msg += (
                    f"• {emoji} <b>{p.get('local')} vs {p.get('visitante')}</b>\n"
                    f"  🏆 {p.get('liga')} ({status_emoji} {status_label}) | ⏰ {h_vet} (VET)\n"
                    f"  📈 {clase_lbl} | 💵 Cuota: {p.get('cuota_recomendada')} | ⚖️ Stake: {stake_pct}\n\n"
                )
        
        success = send_telegram_message(token, chat_id, msg)
        if success:
            state["sent_weekly_picks_ids"] = upcoming_ids
            state["last_weekly_summary_date"] = current_date_vet_str
            updated_state = True

    # --- REPORTE 2: AGENDA CONSOLIDADA DEL DÍA ---
    today_picks = []
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
        res_bet = p.get('resultado_apuesta')
        is_pending = res_bet is None or res_bet == 'PENDIENTE' or res_bet == ''
        
        fecha_vet, hora_vet = utc_to_vet_str(p['fecha'], p['hora'])
        if is_pending and fecha_vet == current_date_vet_str:
            status_val, _, _ = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
            if status_val != 'red':
                try:
                    dt_kickoff = datetime.datetime.strptime(f"{p['fecha']} {p['hora']}", "%Y-%m-%d %H:%M")
                    if dt_kickoff > dt_now_utc:
                        today_picks.append((p, hora_vet))
                except:
                    today_picks.append((p, hora_vet))

    print(f"[Telegram Notifier] {len(today_picks)} picks programados para HOY.")

    if len(today_picks) > 0 and state.get("sent_daily_agenda_date") != current_date_vet_str:
        print("[Telegram Notifier] Enviando agenda del día...")
        msg = f"📅 <b>AGENDA DE PARTIDOS - HOY ({current_date_vet_str})</b> 📅\n\n"
        
        for p, h_vet in today_picks:
            country, emoji = get_league_info(p.get('liga'))
            status_val, status_label, status_emoji = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
            
            clase_lbl = "Premium" if p.get('clase') == 'Clase A' else "Valor"
            tier = int(p.get('tier', 3))
            stake_pct = "2.0%" if tier == 1 else ("1.0%" if tier == 2 else "0.5%")
            
            msg += (
                f"• {emoji} <b>{p.get('local')} vs {p.get('visitante')}</b>\n"
                f"  🏆 {p.get('liga')} ({status_emoji} {status_label}) | ⏰ <b>{h_vet}</b> (VET)\n"
                f"  💵 Cuota: {p.get('cuota_recomendada')} | ⚖️ Stake: {stake_pct}\n\n"
            )
            
        msg += f"<i>Consulta el dashboard en vivo para seguir los partidos o live betting.</i>"
        success = send_telegram_message(token, chat_id, msg)
        if success:
            state["sent_daily_agenda_date"] = current_date_vet_str
            updated_state = True

    # --- REPORTE 3: REPORTE DIARIO DE RESULTADOS ---
    resolved_picks = []
    for p in picks:
        match_id = p.get('match_id')
        if not match_id:
            continue
        res_bet = p.get('resultado_apuesta')
        if res_bet in ['GANADA', 'PERDIDA', 'CANCELADO'] and str(match_id) not in state["sent_resolved_daily"]:
            status_val, _, _ = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
            if status_val != 'red':
                resolved_picks.append(p)

    print(f"[Telegram Notifier] {len(resolved_picks)} nuevos resultados por reportar.")

    if len(resolved_picks) > 0:
        print("[Telegram Notifier] Enviando reporte de resultados...")
        msg = f"🏁 <b>RESUMEN DE RESULTADOS DIARIOS</b> 🏁\n"
        msg += f"<i>Total partidos resueltos: {len(resolved_picks)}</i>\n\n"
        
        total_staked = 0.0
        total_profit = 0.0
        
        for p in resolved_picks:
            country, emoji = get_league_info(p.get('liga'))
            status_val, status_label, status_emoji = get_league_status(p.get('liga'), p.get('league_id'), leagues, recent_rates, picks)
            
            res_bet = p.get('resultado_apuesta')
            status_icon = "✅" if res_bet == 'GANADA' else ("❌" if res_bet == 'PERDIDA' else "🟡")
            
            tier = int(p.get('tier', 3))
            stake_usd = 20.0 if tier == 1 else (10.0 if tier == 2 else 5.0)
            is_drawdown = p.get('is_drawdown', False)
            if is_drawdown:
                stake_usd *= 0.5
                
            odds = p.get('cuota_recomendada')
            try:
                odds_val = float(odds) if odds is not None else 1.45
            except:
                odds_val = 1.45
                
            net_profit = 0.0
            if res_bet == 'GANADA':
                net_profit = stake_usd * (odds_val - 1.0)
                profit_lbl = f"+${net_profit:.2f}"
            elif res_bet == 'PERDIDA':
                net_profit = -stake_usd
                profit_lbl = f"-${stake_usd:.2f}"
            else:
                profit_lbl = "$0.00"
                
            total_staked += stake_usd
            total_profit += net_profit
            
            fecha_vet, hora_vet = utc_to_vet_str(p['fecha'], p['hora'])
            
            msg += (
                f"• {emoji} <b>{p.get('local')} vs {p.get('visitante')}</b>\n"
                f"  🏆 {p.get('liga')} | HT: {p.get('marcador_ht') or 'N/A'}\n"
                f"  ✨ Estado: {status_icon} <b>{res_bet}</b> | Cuota: @{odds_val:.2f}\n"
                f"  💰 Balance: <b>{profit_lbl}</b> (Stake: ${stake_usd:.2f}{' [Reducido]' if is_drawdown else ''})\n\n"
            )
            
        yield_pct = (total_profit / total_staked * 100.0) if total_staked > 0 else 0.0
        profit_sign = "+" if total_profit >= 0 else ""
        yield_sign = "+" if yield_pct >= 0 else ""
        
        balance_summary = (
            f"📊 <b>BALANCE DE LA JORNADA</b>\n"
            f"<pre>"
            f"Inversión Total : ${total_staked:.2f}\n"
            f"Retorno Neto    : {profit_sign}${total_profit:.2f}\n"
            f"Rendimiento/Yield: {yield_sign}{yield_pct:.1f}%\n"
            f"</pre>"
        )
        msg += balance_summary
        
        success = send_telegram_message(token, chat_id, msg)
        if success:
            for p in resolved_picks:
                state["sent_resolved_daily"].append(str(p['match_id']))
            updated_state = True

    # 4. Recordatorio estacional de receso de verano
    recess_reminder_sent = check_and_send_recess_reminder(token, chat_id, state)
    if recess_reminder_sent:
        updated_state = True
        
    # 5. Guardar estado si hubo cambios
    if updated_state:
        os.makedirs(os.path.dirname(state_file), exist_ok=True)
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        print("[Telegram Notifier] Estado guardado correctamente en telegram_sent_state.json.")
        
        if getattr(settings, 'GITHUB_ENABLED', False) and os.environ.get("GITHUB_ACTIONS") != "true":
            print("[Telegram Notifier] Sincronizando estado con GitHub...")
            try:
                upload_file_to_github(state_file, 'data/picks/telegram_sent_state.json')
            except Exception as e:
                print(f"[Telegram Notifier] Error al subir estado a GitHub: {e}")

if __name__ == "__main__":
    run_telegram_notifications()
