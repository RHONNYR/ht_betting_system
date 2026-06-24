import os
import sys
import socket

# Parche DNS para evitar bloqueo/enrutamiento erróneo de proveedores de internet en Venezuela.
# Fuerza la resolución de api.github.com hacia una IP funcional de GitHub (140.82.114.6).
orig_getaddrinfo = socket.getaddrinfo
def custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == 'api.github.com':
        return orig_getaddrinfo('140.82.114.6', port, family, type, proto, flags)
    return orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = custom_getaddrinfo

import datetime as dt
import json
import base64
import requests
import pandas as pd
from config import settings
from src.data.api_sports_extractor import ApiSportsExtractor
from src.core.sports_analyzer import (
    filter_phase_1_leagues,
    calculate_team_metrics,
    run_backtest_simulation,
    find_today_picks
)
from src.data.google_sheets_client import GoogleSheetsClient

def download_latest_picks_history_from_github():
    token = getattr(settings, 'GITHUB_TOKEN', '').strip()
    owner = getattr(settings, 'GITHUB_REPO_OWNER', '').strip()
    repo = getattr(settings, 'GITHUB_REPO_NAME', '').strip()
    enabled = getattr(settings, 'GITHUB_ENABLED', False)
    
    if not enabled or not token or not owner or not repo:
        return
        
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/data/picks/picks_history.json"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3.raw"
    }
    try:
        print("[GitHub Sync] Descargando la versión más reciente de picks_history.json desde GitHub...")
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            dest_dir = os.path.join('data', 'picks')
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, 'picks_history.json')
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            print("[GitHub Sync] ¡Base de datos de picks local sincronizada correctamente con GitHub!")
        elif r.status_code == 404:
            print("[GitHub Sync] picks_history.json no existe en el repositorio remoto aún.")
        else:
            print(f"[GitHub Sync] Advertencia: No se pudo descargar picks_history.json (HTTP {r.status_code})")
    except Exception as e:
        print(f"[GitHub Sync] No se pudo conectar a GitHub para sincronizar: {e}")

def main():
    print("=== INICIANDO PIPELINE HT 0.5+ CON GOOGLE SHEETS ===")
    
    # Sincronizar base de datos de picks desde GitHub antes de comenzar (si no estamos en GitHub Actions)
    if os.environ.get("GITHUB_ACTIONS") != "true":
        download_latest_picks_history_from_github()
        
    print(f"DEBUG: Key length = {len(settings.API_FOOTBALL_KEY)}, Key prefix = {settings.API_FOOTBALL_KEY[:6]}..., Key suffix = ...{settings.API_FOOTBALL_KEY[-6:] if settings.API_FOOTBALL_KEY else ''}")
    print(f"DEBUG: Token length = {len(settings.GITHUB_TOKEN)}, Token prefix = {settings.GITHUB_TOKEN[:6]}..., Token suffix = ...{settings.GITHUB_TOKEN[-6:] if settings.GITHUB_TOKEN else ''}")
    
    # 1. Instanciar el extractor
    try:
        extractor = ApiSportsExtractor()
    except Exception as e:
        print(f"Error al inicializar el cliente de API-Sports: {e}")
        print("Asegúrate de que API_FOOTBALL_KEY esté configurada correctamente en config/settings.py.")
        sys.exit(1)
        
    # Obtener todas las ligas configuradas
    target_leagues = settings.API_FOOTBALL_LEAGUE_TARGETS
    print(f"Ligas configuradas para analizar: {list(target_leagues.keys())}")
    
    # 2. Descargar todos los fixtures de todas las ligas para las temporadas evaluadas
    all_fixtures_list = []
    league_current_season_map = {}
    
    for league_key, league_info in target_leagues.items():
        league_id = league_info['api_id']
        # Obtener temporada actual dinámica para esta liga
        try:
            curr_season = extractor.get_current_season(league_id)
        except Exception as e:
            print(f"\nError al resolver temporada actual para {league_key}: {e}")
            curr_season = settings.API_CURRENT_SEASON
            
        league_current_season_map[league_id] = curr_season
        league_seasons = [curr_season, curr_season - 1, curr_season - 2]
        
        for season in league_seasons:
            try:
                # Intentar descargar de la API
                df_season = extractor.get_fixtures_for_season(league_id, season)
                if not df_season.empty:
                    # Intentar descargar y cruzar cuotas reales para esta liga y temporada
                    try:
                        df_odds = extractor.get_odds_for_season(league_id, season)
                        if not df_odds.empty:
                            df_season = pd.merge(df_season, df_odds, on='match_id', how='left')
                    except Exception as e:
                        print(f"\nNo se pudieron cruzar cuotas reales para liga ID {league_id} temporada {season}: {e}")
                    all_fixtures_list.append(df_season)
                # Pequeña pausa para no sobrepasar el rate limit
                sys.stdout.write(".")
                sys.stdout.flush()
            except Exception as e:
                print(f"\nAdvertencia: No se pudieron descargar partidos para liga {league_key} temporada {season}: {e}")
                
    print("\nDescarga de datos completada.")
    
    if not all_fixtures_list:
        print("Error: No se pudieron descargar datos de ninguna liga. Deteniendo pipeline.")
        sys.exit(1)
        
    all_fixtures = pd.concat(all_fixtures_list, ignore_index=True)
    
    # 3. Aplicar Filtro Fase 1 (Ligas) - Evaluamos la temporada actual correspondiente de cada liga
    df_league_stats, approved_league_ids = filter_phase_1_leagues(all_fixtures, league_current_season_map)
    
    approved_names = df_league_stats[df_league_stats['passed'] == True]['league_name'].unique().tolist()
    print(f"\nLigas aprobadas en Fase 1 ({len(approved_names)}): {approved_names}")
    
    if not approved_league_ids:
        print("Ninguna liga superó los filtros de la Fase 1. Deteniendo pipeline.")
        sys.exit(1)
        
    # 4. Aplicar Filtro Fase 2 (Equipos) para la temporada actual correspondiente de cada liga
    df_local_candidates, df_away_candidates = calculate_team_metrics(
        all_fixtures, league_current_season_map, approved_league_ids
    )
    
    num_locales = len(df_local_candidates[df_local_candidates['is_candidate'] == True]) if not df_local_candidates.empty else 0
    num_visitantes = len(df_away_candidates[df_away_candidates['is_candidate'] == True]) if not df_away_candidates.empty else 0
    print(f"Equipos candidatos encontrados para la temporada actual: {num_locales} Locales, {num_visitantes} Visitantes.")
    
    # 5. Ejecutar Simulación de Backtesting (Últimas 2 temporadas de cada liga)
    df_backtest = run_backtest_simulation(all_fixtures, league_current_season_map)
    if not df_backtest.empty:
        win_rate = (df_backtest['Resultado'] == 'GANADA').mean() * 100
        print(f"Backtesting completado: {len(df_backtest)} partidos simulados. Win Rate estimado: {win_rate:.2f}%")
    else:
        print("No se encontraron emparejamientos válidos para el backtesting en las últimas 2 temporadas.")
        
    # 6. Encontrar Picks para los próximos 7 días
    df_today_picks = pd.DataFrame()
    
    try:
        # Convertir columna date a datetime con zona horaria UTC
        all_fixtures['match_dt_utc'] = pd.to_datetime(all_fixtures['date'], utc=True)
        
        # Rango de fechas: desde hoy 00:00:00 UTC hasta dentro de 7 días completos (8 días de delta)
        start_dt = pd.Timestamp.now(tz='UTC').normalize()
        end_dt = start_dt + pd.Timedelta(days=8)
        
        df_upcoming_fixtures = all_fixtures[
            (all_fixtures['match_dt_utc'] >= start_dt) &
            (all_fixtures['match_dt_utc'] < end_dt) &
            (all_fixtures['status'].isin(['NS', 'TBD'])) &
            (all_fixtures['league_id'].isin(approved_league_ids))
        ].copy()
        
        # Eliminar posibles duplicados
        if not df_upcoming_fixtures.empty:
            df_upcoming_fixtures = df_upcoming_fixtures.drop_duplicates(subset=['match_id'])
            
            # Buscar picks
            df_today_picks = find_today_picks(df_upcoming_fixtures, df_local_candidates, df_away_candidates)
            print(f"Picks encontrados para los próximos 7 días: {len(df_today_picks)}")
            
            # Buscar cuotas reales para los picks encontrados
            if not df_today_picks.empty:
                print("Iniciando recuperación de cuotas reales (API-Sports)...")
                history_file = os.path.join('data', 'picks', 'picks_history.json')
                cached_odds = {}
                if os.path.exists(history_file):
                    try:
                        import json
                        with open(history_file, 'r', encoding='utf-8') as f:
                            history_data = json.load(f)
                            for item in history_data:
                                m_id = item.get('match_id')
                                if m_id is not None and item.get('cuota_recomendada') is not None and item.get('bookmaker_recomendado') != 'Por determinar':
                                    cached_odds[int(m_id)] = {
                                        'cuota_recomendada': item.get('cuota_recomendada'),
                                        'bookmaker_recomendado': item.get('bookmaker_recomendado'),
                                        'otras_cuotas': item.get('otras_cuotas', {})
                                    }
                    except Exception as e:
                        print(f"Error al cargar caché de cuotas desde picks_history.json: {e}")

                import time
                cuotas_rec = []
                bms_rec = []
                otras_list = []
                
                for idx, r in df_today_picks.iterrows():
                    m_id = int(r['match_id'])
                    if m_id in cached_odds:
                        c_info = cached_odds[m_id]
                        cuotas_rec.append(c_info['cuota_recomendada'])
                        bms_rec.append(c_info['bookmaker_recomendado'])
                        otras_list.append(c_info['otras_cuotas'])
                        print(f"  [CACHÉ] ID {m_id} ({r['Local']} vs {r['Visitante']}): {c_info['cuota_recomendada']} en {c_info['bookmaker_recomendado']}")
                    else:
                        c_info = extractor.get_odds_for_fixture(m_id)
                        cuotas_rec.append(c_info['cuota_recomendada'])
                        bms_rec.append(c_info['bookmaker_recomendado'])
                        otras_list.append(c_info['otras_cuotas'])
                        print(f"  [API] ID {m_id} ({r['Local']} vs {r['Visitante']}): {c_info['cuota_recomendada']} en {c_info['bookmaker_recomendado']}")
                        time.sleep(0.5)
                        
                df_today_picks['Cuota Recomendada'] = cuotas_rec
                df_today_picks['Bookmaker Recomendado'] = bms_rec
                df_today_picks['Otras Cuotas'] = otras_list
        else:
            print("No hay partidos programados en los próximos 7 días para las ligas analizadas.")
    except Exception as e:
        print(f"Error al procesar los picks de los próximos 7 días: {e}")
        
    # 7. Volcado a Google Sheets (con fallback local)
    spreadsheet_title = "Sistema_HT_05_Value_Betting"
    
    # Ruta del archivo credentials.json
    base_dir = os.path.dirname(os.path.abspath(__file__))
    credentials_path = os.path.join(base_dir, 'config', 'credentials.json')
    
    if os.path.exists(credentials_path):
        try:
            sheets_client = GoogleSheetsClient(credentials_path=credentials_path)
            sh = sheets_client.open_or_create_spreadsheet(spreadsheet_title)
            
            # Escribir pestañas
            print("Escribiendo datos en Google Sheets...")
            sheets_client.write_tab_ligas(sh, df_league_stats)
            sheets_client.write_tab_equipos(sh, df_local_candidates, df_away_candidates)
            sheets_client.write_tab_backtesting(sh, df_backtest)
            sheets_client.write_tab_picks(sh, df_today_picks)
            
            # También guardar copia local de respaldo para mantener el dashboard actualizado
            save_backup_locally(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks)
            save_dashboard_data_js(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks, all_fixtures)
            
            print(f"\n=== PROCESO COMPLETADO EXITOSAMENTE ===")
            print(f"Los datos han sido actualizados en Google Sheets: '{spreadsheet_title}'")
            print(f"Comparte tu hoja de cálculo con la cuenta de servicio de Google para visualizarla.")
            
        except Exception as e:
            print(f"Error al escribir en Google Sheets: {e}")
            print("Se procederá a guardar una copia local de respaldo.")
            save_backup_locally(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks)
            save_dashboard_data_js(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks, all_fixtures)
    else:
        print(f"\n[AVISO] No se encontró el archivo de credenciales de Google Sheets en '{credentials_path}'.")
        print("El procesamiento se realizó correctamente. Los resultados se guardarán localmente en la carpeta 'data/picks'.")
        save_backup_locally(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks)
        save_dashboard_data_js(df_league_stats, df_local_candidates, df_away_candidates, df_backtest, df_today_picks, all_fixtures)

def save_backup_locally(df_leagues, df_local, df_away, df_backtest, df_picks):
    """
    Guarda una versión local de los reportes en un archivo Excel.
    """
    output_dir = os.path.join('data', 'picks')
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, 'resumen_sistema_ht.xlsx')
    
    try:
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            # Copiar y renombrar columnas de ligas para que luzca profesional en español
            df_leagues_renamed = df_leagues.copy()
            rename_map = {
                'league_id': 'ID Liga',
                'league_name': 'Liga',
                'season': 'Temporada',
                'total_matches': 'Partidos Evaluados',
                'over_15_pct': '% Over 1.5 FT',
                'over_25_pct': '% Over 2.5 FT',
                'partidos_jugados': 'Partidos Jugados',
                'partidos_restantes': 'Partidos Restantes',
                'passed': 'Aprobada'
            }
            rename_map = {k: v for k, v in rename_map.items() if k in df_leagues_renamed.columns}
            df_leagues_renamed = df_leagues_renamed.rename(columns=rename_map)
            
            # Formatear porcentajes para Excel
            if '% Over 1.5 FT' in df_leagues_renamed.columns:
                df_leagues_renamed['% Over 1.5 FT'] = (df_leagues_renamed['% Over 1.5 FT'] * 100).round(1).astype(str) + '%'
            if '% Over 2.5 FT' in df_leagues_renamed.columns:
                df_leagues_renamed['% Over 2.5 FT'] = (df_leagues_renamed['% Over 2.5 FT'] * 100).round(1).astype(str) + '%'
            if 'Aprobada' in df_leagues_renamed.columns:
                df_leagues_renamed['Aprobada'] = df_leagues_renamed['Aprobada'].apply(lambda x: "SÍ" if x else "NO")
                
            df_leagues_renamed.to_excel(writer, sheet_name='Ligas_Filtro', index=False)
            
            df_equipos = pd.concat([df_local, df_away])
            df_equipos = df_equipos[df_equipos['is_candidate'] == True]
            df_equipos.to_excel(writer, sheet_name='Equipos_Radar', index=False)
            
            df_backtest.to_excel(writer, sheet_name='Backtesting', index=False)
            
            df_picks_clean = df_picks.copy()
            if 'Otras Cuotas' in df_picks_clean.columns:
                df_picks_clean = df_picks_clean.drop(columns=['Otras Cuotas'])
            df_picks_clean.to_excel(writer, sheet_name='Picks_7_Dias', index=False)
            
        print(f"Resultados locales guardados en: {filepath}")
    except Exception as e:
        print(f"Error al guardar copia de respaldo local: {e}")

def update_picks_history(df_picks, df_local, df_away, all_fixtures, league_recent_wr=None):
    """
    Saves a persistent record of all recommended picks in data/picks/picks_history.json.
    Updates the results (scores and betting outcome) of played matches from all_fixtures.
    """
    import json
    
    history_dir = os.path.join('data', 'picks')
    os.makedirs(history_dir, exist_ok=True)
    history_file = os.path.join(history_dir, 'picks_history.json')
    
    # 1. Load existing history
    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception as e:
            print(f"Error al leer picks_history.json: {e}")
            
    # Helper maps to resolve missing tiers and league_ids
    name_to_tier = {}
    name_to_id = {}
    for info in settings.API_FOOTBALL_LEAGUE_TARGETS.values():
        api_id = info['api_id']
        tier = settings.API_FOOTBALL_LEAGUE_TIERS.get(api_id, 3)
        name_to_tier[info['league_name']] = tier
        name_to_id[info['league_name']] = api_id

    # Backfill missing league_id and tier in existing history
    for item in history:
        if 'league_id' not in item or item['league_id'] is None:
            liga_name = item.get('liga')
            if liga_name in name_to_id:
                item['league_id'] = name_to_id[liga_name]
        
        if 'tier' not in item or item['tier'] is None:
            l_id = item.get('league_id')
            if l_id is not None and int(l_id) in settings.API_FOOTBALL_LEAGUE_TIERS:
                item['tier'] = settings.API_FOOTBALL_LEAGUE_TIERS[int(l_id)]
            else:
                liga_name = item.get('liga')
                item['tier'] = name_to_tier.get(liga_name, 3)

    # Map of existing history by match_id for easy update
    history_map = {int(p['match_id']): p for p in history if p.get('match_id') is not None}
    
    # 2. Update status and results of already saved picks using all_fixtures
    if not all_fixtures.empty:
        # Create a fast lookup dict from all_fixtures by match_id
        fixtures_lookup = {}
        for _, r in all_fixtures.iterrows():
            m_id = r.get('match_id')
            if m_id is not None:
                fixtures_lookup[int(m_id)] = r
                
        for m_id, pick in history_map.items():
            # Only update if status is not FT or if results are missing
            current_status = pick.get('status', 'NS')
            if current_status not in ['FT', 'AET', 'PEN'] or pick.get('resultado_apuesta') is None:
                if m_id in fixtures_lookup:
                    match_row = fixtures_lookup[m_id]
                    status_short = match_row.get('status', 'NS')
                    pick['status'] = status_short
                    
                    if status_short in ['FT', 'AET', 'PEN']:
                        ht_home = match_row.get('ht_home_goals')
                        ht_away = match_row.get('ht_away_goals')
                        
                        if pd.notna(ht_home) and pd.notna(ht_away):
                            ht_goals = int(ht_home + ht_away)
                            pick['goles_ht'] = ht_goals
                            pick['resultado_apuesta'] = "GANADA" if ht_goals > 0 else "PERDIDA"
                            pick['marcador_ht'] = f"{int(ht_home)} - {int(ht_away)}"
                        else:
                            # Fallback if halftime score is missing in match status FT
                            pick['status'] = 'FT'
                            pick['resultado_apuesta'] = 'DESCONOCIDO'
                    elif status_short in ['PST', 'CANC', 'ABD']:
                        pick['status'] = 'CANCELADO'
                        pick['resultado_apuesta'] = 'CANCELADO'

    # 2.5. Real-Time API Update for pending/active picks
    pending_ids = []
    now_utc = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    for m_id, pick in history_map.items():
        current_status = pick.get('status', 'NS')
        # Check matches that are not final/cancelled, or whose outcome is still undetermined
        if current_status not in ['FT', 'AET', 'PEN', 'CANCELADO'] or pick.get('resultado_apuesta') is None:
            # Query if kickoff time is in the past, or starting within 15 minutes
            date_str = pick.get('fecha')
            time_str = pick.get('hora')
            try:
                dt_kickoff = dt.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                if dt_kickoff <= now_utc + dt.timedelta(minutes=15):
                    pending_ids.append(m_id)
            except Exception:
                pending_ids.append(m_id)

    if pending_ids:
        print(f"[API Live Update] Detectados {len(pending_ids)} partidos pendientes que ya iniciaron o están por iniciar. Consultando API...")
        token = (os.environ.get("API_FOOTBALL_KEY") or settings.API_FOOTBALL_KEY).strip()
        base_url = settings.API_FOOTBALL_BASE_URL.rstrip('/')
        headers = {'x-apisports-key': token}
        
        fetched_fixtures = []
        # Query in batches of 20
        for i in range(0, len(pending_ids), 20):
            batch = pending_ids[i:i+20]
            ids_str = ",".join(str(x) for x in batch)
            url = f"{base_url}/fixtures"
            try:
                r = requests.get(url, headers=headers, params={'ids': ids_str}, timeout=15)
                if r.status_code == 200:
                    payload = r.json()
                    fetched_fixtures.extend(payload.get('response', []))
                else:
                    print(f"[API Live Update] Error en consulta (HTTP {r.status_code}): {r.text}")
            except Exception as e:
                print(f"[API Live Update] Excepción al consultar API para IDs {ids_str}: {e}")
                
        print(f"[API Live Update] Obtenidos {len(fetched_fixtures)} fixtures en tiempo real.")
        for item in fetched_fixtures:
            fixture = item.get('fixture') or {}
            m_id = fixture.get('id')
            if m_id is not None and int(m_id) in history_map:
                pick = history_map[int(m_id)]
                status_info = fixture.get('status') or {}
                status_short = status_info.get('short', 'NS')
                
                score = item.get('score') or {}
                halftime = score.get('halftime') or {}
                goals = item.get('goals') or {}
                
                pick['status'] = status_short
                
                # If first half has completed or match is finished
                is_ht_over = status_short in ['HT', '2H', 'ET', 'FT', 'AET', 'PEN']
                
                goles_ht = None
                resultado = None
                marcador_ht = None
                
                # Check if we won during 1H (live score > 0)
                if status_short == '1H':
                    g_home = goals.get('home')
                    g_away = goals.get('away')
                    if g_home is not None and g_away is not None:
                        total_live = int(g_home + g_away)
                        if total_live > 0:
                            goles_ht = total_live
                            resultado = "GANADA"
                            marcador_ht = f"{int(g_home)} - {int(g_away)} (En vivo)"
                
                elif is_ht_over:
                    ht_home = halftime.get('home')
                    ht_away = halftime.get('away')
                    if ht_home is not None and ht_away is not None:
                        total_ht = int(ht_home + ht_away)
                        goles_ht = total_ht
                        resultado = "GANADA" if total_ht > 0 else "PERDIDA"
                        marcador_ht = f"{int(ht_home)} - {int(ht_away)}"
                    else:
                        if status_short in ['FT', 'AET', 'PEN']:
                            pick['resultado_apuesta'] = 'DESCONOCIDO'
                            
                elif status_short in ['PST', 'CANC', 'ABD']:
                    pick['status'] = 'CANCELADO'
                    resultado = 'CANCELADO'
                    
                if resultado is not None:
                    pick['goles_ht'] = goles_ht
                    pick['resultado_apuesta'] = resultado
                    pick['marcador_ht'] = marcador_ht
                    print(f"[API Live Update] Partido ID {m_id} ({pick['local']} vs {pick['visitante']}) actualizado: Status={status_short}, Marcador HT={marcador_ht}, Resultado={resultado}")
    
    # 3. Add or update picks from df_picks
    if not df_picks.empty:
        for _, r in df_picks.iterrows():
            m_id = int(r.get('match_id', 0))
            if m_id != 0:
                cuota_rec = r.get('Cuota Recomendada', settings.DEFAULT_HT_O05_ODDS)
                bm_rec = r.get('Bookmaker Recomendado', 'Por determinar')
                otras = r.get('Otras Cuotas', {})
                
                if m_id not in history_map:
                    home = r['Local']
                    away = r['Visitante']
                    
                    # Fetch team stats at the time of the pick to store historically
                    home_stats = {
                        'ht_05_pct': 'N/A', 'ht_15_pct': 'N/A', 'bts_pct': 'N/A', 'rendimiento_ht': 'N/A',
                        'avg_goals_ht_general': 'N/A', 'avg_goals_ht_rol': 'N/A', 'racha_ht': 'N/A', 'racha_detalles': [], 'sequia_ht': False, 'is_candidate': False
                    }
                    if not df_local.empty:
                        home_row = df_local[df_local['team_name'] == home]
                        if not home_row.empty:
                            h_rec = home_row.iloc[0]
                            home_stats = {
                                'ht_05_pct': f"{h_rec['ht_05_pct']*100:.1f}%" if isinstance(h_rec['ht_05_pct'], (int, float)) else 'N/A',
                                'ht_15_pct': f"{h_rec['ht_15_pct']*100:.1f}%" if isinstance(h_rec['ht_15_pct'], (int, float)) else 'N/A',
                                'bts_pct': f"{h_rec['bts_pct']*100:.1f}%" if isinstance(h_rec['bts_pct'], (int, float)) else 'N/A',
                                'rendimiento_ht': f"{h_rec['rendimiento_ht']*100:.1f}%" if isinstance(h_rec['rendimiento_ht'], (int, float)) else 'N/A',
                                'avg_goals_ht_general': f"{h_rec['avg_goals_ht_general']:.2f}" if isinstance(h_rec['avg_goals_ht_general'], (int, float)) else 'N/A',
                                'avg_goals_ht_rol': f"{h_rec['avg_goals_ht_rol']:.2f}" if isinstance(h_rec['avg_goals_ht_rol'], (int, float)) else 'N/A',
                                'racha_ht': h_rec['racha_ht'],
                                'racha_detalles': h_rec['racha_detalles'] if isinstance(h_rec.get('racha_detalles'), list) else [],
                                'sequia_ht': bool(h_rec.get('sequia_ht', False)),
                                'is_candidate': bool(h_rec['is_candidate'])
                            }
                            
                    away_stats = {
                        'ht_05_pct': 'N/A', 'ht_15_pct': 'N/A', 'bts_pct': 'N/A', 'rendimiento_ht': 'N/A',
                        'avg_goals_ht_general': 'N/A', 'avg_goals_ht_rol': 'N/A', 'racha_ht': 'N/A', 'racha_detalles': [], 'sequia_ht': False, 'is_candidate': False
                    }
                    if not df_away.empty:
                        away_row = df_away[df_away['team_name'] == away]
                        if not away_row.empty:
                            a_rec = away_row.iloc[0]
                            away_stats = {
                                'ht_05_pct': f"{a_rec['ht_05_pct']*100:.1f}%" if isinstance(a_rec['ht_05_pct'], (int, float)) else 'N/A',
                                'ht_15_pct': f"{a_rec['ht_15_pct']*100:.1f}%" if isinstance(a_rec['ht_15_pct'], (int, float)) else 'N/A',
                                'bts_pct': f"{a_rec['bts_pct']*100:.1f}%" if isinstance(a_rec['bts_pct'], (int, float)) else 'N/A',
                                'rendimiento_ht': f"{a_rec['rendimiento_ht']*100:.1f}%" if isinstance(a_rec['rendimiento_ht'], (int, float)) else 'N/A',
                                'avg_goals_ht_general': f"{a_rec['avg_goals_ht_general']:.2f}" if isinstance(a_rec['avg_goals_ht_general'], (int, float)) else 'N/A',
                                'avg_goals_ht_rol': f"{a_rec['avg_goals_ht_rol']:.2f}" if isinstance(a_rec['avg_goals_ht_rol'], (int, float)) else 'N/A',
                                'racha_ht': a_rec['racha_ht'],
                                'racha_detalles': a_rec['racha_detalles'] if isinstance(a_rec.get('racha_detalles'), list) else [],
                                'sequia_ht': bool(a_rec.get('sequia_ht', False)),
                                'is_candidate': bool(a_rec['is_candidate'])
                            }
                            
                    league_id_val = int(r.get('league_id')) if pd.notna(r.get('league_id')) else name_to_id.get(r.get('Liga'), 0)
                    tier_val = settings.API_FOOTBALL_LEAGUE_TIERS.get(league_id_val, name_to_tier.get(r.get('Liga'), 3))

                    liga_name = r.get('Liga', 'N/A')
                    recent_wr = league_recent_wr.get(liga_name, 1.0) if league_recent_wr else 1.0
                    is_drawdown = recent_wr < 0.70
                    
                    new_pick = {
                        'match_id': m_id,
                        'league_id': league_id_val,
                        'tier': tier_val,
                        'fecha': r.get('Fecha', 'N/A'),
                        'hora': r.get('Hora', 'N/A'),
                        'liga': liga_name,
                        'local': home,
                        'visitante': away,
                        'probabilidad': r.get('Probabilidad HT 0.5+ Combinada', '0.0%'),
                        'clase': r.get('Clase', 'Clase B'),
                        'sustento': r.get('Sustento', 'Local'),
                        'status': 'NS',
                        'goles_ht': None,
                        'resultado_apuesta': None,
                        'marcador_ht': None,
                        'cuota_recomendada': cuota_rec,
                        'bookmaker_recomendado': bm_rec,
                        'otras_cuotas': otras,
                        'local_stats': home_stats,
                        'visitante_stats': away_stats,
                        'league_recent_win_rate': recent_wr,
                        'is_drawdown': is_drawdown
                    }
                    history.append(new_pick)
                    history_map[m_id] = new_pick
                else:
                    # Keep the highest recommended odd recorded at any moment
                    existing_pick = history_map[m_id]
                    old_cuota = existing_pick.get('cuota_recomendada')
                    
                    try:
                        old_cuota_val = float(old_cuota) if old_cuota is not None else 0.0
                    except (ValueError, TypeError):
                        old_cuota_val = 0.0
                        
                    try:
                        new_cuota_val = float(cuota_rec) if cuota_rec is not None else 0.0
                    except (ValueError, TypeError):
                        new_cuota_val = 0.0
                        
                    is_default_or_missing = (
                        'cuota_recomendada' not in existing_pick
                        or 'bookmaker_recomendado' not in existing_pick
                        or existing_pick.get('bookmaker_recomendado') == 'Por determinar'
                        or old_cuota_val == settings.DEFAULT_HT_O05_ODDS
                    )
                    
                    if is_default_or_missing or new_cuota_val > old_cuota_val:
                        existing_pick['cuota_recomendada'] = cuota_rec
                        existing_pick['bookmaker_recomendado'] = bm_rec
                        existing_pick['otras_cuotas'] = otras
                
    # Update league recent win rates and drawdown status for all history records
    for pick in history:
        liga_name = pick.get('liga')
        recent_wr = league_recent_wr.get(liga_name, 1.0) if league_recent_wr else 1.0
        pick['league_recent_win_rate'] = recent_wr
        pick['is_drawdown'] = recent_wr < 0.70

    # Sort history: pending matches by date/time ascending, followed by finished matches descending (newest results first)
    pending_picks = [p for p in history if p.get('resultado_apuesta') is None]
    finished_picks = [p for p in history if p.get('resultado_apuesta') is not None]
    
    pending_picks.sort(key=lambda x: (x.get('fecha', 'N/A'), x.get('hora', 'N/A')))
    finished_picks.sort(key=lambda x: (x.get('fecha', 'N/A'), x.get('hora', 'N/A')), reverse=True)
    
    sorted_history = pending_picks + finished_picks
    
    try:
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(sorted_history, f, indent=2, ensure_ascii=False)
        print(f"Historial de picks actualizado y guardado en: {history_file} ({len(sorted_history)} registros)")
    except Exception as e:
        print(f"Error al guardar picks_history.json: {e}")
        
    return sorted_history

def upload_file_to_github(local_file_path, repo_file_path):
    token = getattr(settings, 'GITHUB_TOKEN', '').strip()
    owner = getattr(settings, 'GITHUB_REPO_OWNER', '').strip()
    repo = getattr(settings, 'GITHUB_REPO_NAME', '').strip()
    enabled = getattr(settings, 'GITHUB_ENABLED', False)
    
    if not enabled or not token or not owner or not repo:
        return False
        
    if not os.path.exists(local_file_path):
        print(f"[GitHub] El archivo local no existe: {local_file_path}")
        return False
        
    print(f"[GitHub] Subiendo {repo_file_path} a {owner}/{repo}...")
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{repo_file_path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # 1. Obtener SHA actual si el archivo ya existe
    sha = None
    try:
        r_get = requests.get(url, headers=headers, timeout=15)
        if r_get.status_code == 200:
            sha = r_get.json().get("sha")
    except Exception as e:
        print(f"[GitHub] Error al obtener SHA: {e}")
        
    # 2. Codificar contenido en base64
    try:
        with open(local_file_path, "rb") as f:
            content_bytes = f.read()
        content_base64 = base64.b64encode(content_bytes).decode("utf-8")
    except Exception as e:
        print(f"[GitHub] Error al leer/codificar archivo: {e}")
        return False
        
    # 3. Preparar commit payload
    payload = {
        "message": f"Actualización automática de {repo_file_path} via Pipeline",
        "content": content_base64
    }
    if sha:
        payload["sha"] = sha
        
    # 4. Petición PUT
    try:
        r_put = requests.put(url, headers=headers, json=payload, timeout=20)
        if r_put.status_code in [200, 201]:
            print(f"[GitHub] ¡Archivo {repo_file_path} subido exitosamente!")
            return True
        else:
            print(f"[GitHub] Error al subir archivo ({r_put.status_code}): {r_put.text}")
            return False
    except Exception as e:
        print(f"[GitHub] Error en petición HTTP de subida: {e}")
        return False

def save_dashboard_data_js(df_leagues, df_local, df_away, df_backtest, df_picks, all_fixtures=None):
    """
    Genera el archivo JavaScript data/picks/dashboard_data.js para alimentar la interfaz web.
    """
    import json
    
    # Calculate recent win rates for leagues from backtest
    league_recent_wr = {}
    if not df_backtest.empty:
        try:
            grouped = df_backtest.groupby('Liga')
            for league_name, df_league in grouped:
                df_league_sorted = df_league.sort_values(by='Fecha')
                recent_matches = df_league_sorted.tail(10)
                if len(recent_matches) >= 5:
                    wins = (recent_matches['Resultado'] == 'GANADA').sum()
                    league_recent_wr[league_name] = round(float(wins / len(recent_matches)), 3)
                else:
                    wins = (df_league_sorted['Resultado'] == 'GANADA').sum()
                    total = len(df_league_sorted)
                    league_recent_wr[league_name] = round(float(wins / total), 3) if total > 0 else 1.0
        except Exception as e:
            print(f"Error al calcular recent win rates de ligas: {e}")

    # Helper maps for resolving tiers and league_ids
    name_to_tier = {}
    name_to_id = {}
    for info in settings.API_FOOTBALL_LEAGUE_TARGETS.values():
        api_id = info['api_id']
        tier = settings.API_FOOTBALL_LEAGUE_TIERS.get(api_id, 3)
        name_to_tier[info['league_name']] = tier
        name_to_id[info['league_name']] = api_id

    # Calcular win rate reciente de candidatos en la temporada actual para cada liga
    league_current_season_recent_wr = {}
    local_candidates_map = {}
    away_candidates_map = {}
    
    if not df_local.empty:
        for _, row in df_local[df_local['is_candidate'] == True].iterrows():
            lid = row.get('league_id') or name_to_id.get(row['league_name'])
            if lid:
                local_candidates_map.setdefault(int(lid), set()).add(row['team_name'])
                
    if not df_away.empty:
        for _, row in df_away[df_away['is_candidate'] == True].iterrows():
            lid = row.get('league_id') or name_to_id.get(row['league_name'])
            if lid:
                away_candidates_map.setdefault(int(lid), set()).add(row['team_name'])
                
    if all_fixtures is not None and not all_fixtures.empty and not df_leagues.empty:
        try:
            df_ft = all_fixtures[all_fixtures['status'] == 'FT'].copy()
            df_ft['ht_total_goals'] = df_ft['ht_home_goals'] + df_ft['ht_away_goals']
            
            for _, l_row in df_leagues.iterrows():
                lid = int(l_row['league_id'])
                l_name = l_row['league_name']
                curr_season = int(l_row['season'])
                
                df_league_season = df_ft[(df_ft['league_id'] == lid) & (df_ft['season'] == curr_season)].copy()
                if df_league_season.empty:
                    league_current_season_recent_wr[l_name] = 1.0
                    continue
                    
                l_cands = local_candidates_map.get(lid, set())
                a_cands = away_candidates_map.get(lid, set())
                
                is_cand_match = df_league_season.apply(
                    lambda r: r['home_team_name'] in l_cands or r['away_team_name'] in a_cands,
                    axis=1
                )
                df_cand_matches = df_league_season[is_cand_match].copy()
                
                if df_cand_matches.empty:
                    league_current_season_recent_wr[l_name] = 1.0
                    continue
                    
                df_cand_matches = df_cand_matches.sort_values(by='date')
                recent_matches = df_cand_matches.tail(10)
                wins = (recent_matches['ht_total_goals'] > 0).sum()
                wr = round(float(wins / len(recent_matches)), 3)
                league_current_season_recent_wr[l_name] = wr
        except Exception as e:
            print(f"Error al calcular league_current_season_recent_wr: {e}")

    # 1. Ligas
    leagues_data = []
    if not df_leagues.empty:
        df_l_copy = df_leagues.copy()
        df_l_copy['Estado'] = df_l_copy['passed'].apply(lambda x: "APROBADA" if x else "RECHAZADA")
        # Asegurar porcentajes formateados
        if 'over_15_pct' in df_l_copy.columns:
            df_l_copy['over_15_pct'] = (df_l_copy['over_15_pct'] * 100).round(1)
        if 'over_25_pct' in df_l_copy.columns:
            df_l_copy['over_25_pct'] = (df_l_copy['over_25_pct'] * 100).round(1)
        
        # Resolve tier dynamically
        df_l_copy['tier'] = df_l_copy['league_id'].map(settings.API_FOOTBALL_LEAGUE_TIERS).fillna(3).astype(int)
        
        # Columnas a exportar incluyendo los nuevos conteos de partidos
        export_cols = ['league_id', 'league_name', 'season', 'over_15_pct', 'over_25_pct', 'partidos_jugados', 'partidos_restantes', 'Estado', 'tier']
        # Fallback por si alguna no existe
        export_cols = [c for c in export_cols if c in df_l_copy.columns]
        leagues_data = df_l_copy[export_cols].to_dict(orient='records')
        
    # 2. Equipos
    teams_data = []
    df_all_teams = pd.concat([df_local, df_away])
    if not df_all_teams.empty:
        df_all_teams = df_all_teams[df_all_teams['is_candidate'] == True].copy()
        if not df_all_teams.empty:
            for col in ['ht_05_pct', 'ht_15_pct', 'bts_pct', 'rendimiento_ht']:
                df_all_teams[col] = (df_all_teams[col] * 100).round(1)
            for col in ['avg_goals_ht_general', 'avg_goals_ht_rol']:
                df_all_teams[col] = df_all_teams[col].round(2)
            export_cols_teams = ['league_id', 'league_name', 'team_name', 'role', 'ht_05_pct', 'ht_15_pct', 'bts_pct', 'rendimiento_ht', 'avg_goals_ht_general', 'avg_goals_ht_rol', 'racha_ht', 'racha_detalles']
            export_cols_teams = [c for c in export_cols_teams if c in df_all_teams.columns]
            teams_data = df_all_teams[export_cols_teams].to_dict(orient='records')
        
    # 3. Backtest
    backtest_data = []
    backtest_summary = {
        "total": 0, "aciertos": 0, "fallos": 0, "win_rate": "0.0%",
        "total_a": 0, "aciertos_a": 0, "fallos_a": 0, "win_rate_a": "0.0%",
        "total_b": 0, "aciertos_b": 0, "fallos_b": 0, "win_rate_b": "0.0%",
        "banca_inicial": settings.INITIAL_BANKROLL,
        "banca_final_fijo": settings.INITIAL_BANKROLL,
        "rendimiento_fijo": "+0.0%",
        "banca_final_compuesto": settings.INITIAL_BANKROLL,
        "rendimiento_compuesto": "+0.0%"
    }
    if not df_backtest.empty:
        backtest_cols = [
            'Fecha', 'Liga', 'Local', 'Visitante', 'Goles HT', 'Resultado', 'Clase', 'Sustento',
            'Cuota', 'Bookmaker', 'Stake Fijo', 'Beneficio Fijo', 'Banca Fijo',
            'Stake Compuesto', 'Beneficio Compuesto', 'Banca Compuesto', 'league_id'
        ]
        backtest_cols = [c for c in backtest_cols if c in df_backtest.columns]
        backtest_data = df_backtest[backtest_cols].to_dict(orient='records')
        
        total = len(df_backtest)
        aciertos = int((df_backtest['Resultado'] == 'GANADA').sum())
        fallos = int((df_backtest['Resultado'] == 'PERDIDA').sum())
        win_rate = f"{(aciertos / total * 100):.1f}%" if total > 0 else "0.0%"
        
        # Clase A
        df_a = df_backtest[df_backtest['Clase'] == 'Clase A'] if 'Clase' in df_backtest.columns else pd.DataFrame()
        total_a = len(df_a)
        aciertos_a = int((df_a['Resultado'] == 'GANADA').sum()) if total_a > 0 else 0
        fallos_a = int((df_a['Resultado'] == 'PERDIDA').sum()) if total_a > 0 else 0
        win_rate_a = f"{(aciertos_a / total_a * 100):.1f}%" if total_a > 0 else "0.0%"
        
        # Clase B
        df_b = df_backtest[df_backtest['Clase'] == 'Clase B'] if 'Clase' in df_backtest.columns else pd.DataFrame()
        total_b = len(df_b)
        aciertos_b = int((df_b['Resultado'] == 'GANADA').sum()) if total_b > 0 else 0
        fallos_b = int((df_b['Resultado'] == 'PERDIDA').sum()) if total_b > 0 else 0
        win_rate_b = f"{(aciertos_b / total_b * 100):.1f}%" if total_b > 0 else "0.0%"
        
        initial_bank = settings.INITIAL_BANKROLL
        final_row = df_backtest.iloc[-1]
        final_bank_flat = float(final_row.get('Banca Fijo', initial_bank))
        final_bank_comp = float(final_row.get('Banca Compuesto', initial_bank))
        
        yield_flat = ((final_bank_flat - initial_bank) / initial_bank) * 100
        yield_comp = ((final_bank_comp - initial_bank) / initial_bank) * 100
        
        backtest_summary = {
            "total": total,
            "aciertos": aciertos,
            "fallos": fallos,
            "win_rate": win_rate,
            "total_a": total_a,
            "aciertos_a": aciertos_a,
            "fallos_a": fallos_a,
            "win_rate_a": win_rate_a,
            "total_b": total_b,
            "aciertos_b": aciertos_b,
            "fallos_b": fallos_b,
            "win_rate_b": win_rate_b,
            "banca_inicial": initial_bank,
            "banca_final_fijo": round(final_bank_flat, 2),
            "rendimiento_fijo": f"{yield_flat:+.1f}%",
            "banca_final_compuesto": round(final_bank_comp, 2),
            "rendimiento_compuesto": f"{yield_comp:+.1f}%"
        }
        
    # 4. Picks de hoy con sustento detallado
    picks_data = []
    if not df_picks.empty:
        for _, r in df_picks.iterrows():
            home = r['Local']
            away = r['Visitante']
            
            # Obtener métricas detalladas del local
            home_stats = {
                'ht_05_pct': 'N/A', 'ht_15_pct': 'N/A', 'bts_pct': 'N/A', 'rendimiento_ht': 'N/A',
                'avg_goals_ht_general': 'N/A', 'avg_goals_ht_rol': 'N/A', 'racha_ht': 'N/A', 'racha_detalles': [], 'sequia_ht': False, 'is_candidate': False
            }
            if not df_local.empty:
                home_row = df_local[df_local['team_name'] == home]
                if not home_row.empty:
                    h_rec = home_row.iloc[0]
                    home_stats = {
                        'ht_05_pct': f"{h_rec['ht_05_pct']*100:.1f}%" if isinstance(h_rec['ht_05_pct'], (int, float)) else 'N/A',
                        'ht_15_pct': f"{h_rec['ht_15_pct']*100:.1f}%" if isinstance(h_rec['ht_15_pct'], (int, float)) else 'N/A',
                        'bts_pct': f"{h_rec['bts_pct']*100:.1f}%" if isinstance(h_rec['bts_pct'], (int, float)) else 'N/A',
                        'rendimiento_ht': f"{h_rec['rendimiento_ht']*100:.1f}%" if isinstance(h_rec['rendimiento_ht'], (int, float)) else 'N/A',
                        'avg_goals_ht_general': f"{h_rec['avg_goals_ht_general']:.2f}" if isinstance(h_rec['avg_goals_ht_general'], (int, float)) else 'N/A',
                        'avg_goals_ht_rol': f"{h_rec['avg_goals_ht_rol']:.2f}" if isinstance(h_rec['avg_goals_ht_rol'], (int, float)) else 'N/A',
                        'racha_ht': h_rec['racha_ht'],
                        'racha_detalles': h_rec['racha_detalles'] if isinstance(h_rec.get('racha_detalles'), list) else [],
                        'sequia_ht': bool(h_rec.get('sequia_ht', False)),
                        'is_candidate': bool(h_rec['is_candidate'])
                    }
                    
            # Obtener métricas detalladas del visitante
            away_stats = {
                'ht_05_pct': 'N/A', 'ht_15_pct': 'N/A', 'bts_pct': 'N/A', 'rendimiento_ht': 'N/A',
                'avg_goals_ht_general': 'N/A', 'avg_goals_ht_rol': 'N/A', 'racha_ht': 'N/A', 'racha_detalles': [], 'sequia_ht': False, 'is_candidate': False
            }
            if not df_away.empty:
                away_row = df_away[df_away['team_name'] == away]
                if not away_row.empty:
                    a_rec = away_row.iloc[0]
                    away_stats = {
                        'ht_05_pct': f"{a_rec['ht_05_pct']*100:.1f}%" if isinstance(a_rec['ht_05_pct'], (int, float)) else 'N/A',
                        'ht_15_pct': f"{a_rec['ht_15_pct']*100:.1f}%" if isinstance(a_rec['ht_15_pct'], (int, float)) else 'N/A',
                        'bts_pct': f"{a_rec['bts_pct']*100:.1f}%" if isinstance(a_rec['bts_pct'], (int, float)) else 'N/A',
                        'rendimiento_ht': f"{a_rec['rendimiento_ht']*100:.1f}%" if isinstance(a_rec['rendimiento_ht'], (int, float)) else 'N/A',
                        'avg_goals_ht_general': f"{a_rec['avg_goals_ht_general']:.2f}" if isinstance(a_rec['avg_goals_ht_general'], (int, float)) else 'N/A',
                        'avg_goals_ht_rol': f"{a_rec['avg_goals_ht_rol']:.2f}" if isinstance(a_rec['avg_goals_ht_rol'], (int, float)) else 'N/A',
                        'racha_ht': a_rec['racha_ht'],
                        'racha_detalles': a_rec['racha_detalles'] if isinstance(a_rec.get('racha_detalles'), list) else [],
                        'sequia_ht': bool(a_rec.get('sequia_ht', False)),
                        'is_candidate': bool(a_rec['is_candidate'])
                    }
                    
            league_id_val = int(r.get('league_id')) if pd.notna(r.get('league_id')) else name_to_id.get(r.get('Liga'), 0)
            tier_val = settings.API_FOOTBALL_LEAGUE_TIERS.get(league_id_val, name_to_tier.get(r.get('Liga'), 3))
            
            liga_name = r.get('Liga', 'N/A')
            recent_wr = league_recent_wr.get(liga_name, 1.0)
            is_drawdown = recent_wr < 0.70

            picks_data.append({
                'match_id': int(r.get('match_id', 0)) if r.get('match_id') is not None else 0,
                'league_id': league_id_val,
                'tier': tier_val,
                'fecha': r.get('Fecha', 'N/A'),
                'hora': r.get('Hora', 'N/A'),
                'liga': liga_name,
                'local': home,
                'visitante': away,
                'probabilidad': r.get('Probabilidad HT 0.5+ Combinada', '0.0%'),
                'clase': r.get('Clase', 'Clase B'),
                'sustento': r.get('Sustento', 'Local'),
                'cuota_recomendada': r.get('Cuota Recomendada', settings.DEFAULT_HT_O05_ODDS),
                'bookmaker_recomendado': r.get('Bookmaker Recomendado', 'Por determinar'),
                'otras_cuotas': r.get('Otras Cuotas', {}),
                'local_stats': home_stats,
                'visitante_stats': away_stats,
                'league_recent_win_rate': recent_wr,
                'is_drawdown': is_drawdown
            })
            
    # Actualizar o cargar picks_history
    picks_history = []
    if all_fixtures is not None:
        picks_history = update_picks_history(df_picks, df_local, df_away, all_fixtures, league_recent_wr)
    else:
        # Fallback si no se pasa all_fixtures
        history_file = os.path.join('data', 'picks', 'picks_history.json')
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    picks_history = json.load(f)
                
                # Backfill fallback history
                for item in picks_history:
                    if 'league_id' not in item or item['league_id'] is None:
                        liga_name = item.get('liga')
                        if liga_name in name_to_id:
                            item['league_id'] = name_to_id[liga_name]
                    if 'tier' not in item or item['tier'] is None:
                        l_id = item.get('league_id')
                        if l_id is not None and int(l_id) in settings.API_FOOTBALL_LEAGUE_TIERS:
                            item['tier'] = settings.API_FOOTBALL_LEAGUE_TIERS[int(l_id)]
                        else:
                            liga_name = item.get('liga')
                            item['tier'] = name_to_tier.get(liga_name, 3)
            except Exception as e:
                print(f"Error al leer/saneamiento picks_history.json (fallback): {e}")

    dashboard_payload = {
        'last_updated': dt.datetime.now(dt.timezone(dt.timedelta(hours=-4))).strftime("%Y-%m-%d %H:%M:%S"),
        'leagues': leagues_data,
        'teams': teams_data,
        'backtest': backtest_data,
        'backtest_summary': backtest_summary,
        'picks': picks_data,
        'picks_history': picks_history,
        'league_recent_win_rates': league_recent_wr,
        'league_current_season_recent_rates': league_current_season_recent_wr
    }
    
    output_dir = os.path.join('data', 'picks')
    os.makedirs(output_dir, exist_ok=True)
    js_filepath = os.path.join(output_dir, 'dashboard_data.js')
    
    with open(js_filepath, 'w', encoding='utf-8') as f:
        f.write(f"window.dashboardData = {json.dumps(dashboard_payload, ensure_ascii=False, indent=2)};")
    print(f"Datos de dashboard en JS guardados en: {js_filepath}")

    # Subida automática a GitHub Pages si está habilitado
    # Se desactiva en el entorno de GitHub Actions para evitar conflictos de commits,
    # ya que allí usaremos Git tradicional para persistir todo (base de datos, caché parquet, etc.)
    if getattr(settings, 'GITHUB_ENABLED', False) and os.environ.get("GITHUB_ACTIONS") != "true":
        print("[GitHub] Sincronización automática a GitHub activada.")
        upload_file_to_github(js_filepath, 'data/picks/dashboard_data.js')
        local_html = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dashboard.html')
        upload_file_to_github(local_html, 'index.html')
        upload_file_to_github(os.path.join('data', 'picks', 'picks_history.json'), 'data/picks/picks_history.json')
        # Subir estado de Telegram enviado
        telegram_state = os.path.join('data', 'picks', 'telegram_sent_state.json')
        if os.path.exists(telegram_state):
            upload_file_to_github(telegram_state, 'data/picks/telegram_sent_state.json')

    # Ejecutar alertas de Telegram
    try:
        from src.scanner.telegram_notifier import run_telegram_notifications
        run_telegram_notifications()
    except Exception as e:
        print(f"[Telegram Notifier] Error al ejecutar alertas de Telegram: {e}")


if __name__ == "__main__":
    main()
