import pandas as pd
import numpy as np

def _calculate_bankroll_evolution(backtest_rows):
    df_res = pd.DataFrame(backtest_rows)
    if not df_res.empty:
        # Sort chronologically by date
        df_res = df_res.sort_values(by='Fecha').reset_index(drop=True)
        
        # Calculate bankroll evolution
        from config import settings
        initial_bank = settings.INITIAL_BANKROLL
        flat_stake_pct = settings.FLAT_STAKE_PCT
        
        bank_flat = initial_bank
        bank_compound = initial_bank
        
        flat_stakes = []
        flat_profits = []
        flat_banks = []
        
        comp_stakes = []
        comp_profits = []
        comp_banks = []
        
        for idx, r in df_res.iterrows():
            c_val = r['Cuota']
            is_win = r['Resultado'] == 'GANADA'
            
            # 1. Flat Stake
            stk_flat = initial_bank * flat_stake_pct
            pft_flat = stk_flat * (c_val - 1.0) if is_win else -stk_flat
            bank_flat += pft_flat
            
            flat_stakes.append(round(stk_flat, 2))
            flat_profits.append(round(pft_flat, 2))
            flat_banks.append(round(bank_flat, 2))
            
            # 2. Compound Stake
            stk_comp = bank_compound * flat_stake_pct
            pft_comp = stk_comp * (c_val - 1.0) if is_win else -stk_comp
            bank_compound += pft_comp
            
            comp_stakes.append(round(stk_comp, 2))
            comp_profits.append(round(pft_comp, 2))
            comp_banks.append(round(bank_compound, 2))
            
        df_res['Stake Fijo'] = flat_stakes
        df_res['Beneficio Fijo'] = flat_profits
        df_res['Banca Fijo'] = flat_banks
        
        df_res['Stake Compuesto'] = comp_stakes
        df_res['Beneficio Compuesto'] = comp_profits
        df_res['Banca Compuesto'] = comp_banks
        
    return df_res

def filter_phase_1_leagues(fixtures_df, seasons_to_evaluate):
    """
    Fase 1: Selección de Ligas (Nivel Torneo).
    Evalúa si la liga cumple simultáneamente en cada temporada:
    - Over 1.5 goles totales (FT) >= 80%
    - Over 2.5 goles totales (FT) >= 60%
    """
    print("Ejecutando Filtro Fase 1 (Ligas)...")
    
    # Calcular partidos jugados y restantes antes de filtrar por FT
    match_counts = fixtures_df.groupby(['league_id', 'season']).agg(
        partidos_jugados=('status', lambda s: s.isin(['FT', 'AET', 'PEN']).sum()),
        partidos_restantes=('status', lambda s: s.isin(['NS', 'TBD', 'PST']).sum())
    ).reset_index()
    
    # Nos quedamos con partidos finalizados
    df_ft = fixtures_df[fixtures_df['status'] == 'FT'].copy()
    if df_ft.empty:
        return pd.DataFrame(), []
        
    df_ft['ft_total_goals'] = df_ft['ft_home_goals'] + df_ft['ft_away_goals']
    df_ft['over_15'] = (df_ft['ft_total_goals'] > 1.5).astype(int)
    df_ft['over_25'] = (df_ft['ft_total_goals'] > 2.5).astype(int)
    
    league_results = []
    
    # Agrupar por liga y temporada
    grouped = df_ft.groupby(['league_id', 'league_name', 'season'])
    stats = grouped.agg(
        total_matches=('match_id', 'count'),
        over_15_pct=('over_15', 'mean'),
        over_25_pct=('over_25', 'mean')
    ).reset_index()
    
    # Encontrar qué ligas cumplen los criterios en TODAS las temporadas solicitadas
    approved_leagues = []
    unique_leagues = stats['league_id'].unique()
    
    for lid in unique_leagues:
        league_stats = stats[stats['league_id'] == lid]
        
        # Obtener las temporadas a evaluar para esta liga específica
        if isinstance(seasons_to_evaluate, dict):
            # Buscar por entero y por string de id
            league_seasons = [seasons_to_evaluate.get(lid, seasons_to_evaluate.get(str(lid), 2025))]
        else:
            league_seasons = seasons_to_evaluate
            
        meets_all = True
        seasons_checked = 0
        for s in league_seasons:
            s_stat = league_stats[league_stats['season'] == s]
            if s_stat.empty:
                continue
            seasons_checked += 1
            o15 = s_stat['over_15_pct'].values[0]
            o25 = s_stat['over_25_pct'].values[0]
            if o15 < 0.80 or o25 < 0.60:
                meets_all = False
                break
                
        if meets_all and seasons_checked > 0:
            approved_leagues.append(lid)
            
    # Filtrar el reporte para que solo muestre las temporadas evaluadas
    if isinstance(seasons_to_evaluate, dict):
        filtered_stats = []
        for lid in unique_leagues:
            target_season = seasons_to_evaluate.get(lid, seasons_to_evaluate.get(str(lid), 2025))
            league_rows = stats[(stats['league_id'] == lid) & (stats['season'] == target_season)]
            if not league_rows.empty:
                filtered_stats.append(league_rows)
        stats = pd.concat(filtered_stats, ignore_index=True) if filtered_stats else pd.DataFrame()
    else:
        stats = stats[stats['season'].isin(seasons_to_evaluate)].copy()
    
    # Unir los conteos de partidos
    if not stats.empty and not match_counts.empty:
        stats = pd.merge(stats, match_counts, on=['league_id', 'season'], how='left')
        stats['partidos_jugados'] = stats['partidos_jugados'].fillna(0).astype(int)
        stats['partidos_restantes'] = stats['partidos_restantes'].fillna(0).astype(int)
        
    # Marcar estado para reporte
    if not stats.empty:
        stats['passed'] = stats['league_id'].isin(approved_leagues)
    
    return stats, approved_leagues

def calculate_team_metrics(fixtures_df, season_year, approved_league_ids):
    """
    Fase 2: Selección de Equipos (Nivel Club en Primera Mitad / HT).
    Calcula métricas detalladas para locales y visitantes en la temporada actual.
    """
    # Si season_year es un diccionario, filtramos dinámicamente por liga y su temporada correspondiente
    if isinstance(season_year, dict):
        df_list = []
        for lid in approved_league_ids:
            s_year = season_year.get(lid, season_year.get(str(lid), 2025))
            df_league = fixtures_df[
                (fixtures_df['status'] == 'FT') & 
                (fixtures_df['season'] == s_year) & 
                (fixtures_df['league_id'] == lid)
            ]
            df_list.append(df_league)
        df_ft = pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()
        df_ft = df_ft.copy()
    else:
        df_ft = fixtures_df[
            (fixtures_df['status'] == 'FT') & 
            (fixtures_df['season'] == season_year) & 
            (fixtures_df['league_id'].isin(approved_league_ids))
        ].copy()
    
    if df_ft.empty:
        return pd.DataFrame(), pd.DataFrame()
        
    df_ft['ht_total_goals'] = df_ft['ht_home_goals'] + df_ft['ht_away_goals']
    df_ft['ft_total_goals'] = df_ft['ft_home_goals'] + df_ft['ft_away_goals']
    
    # Indicadores
    df_ft['ht_05_hit'] = (df_ft['ht_total_goals'] > 0).astype(int)
    df_ft['ht_15_hit'] = (df_ft['ht_total_goals'] >= 2).astype(int)
    df_ft['bts_hit'] = ((df_ft['ft_home_goals'] > 0) & (df_ft['ft_away_goals'] > 0)).astype(int)
    
    # Crear listado de equipos por liga
    unique_teams_in_leagues = []
    grouped_leagues = df_ft.groupby('league_id')
    
    local_candidates_list = []
    away_candidates_list = []
    
    for lid, league_matches in grouped_leagues:
        league_name = league_matches['league_name'].values[0]
        teams = pd.concat([league_matches['home_team_name'], league_matches['away_team_name']]).unique()
        
        for team in teams:
            # Historial completo del equipo (general) ordenado por fecha
            t_general = league_matches[(league_matches['home_team_name'] == team) | (league_matches['away_team_name'] == team)].sort_values('date')
            if len(t_general) < 5:
                continue
            
            # Racha reciente HT: En los últimos 5 partidos jugados en general,
            # ¿en cuántos anotó o encajó al menos un gol en la primera mitad?
            t_recent = t_general.tail(5)
            racha_ht = (t_recent['ht_total_goals'] > 0).sum()
            
            # Detección de sequía HT: ¿los últimos 2 partidos jugados terminaron 0-0 al descanso?
            t_last_2 = t_general.tail(2)
            sequia_ht = len(t_last_2) >= 2 and (t_last_2['ht_total_goals'] == 0).all()
            
            # Detalles de la racha de 5 partidos
            racha_detalles = []
            for _, r_match in t_recent.iterrows():
                is_home = r_match['home_team_name'] == team
                scored = r_match['ht_home_goals'] if is_home else r_match['ht_away_goals']
                conceded = r_match['ht_away_goals'] if is_home else r_match['ht_home_goals']
                racha_detalles.append({
                    'fecha': str(r_match['date'])[:10] if pd.notna(r_match['date']) else '',
                    'rival': r_match['away_team_name'] if is_home else r_match['home_team_name'],
                    'goles_favor_ht': int(scored) if pd.notna(scored) else 0,
                    'goles_contra_ht': int(conceded) if pd.notna(conceded) else 0,
                    'total_ht': int(r_match['ht_total_goals']) if pd.notna(r_match['ht_total_goals']) else 0,
                    'local': bool(is_home)
                })
            
            # Goles anotados en HT en general
            t_general['team_ht_goals'] = t_general.apply(
                lambda r: r['ht_home_goals'] if r['home_team_name'] == team else r['ht_away_goals'], axis=1
            )
            general_avg_ht_goals = t_general['team_ht_goals'].mean()
            
            # Historial como LOCAL
            t_home = league_matches[league_matches['home_team_name'] == team]
            if len(t_home) > 0:
                home_ht_05_pct = t_home['ht_05_hit'].mean()
                home_ht_15_pct = t_home['ht_15_hit'].mean()
                home_bts_pct = t_home['bts_hit'].mean()
                
                # Rendimiento Local HT: Promedio de partidos anotando y encajando en HT
                home_scored_ht_pct = (t_home['ht_home_goals'] > 0).mean()
                home_conceded_ht_pct = (t_home['ht_away_goals'] > 0).mean()
                home_rendimiento_ht = (home_scored_ht_pct + home_conceded_ht_pct) / 2
                
                # Media goles local HT
                home_avg_goals_ht = t_home['ht_home_goals'].mean()
                
                # Filtros Locales
                is_local_candidate = (
                    home_ht_05_pct >= 0.75 and
                    home_ht_15_pct >= 0.40 and
                    home_bts_pct >= 0.40 and
                    home_rendimiento_ht >= 0.50 and
                    general_avg_ht_goals >= 0.80 and
                    home_avg_goals_ht >= 0.80 and
                    racha_ht >= 4
                )
                
                local_candidates_list.append({
                    'league_id': lid,
                    'league_name': league_name,
                    'team_name': team,
                    'role': 'Local',
                    'ht_05_pct': home_ht_05_pct,
                    'ht_15_pct': home_ht_15_pct,
                    'bts_pct': home_bts_pct,
                    'rendimiento_ht': home_rendimiento_ht,
                    'avg_goals_ht_general': general_avg_ht_goals,
                    'avg_goals_ht_rol': home_avg_goals_ht,
                    'racha_ht': f"{racha_ht}/5",
                    'racha_detalles': racha_detalles,
                    'sequia_ht': bool(sequia_ht),
                    'is_candidate': is_local_candidate
                })
                
            # Historial como VISITANTE
            t_away = league_matches[league_matches['away_team_name'] == team]
            if len(t_away) > 0:
                away_ht_05_pct = t_away['ht_05_hit'].mean()
                away_ht_15_pct = t_away['ht_15_hit'].mean()
                away_bts_pct = t_away['bts_hit'].mean()
                
                # Rendimiento Visitante HT: Promedio de partidos anotando y encajando en HT
                away_scored_ht_pct = (t_away['ht_away_goals'] > 0).mean()
                away_conceded_ht_pct = (t_away['ht_home_goals'] > 0).mean()
                away_rendimiento_ht = (away_scored_ht_pct + away_conceded_ht_pct) / 2
                
                # Media goles visitante HT
                away_avg_goals_ht = t_away['ht_away_goals'].mean()
                
                # Filtros Visitantes
                is_away_candidate = (
                    away_ht_05_pct >= 0.75 and
                    away_ht_15_pct >= 0.40 and
                    away_bts_pct >= 0.40 and
                    away_rendimiento_ht >= 0.50 and
                    general_avg_ht_goals >= 0.80 and
                    away_avg_goals_ht >= 0.80 and
                    racha_ht >= 4
                )
                
                away_candidates_list.append({
                    'league_id': lid,
                    'league_name': league_name,
                    'team_name': team,
                    'role': 'Visitante',
                    'ht_05_pct': away_ht_05_pct,
                    'ht_15_pct': away_ht_15_pct,
                    'bts_pct': away_bts_pct,
                    'rendimiento_ht': away_rendimiento_ht,
                    'avg_goals_ht_general': general_avg_ht_goals,
                    'avg_goals_ht_rol': away_avg_goals_ht,
                    'racha_ht': f"{racha_ht}/5",
                    'racha_detalles': racha_detalles,
                    'sequia_ht': bool(sequia_ht),
                    'is_candidate': is_away_candidate
                })
                
    df_local = pd.DataFrame(local_candidates_list)
    df_away = pd.DataFrame(away_candidates_list)
    
    return df_local, df_away

def run_backtest_simulation(fixtures_df, league_current_season_map):
    """
    Ejecuta el backtesting para las últimas N temporadas.
    Para cada temporada, calcula candidatos y cruza enfrentamientos relativas a la temporada actual de cada liga.
    """
    # Si league_current_season_map no es un diccionario, hacer fallback a la lógica antigua
    if not isinstance(league_current_season_map, dict):
        seasons_to_backtest = league_current_season_map
        print(f"Iniciando simulación de backtesting para temporadas fijas: {seasons_to_backtest}...")
        backtest_rows = []
        for season in seasons_to_backtest:
            seasons_for_phase1 = [season]
            _, approved_lids = filter_phase_1_leagues(fixtures_df, seasons_for_phase1)
            if not approved_lids:
                continue
            df_local, df_away = calculate_team_metrics(fixtures_df, season, approved_lids)
            if df_local.empty or df_away.empty:
                continue
            local_candidates = set(df_local[df_local['is_candidate'] == True]['team_name'])
            away_candidates = set(df_away[df_away['is_candidate'] == True]['team_name'])
            df_season_ft = fixtures_df[
                (fixtures_df['status'] == 'FT') & 
                (fixtures_df['season'] == season) & 
                (fixtures_df['league_id'].isin(approved_lids))
            ].copy()
            for _, match in df_season_ft.iterrows():
                home = match['home_team_name']
                away = match['away_team_name']
                
                matched = False
                clase = ""
                sustento = ""
                if home in local_candidates and away in away_candidates:
                    matched = True
                    clase = "Clase A"
                    sustento = "Ambos"
                elif home in local_candidates:
                    matched = True
                    clase = "Clase B"
                    sustento = "Local"
                elif away in away_candidates:
                    matched = True
                    clase = "Clase B"
                    sustento = "Visitante"
                
                if matched:
                    ht_goals = match['ht_home_goals'] + match['ht_away_goals']
                    result = "GANADA" if ht_goals > 0 else "PERDIDA"
                    date_parsed = match['date']
                    if isinstance(date_parsed, str):
                        try:
                            date_parsed = pd.to_datetime(date_parsed).strftime("%Y-%m-%d")
                        except:
                            pass
                    elif hasattr(date_parsed, 'strftime'):
                        date_parsed = date_parsed.strftime("%Y-%m-%d")
                    cuota_val = float(match.get('cuota_cierre')) if pd.notna(match.get('cuota_cierre')) else 1.45
                    bookmaker_val = match.get('bookmaker_cierre') if pd.notna(match.get('bookmaker_cierre')) else 'Por determinar'
                    backtest_rows.append({
                        'Fecha': date_parsed,
                        'Liga': match['league_name'],
                        'Local': home,
                        'Visitante': away,
                        'Goles HT': ht_goals,
                        'Resultado': result,
                        'Clase': clase,
                        'Sustento': sustento,
                        'Cuota': cuota_val,
                        'Bookmaker': bookmaker_val
                    })
        return _calculate_bankroll_evolution(backtest_rows)

    print("Iniciando simulación de backtesting dinámica (últimas 2 temporadas por liga)...")
    backtest_rows = []
    
    # Queremos simular las últimas 2 temporadas relativas para cada liga
    for offset in [1, 2]:
        season_map_for_offset = {}
        for lid, curr_s in league_current_season_map.items():
            season_map_for_offset[lid] = curr_s - offset
            
        # 1. Filtrar ligas que pasaron el filtro Fase 1 para la temporada correspondiente a este offset
        _, approved_lids = filter_phase_1_leagues(fixtures_df, season_map_for_offset)
        
        if not approved_lids:
            continue
            
        # 2. Calcular los equipos candidatos en esa temporada
        df_local, df_away = calculate_team_metrics(fixtures_df, season_map_for_offset, approved_lids)
        if df_local.empty or df_away.empty:
            continue
            
        local_candidates = set(df_local[df_local['is_candidate'] == True]['team_name'])
        away_candidates = set(df_away[df_away['is_candidate'] == True]['team_name'])
        
        # 3. Filtrar partidos de esa temporada donde se cruzan Local o Visitante candidatos
        df_list = []
        for lid in approved_lids:
            target_season = league_current_season_map.get(lid, 2025) - offset
            df_league_matches = fixtures_df[
                (fixtures_df['status'] == 'FT') & 
                (fixtures_df['season'] == target_season) & 
                (fixtures_df['league_id'] == lid)
            ]
            df_list.append(df_league_matches)
            
        df_season_ft = pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()
        if df_season_ft.empty:
            continue
            
        for _, match in df_season_ft.iterrows():
            home = match['home_team_name']
            away = match['away_team_name']
            
            matched = False
            clase = ""
            sustento = ""
            if home in local_candidates and away in away_candidates:
                matched = True
                clase = "Clase A"
                sustento = "Ambos"
            elif home in local_candidates:
                matched = True
                clase = "Clase B"
                sustento = "Local"
            elif away in away_candidates:
                matched = True
                clase = "Clase B"
                sustento = "Visitante"
                
            if matched:
                ht_goals = match['ht_home_goals'] + match['ht_away_goals']
                result = "GANADA" if ht_goals > 0 else "PERDIDA"
                
                date_parsed = match['date']
                if isinstance(date_parsed, str):
                    try:
                        date_parsed = pd.to_datetime(date_parsed).strftime("%Y-%m-%d")
                    except:
                        pass
                elif hasattr(date_parsed, 'strftime'):
                    date_parsed = date_parsed.strftime("%Y-%m-%d")
                
                cuota_val = float(match.get('cuota_cierre')) if pd.notna(match.get('cuota_cierre')) else 1.45
                bookmaker_val = match.get('bookmaker_cierre') if pd.notna(match.get('bookmaker_cierre')) else 'Por determinar'
                backtest_rows.append({
                    'Fecha': date_parsed,
                    'Liga': match['league_name'],
                    'Local': home,
                    'Visitante': away,
                    'Goles HT': ht_goals,
                    'Resultado': result,
                    'Clase': clase,
                    'Sustento': sustento,
                    'Cuota': cuota_val,
                    'Bookmaker': bookmaker_val
                })
                
    return _calculate_bankroll_evolution(backtest_rows)

def find_today_picks(upcoming_fixtures_df, df_local_candidates, df_away_candidates):
    """
    Encuentra los picks de los próximos días buscando coincidencias de candidatos.
    """
    print("Buscando partidos candidatos para los próximos 7 días...")
    if upcoming_fixtures_df.empty:
        return pd.DataFrame()
        
    local_candidates = df_local_candidates[df_local_candidates['is_candidate'] == True]
    away_candidates = df_away_candidates[df_away_candidates['is_candidate'] == True]
    
    local_names = set(local_candidates['team_name'])
    away_names = set(away_candidates['team_name'])
    
    picks = []
    for _, match in upcoming_fixtures_df.iterrows():
        home = match['home_team_name']
        away = match['away_team_name']
        
        matched = False
        clase = ""
        sustento = ""
        combined_prob = 0.0
        
        if home in local_names and away in away_names:
            matched = True
            clase = "Clase A"
            sustento = "Ambos"
            lh_pct = local_candidates[local_candidates['team_name'] == home]['ht_05_pct'].values[0]
            aw_pct = away_candidates[away_candidates['team_name'] == away]['ht_05_pct'].values[0]
            combined_prob = (lh_pct + aw_pct) / 2
        elif home in local_names:
            matched = True
            clase = "Clase B"
            sustento = "Local"
            lh_pct = local_candidates[local_candidates['team_name'] == home]['ht_05_pct'].values[0]
            combined_prob = lh_pct
        elif away in away_names:
            matched = True
            clase = "Clase B"
            sustento = "Visitante"
            aw_pct = away_candidates[away_candidates['team_name'] == away]['ht_05_pct'].values[0]
            combined_prob = aw_pct
            
        if matched:
            date_parsed = match['date']
            date_str = "N/A"
            time_str = "N/A"
            if isinstance(date_parsed, str):
                try:
                    dt_val = pd.to_datetime(date_parsed)
                    date_str = dt_val.strftime("%Y-%m-%d")
                    time_str = dt_val.strftime("%H:%M")
                except:
                    pass
            elif hasattr(date_parsed, 'strftime'):
                date_str = date_parsed.strftime("%Y-%m-%d")
                time_str = date_parsed.strftime("%H:%M")
                
            picks.append({
                'match_id': int(match['match_id']),
                'league_id': int(match['league_id']),
                'Fecha': date_str,
                'Hora': time_str,
                'Liga': match['league_name'],
                'Local': home,
                'Visitante': away,
                'Probabilidad HT 0.5+ Combinada': f"{combined_prob * 100:.1f}%",
                'Clase': clase,
                'Sustento': sustento
            })
            
    df_picks = pd.DataFrame(picks)
    if not df_picks.empty:
        df_picks = df_picks.sort_values(by=['Fecha', 'Hora', 'Clase']).reset_index(drop=True)
    return df_picks
