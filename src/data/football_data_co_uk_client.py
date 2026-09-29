import hashlib
import io
import os
import urllib.request
import pandas as pd
from datetime import datetime

# Mapeo de divisiones de football-data.co.uk a los IDs y nombres del sistema
DIV_TO_LEAGUE_INFO = {
    'E0': {'api_id': 39, 'league_name': 'Premier League', 'country': 'England', 'tier': 1},
    'E1': {'api_id': 40, 'league_name': 'Championship', 'country': 'England', 'tier': 1},
    'E2': {'api_id': 41, 'league_name': 'League One', 'country': 'England', 'tier': 2},
    'SP1': {'api_id': 140, 'league_name': 'La Liga', 'country': 'Spain', 'tier': 1},
    'D1': {'api_id': 78, 'league_name': 'Bundesliga', 'country': 'Germany', 'tier': 1},
    'D2': {'api_id': 79, 'league_name': '2. Bundesliga', 'country': 'Germany', 'tier': 2},
    'I1': {'api_id': 135, 'league_name': 'Serie A', 'country': 'Italy', 'tier': 1},
    'F1': {'api_id': 61, 'league_name': 'Ligue 1', 'country': 'France', 'tier': 1},
    'N1': {'api_id': 88, 'league_name': 'Eredivisie', 'country': 'Netherlands', 'tier': 1},
    'P1': {'api_id': 94, 'league_name': 'Primeira Liga', 'country': 'Portugal', 'tier': 1},
    'SC0': {'api_id': 179, 'league_name': 'Premiership', 'country': 'Scotland', 'tier': 2},
    'B1': {'api_id': 144, 'league_name': 'Jupiler Pro League', 'country': 'Belgium', 'tier': 2},
    'EC': {'api_id': 43, 'league_name': 'National League', 'country': 'England', 'tier': 3},
}

API_ID_TO_DIV = {info['api_id']: div for div, info in DIV_TO_LEAGUE_INFO.items()}


def get_season_code(season_year: int) -> str:
    """Convierte el año 2026 en '2627', 2025 en '2526', 2024 en '2425'."""
    y = season_year % 100
    next_y = (y + 1) % 100
    return f"{y:02d}{next_y:02d}"


def fetch_football_data_season(div_code: str, season_year: int) -> pd.DataFrame:
    """
    Descarga y estandariza los partidos de una liga y temporada desde football-data.co.uk.
    """
    if div_code not in DIV_TO_LEAGUE_INFO:
        return pd.DataFrame()

    season_code = get_season_code(season_year)
    url = f"https://www.football-data.co.uk/mmz4281/{season_code}/{div_code}.csv"
    info = DIV_TO_LEAGUE_INFO[div_code]
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=12) as resp:
            if resp.getcode() != 200:
                return pd.DataFrame()
            content = resp.read().decode('utf-8', errors='ignore')
            df_raw = pd.read_csv(io.StringIO(content), on_bad_lines='skip')
    except Exception as e:
        # Silenciar si no existe aún esa temporada
        return pd.DataFrame()

    rows = []
    for _, r in df_raw.iterrows():
        home_team = str(r.get('HomeTeam', '')).strip()
        away_team = str(r.get('AwayTeam', '')).strip()
        if not home_team or not away_team or pd.isna(r.get('HomeTeam')) or pd.isna(r.get('AwayTeam')):
            continue

        # Generar match_id determinista único
        m_id_str = f"{season_year}_{info['api_id']}_{home_team}_{away_team}"
        match_id = int(hashlib.md5(m_id_str.encode('utf-8')).hexdigest()[:8], 16)

        # Formatear fecha y hora
        d_str = str(r.get('Date', '')).strip()
        t_str = str(r.get('Time', '15:00')).strip() if pd.notna(r.get('Time')) else '15:00'
        if len(t_str) == 5:
            t_str = f"{t_str}:00"
        elif len(t_str) == 4 and ':' in t_str:
            t_str = f"0{t_str}:00"

        try:
            # football-data usa DD/MM/YYYY o DD/MM/YY
            dt = pd.to_datetime(f"{d_str} {t_str[:5]}", format='%d/%m/%Y %H:%M')
            date_iso = dt.strftime('%Y-%m-%dT%H:%M:00+00:00')
        except Exception:
            try:
                dt = pd.to_datetime(f"{d_str} {t_str[:5]}", format='%d/%m/%y %H:%M')
                date_iso = dt.strftime('%Y-%m-%dT%H:%M:00+00:00')
            except Exception:
                date_iso = f"{season_year}-09-01T15:00:00+00:00"

        h_id = int(hashlib.md5(home_team.encode('utf-8')).hexdigest()[:6], 16)
        a_id = int(hashlib.md5(away_team.encode('utf-8')).hexdigest()[:6], 16)

        ht_home = int(r.get('HTHG', 0)) if pd.notna(r.get('HTHG')) else 0
        ht_away = int(r.get('HTAG', 0)) if pd.notna(r.get('HTAG')) else 0
        ft_home = int(r.get('FTHG', 0)) if pd.notna(r.get('FTHG')) else 0
        ft_away = int(r.get('FTAG', 0)) if pd.notna(r.get('FTAG')) else 0

        rows.append({
            'match_id': match_id,
            'date': date_iso,
            'status': 'FT',
            'league_id': info['api_id'],
            'league_name': info['league_name'],
            'season': season_year,
            'home_team_id': h_id,
            'home_team_name': home_team,
            'away_team_id': a_id,
            'away_team_name': away_team,
            'ht_home_goals': ht_home,
            'ht_away_goals': ht_away,
            'ft_home_goals': ft_home,
            'ft_away_goals': ft_away,
            'cuota_cierre': float(r.get('Avg>2.5', 1.45)) if pd.notna(r.get('Avg>2.5')) else 1.45,
            'bookmaker_cierre': 'Bet365' if pd.notna(r.get('B365>2.5')) else 'Promedio'
        })

    return pd.DataFrame(rows)


def fetch_upcoming_fixtures_from_football_data() -> pd.DataFrame:
    """
    Descarga y formatea los próximos partidos desde fixtures.csv de football-data.co.uk.
    """
    url = "https://www.football-data.co.uk/fixtures.csv"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=12) as resp:
            if resp.getcode() != 200:
                return pd.DataFrame()
            content = resp.read().decode('utf-8', errors='ignore')
            df_raw = pd.read_csv(io.StringIO(content), on_bad_lines='skip')
    except Exception as e:
        print(f"[FootballData] Error al descargar fixtures.csv: {e}")
        return pd.DataFrame()

    rows = []
    season_year = datetime.now().year

    for _, r in df_raw.iterrows():
        div = str(r.get('Div', '')).strip()
        info = DIV_TO_LEAGUE_INFO.get(div)
        if not info:
            continue

        home_team = str(r.get('HomeTeam', '')).strip()
        away_team = str(r.get('AwayTeam', '')).strip()
        if not home_team or not away_team:
            continue

        m_id_str = f"{season_year}_{info['api_id']}_{home_team}_{away_team}"
        match_id = int(hashlib.md5(m_id_str.encode('utf-8')).hexdigest()[:8], 16)

        d_str = str(r.get('Date', '')).strip()
        t_str = str(r.get('Time', '15:00')).strip() if pd.notna(r.get('Time')) else '15:00'

        try:
            dt = pd.to_datetime(f"{d_str} {t_str[:5]}", format='%d/%m/%Y %H:%M')
            date_iso = dt.strftime('%Y-%m-%dT%H:%M:00+00:00')
        except Exception:
            try:
                dt = pd.to_datetime(f"{d_str} {t_str[:5]}", format='%d/%m/%y %H:%M')
                date_iso = dt.strftime('%Y-%m-%dT%H:%M:00+00:00')
            except Exception:
                continue

        h_id = int(hashlib.md5(home_team.encode('utf-8')).hexdigest()[:6], 16)
        a_id = int(hashlib.md5(away_team.encode('utf-8')).hexdigest()[:6], 16)

        # Determinar cuota estimada para HT Over 0.5
        # Si el partido tiene cuota Over 2.5 (ej: 1.65), HT Over 0.5 suele rondar entre 1.30 y 1.45
        b365_o25 = r.get('B365>2.5')
        avg_o25 = r.get('Avg>2.5')
        
        cuota_ht = 1.45
        bookmaker = 'Bet365'
        if pd.notna(b365_o25):
            try:
                val = float(b365_o25)
                # Estimación cuantitativa de cuota HT Over 0.5 en base a Over 2.5
                cuota_ht = round(max(1.15, min(1.60, 1.0 + (val - 1.0) * 0.45)), 2)
            except Exception:
                cuota_ht = 1.45
        elif pd.notna(avg_o25):
            try:
                val = float(avg_o25)
                cuota_ht = round(max(1.15, min(1.60, 1.0 + (val - 1.0) * 0.45)), 2)
                bookmaker = 'Mercado Promedio'
            except Exception:
                cuota_ht = 1.45

        rows.append({
            'match_id': match_id,
            'date': date_iso,
            'status': 'NS',
            'league_id': info['api_id'],
            'league_name': info['league_name'],
            'season': season_year,
            'home_team_id': h_id,
            'home_team_name': home_team,
            'away_team_id': a_id,
            'away_team_name': away_team,
            'ht_home_goals': None,
            'ht_away_goals': None,
            'ft_home_goals': None,
            'ft_away_goals': None,
            'cuota_cierre': cuota_ht,
            'bookmaker_cierre': bookmaker,
            'otras_cuotas_cierre': f'{{"{bookmaker}": {cuota_ht}}}'
        })

    return pd.DataFrame(rows)
