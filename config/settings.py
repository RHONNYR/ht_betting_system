"""
Configuración global del sistema de Backtesting HT 0.5+
"""

import os

# ==========================================
# PARÁMETROS DE ESTRATEGIA
# ==========================================
MIN_LEAGUE_HT_O5 = 0.75  # Filtro 1: Promedio histórico general de la liga >= 75%
MIN_LEAGUE_OVER_15 = 0.75  # Filtro principal: % de partidos de liga con FT 1.5+ >= 75%
MIN_TEAM_HT_O5 = 0.75    # Filtro 2: Índice individual del equipo (Local/Visitante) >= 75% en ultimos partidos
ROLLING_WINDOW = 10      # Ventana para calcular la forma reciente de los equipos (ej. últimos 10 partidos)

# Filtro 3: Oposición Cruzada
# Fórmula: (Equipo_A_Anota_HT% + Equipo_B_Concede_HT%) / 2 >= MIN_CROSS_OPPOSITION
MIN_CROSS_OPPOSITION = 0.70  # Umbral para la oposición cruzada

# Filtro 4: Valor (Cuotas)
MIN_ODDS = 1.35
MAX_ODDS = 1.80

# ==========================================
# PARÁMETROS FINANCIEROS (BANKROLL)
# ==========================================
INITIAL_BANKROLL = 1000.0
FLAT_STAKE_PCT = 0.02  # 2% de bank inicial por apuesta (Stake Fijo = 20 unidades)

# ==========================================
# PARÁMETROS DE DATOS LEGACY (football-data.co.uk)
# ==========================================
LEAGUES_TO_TEST = ['E0', 'SP1', 'I1', 'D1', 'F1']
SEASONS_TO_TEST = ['2122', '2223', '2324', '2425', '2526']  # Ligas principales hasta la temporada 25/26


# ==========================================
# CREDENCIALES DE API-FOOTBALL / API-SPORTS
# ==========================================
def clean_secret(val):
    if not val:
        return ""
    import re
    val_str = str(val).strip()
    ghp_match = re.search(r'(ghp_[a-zA-Z0-9]{36,40})', val_str)
    if ghp_match:
        return ghp_match.group(1)
    hex_match = re.search(r'\b([a-fA-F0-9]{32})\b', val_str)
    if hex_match:
        return hex_match.group(1)
    return "".join(c for c in val_str if c.isalnum() or c in ['-', '_'])

API_FOOTBALL_KEY = clean_secret(os.environ.get("API_FOOTBALL_KEY") or "e4efe9095c65d1f98870a6512b081874")
API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
DEFAULT_HT_O05_ODDS = 1.45

API_CURRENT_SEASON = 2025
API_FOOTBALL_TARGET_SEASONS = [2025]

# Ligas API-Football que alimentan histórico, temporada actual y fixtures.
# Las claves son nuestras claves internas/SoccerStats cuando existe cruce.
API_FOOTBALL_LEAGUE_TARGETS = {
    'england': {'api_id': 39, 'country': 'England', 'league_name': 'Premier League'},
    'england2': {'api_id': 40, 'country': 'England', 'league_name': 'Championship'},
    'england3': {'api_id': 41, 'country': 'England', 'league_name': 'League One'},
    'england15': {'api_id': 702, 'country': 'England', 'league_name': 'Premier League 2 Division One'},
    'spain': {'api_id': 140, 'country': 'Spain', 'league_name': 'La Liga'},
    'italy': {'api_id': 135, 'country': 'Italy', 'league_name': 'Serie A'},
    'france': {'api_id': 61, 'country': 'France', 'league_name': 'Ligue 1'},
    'portugal': {'api_id': 94, 'country': 'Portugal', 'league_name': 'Primeira Liga'},
    'brazil': {'api_id': 71, 'country': 'Brazil', 'league_name': 'Serie A'},
    'brazil2': {'api_id': 72, 'country': 'Brazil', 'league_name': 'Serie B'},
    'brazil3': {'api_id': 75, 'country': 'Brazil', 'league_name': 'Serie C'},
    'germany': {'api_id': 78, 'country': 'Germany', 'league_name': 'Bundesliga'},
    'germany2': {'api_id': 79, 'country': 'Germany', 'league_name': '2. Bundesliga'},
    'germany3': {'api_id': 80, 'country': 'Germany', 'league_name': '3. Liga'},
    'germany4': {'api_id': 84, 'country': 'Germany', 'league_name': 'Regionalliga Nord'},
    'germany6': {'api_id': 87, 'country': 'Germany', 'league_name': 'Regionalliga West'},
    'germany7': {'api_id': 86, 'country': 'Germany', 'league_name': 'Regionalliga SudWest'},
    'germany8': {'api_id': 83, 'country': 'Germany', 'league_name': 'Regionalliga Bayern'},
    'usa': {'api_id': 253, 'country': 'USA', 'league_name': 'Major League Soccer'},
    'usa2': {'api_id': 909, 'country': 'USA', 'league_name': 'MLS Next Pro'},
    'usa3': {'api_id': 489, 'country': 'USA', 'league_name': 'USL League One'},
    'netherlands': {'api_id': 88, 'country': 'Netherlands', 'league_name': 'Eredivisie'},
    'netherlands2': {'api_id': 89, 'country': 'Netherlands', 'league_name': 'Eerste Divisie'},
    'netherlands3': {'api_id': 492, 'country': 'Netherlands', 'league_name': 'Tweede Divisie'},
    'norway': {'api_id': 103, 'country': 'Norway', 'league_name': 'Eliteserien'},
    'norway2': {'api_id': 104, 'country': 'Norway', 'league_name': '1. Division'},
    'norway3': {'api_id': 473, 'country': 'Norway', 'league_name': '2. Division - Group 1'},
    'norway4': {'api_id': 474, 'country': 'Norway', 'league_name': '2. Division - Group 2'},
    'switzerland': {'api_id': 207, 'country': 'Switzerland', 'league_name': 'Super League'},
    'switzerland2': {'api_id': 208, 'country': 'Switzerland', 'league_name': 'Challenge League'},
    'iceland': {'api_id': 164, 'country': 'Iceland', 'league_name': 'Úrvalsdeild'},
    'iceland2': {'api_id': 165, 'country': 'Iceland', 'league_name': '1. Deild'},
    'iceland3': {'api_id': 166, 'country': 'Iceland', 'league_name': '2. Deild'},
    'estonia': {'api_id': 329, 'country': 'Estonia', 'league_name': 'Meistriliiga'},
    'estonia2': {'api_id': 328, 'country': 'Estonia', 'league_name': 'Esiliiga A'},
    'finland': {'api_id': 244, 'country': 'Finland', 'league_name': 'Veikkausliiga'},
    'finland2': {'api_id': 1087, 'country': 'Finland', 'league_name': 'Ykkösliiga'},
    'finland3': {'api_id': 245, 'country': 'Finland', 'league_name': 'Ykkönen'},
    'finland4': {'api_id': 247, 'country': 'Finland', 'league_name': 'Kakkonen - Lohko A'},
    'finland5': {'api_id': 248, 'country': 'Finland', 'league_name': 'Kakkonen - Lohko B'},
    'finland6': {'api_id': 249, 'country': 'Finland', 'league_name': 'Kakkonen - Lohko C'},
    'scotland': {'api_id': 179, 'country': 'Scotland', 'league_name': 'Premiership'},
    'scotland2': {'api_id': 180, 'country': 'Scotland', 'league_name': 'Championship'},
    'singapore': {'api_id': 368, 'country': 'Singapore', 'league_name': 'Premier League'},
    'sweden': {'api_id': 113, 'country': 'Sweden', 'league_name': 'Allsvenskan'},
    'sweden2': {'api_id': 114, 'country': 'Sweden', 'league_name': 'Superettan'},
    'sweden3': {'api_id': 563, 'country': 'Sweden', 'league_name': 'Ettan - Norra'},
    'sweden4': {'api_id': 564, 'country': 'Sweden', 'league_name': 'Ettan - Södra'},
    'denmark': {'api_id': 119, 'country': 'Denmark', 'league_name': 'Superliga'},
    'denmark2': {'api_id': 120, 'country': 'Denmark', 'league_name': '1. Division'},
}

# Niveles de Liquidez de Mercado (Categorización de Ligas)
# Tier 1: Alta (Fácil de apostar / Muchos mercados en vivo y pre-partido con límites altos)
# Tier 2: Media (Segundas divisiones sólidas, ligas principales nórdicas y suizas)
# Tier 3: Exótica / Baja (Ligas regionales, juveniles y mercados muy pequeños con límites bajos)
API_FOOTBALL_LEAGUE_TIERS = {
    39: 1,   # England Premier League
    40: 1,   # England Championship
    140: 1,  # Spain La Liga
    135: 1,  # Italy Serie A
    61: 1,   # France Ligue 1
    94: 1,   # Portugal Primeira Liga
    71: 1,   # Brazil Serie A
    78: 1,   # Germany Bundesliga
    79: 1,   # Germany 2. Bundesliga
    253: 1,  # USA MLS
    88: 1,   # Netherlands Eredivisie
    
    41: 2,   # England League One
    72: 2,   # Brazil Serie B
    80: 2,   # Germany 3. Liga
    89: 2,   # Netherlands Eerste Divisie
    103: 2,  # Norway Eliteserien
    104: 2,  # Norway 1. Division
    207: 2,  # Switzerland Super League
    208: 2,  # Switzerland Challenge League
    164: 2,  # Iceland Úrvalsdeild
    244: 2,  # Finland Veikkausliiga
    179: 2,  # Scotland Premiership
    180: 2,  # Scotland Championship
    113: 2,  # Sweden Allsvenskan
    114: 2,  # Sweden Superettan
    119: 2,  # Denmark Superliga
    120: 2,  # Denmark 1. Division
    
    702: 3,  # England Premier League 2 Division One
    75: 3,   # Brazil Serie C
    84: 3,   # Germany Regionalliga Nord
    87: 3,   # Germany Regionalliga West
    86: 3,   # Germany Regionalliga SudWest
    83: 3,   # Germany Regionalliga Bayern
    909: 3,  # USA MLS Next Pro
    489: 3,  # USA USL League One
    492: 3,  # Netherlands Tweede Divisie
    473: 3,  # Norway 2. Division Group 1
    474: 3,  # Norway 2. Division Group 2
    165: 3,  # Iceland 1. Deild
    166: 3,  # Iceland 2. Deild
    329: 3,  # Estonia Meistriliiga
    328: 3,  # Estonia Esiliiga A
    1087: 3, # Finland Ykkösliiga
    245: 3,  # Finland Ykkönen
    247: 3,  # Finland Kakkonen A
    248: 3,  # Finland Kakkonen B
    249: 3,  # Finland Kakkonen C
    368: 3,  # Singapore Premier League
    563: 3,  # Sweden Ettan Norra
    564: 3,  # Sweden Ettan Södra
}

API_LEAGUES = {
    str(info['api_id']): info['league_name']
    for info in API_FOOTBALL_LEAGUE_TARGETS.values()
}

API_FOOTBALL_TO_SOCCERSTATS_LEAGUE_MAP = {
    info['api_id']: league_key
    for league_key, info in API_FOOTBALL_LEAGUE_TARGETS.items()
}
FOOTBALL_DATA_TO_SOCCERSTATS_LEAGUE_MAP = API_FOOTBALL_TO_SOCCERSTATS_LEAGUE_MAP

# ==========================================
# CONFIG LEGACY FOOTYSTATS (no usada por el flujo actual)
# ==========================================
# Se conserva por compatibilidad con módulos antiguos. El flujo activo usa
# API_FOOTBALL_KEY y API_FOOTBALL_LEAGUE_TARGETS.
FOOTYSTATS_API_KEY = "e4efe9095c65d1f98870a6512b081874"
FOOTYSTATS_BASE_URL = "https://api.football-data-api.com"

# Temporadas por defecto para importar desde FootyStats. Puedes sobreescribirlas
# por CLI con --seasons cuando ejecutes el job de histórico.
FOOTYSTATS_TARGET_SEASONS = [2025]

# Mapeo entre nuestras claves de SoccerStats y las ligas de FootyStats. El cliente
# resuelve automáticamente el season_id con /league-list para cada año solicitado.
FOOTYSTATS_LEAGUE_TARGETS = {
    'denmark2': {'country': 'Denmark', 'league_name': '1st Division'},
    'england': {'country': 'England', 'league_name': 'Premier League'},
    'england3': {'country': 'England', 'league_name': 'EFL League One'},
    'england15': {'country': 'England', 'league_name': 'Premier League 2 Division One U23'},
    'germany': {'country': 'Germany', 'league_name': 'Bundesliga'},
    'germany2': {'country': 'Germany', 'league_name': '2. Bundesliga'},
    'germany4': {'country': 'Germany', 'league_name': 'Regionalliga Nord'},
    'germany6': {'country': 'Germany', 'league_name': 'Regionalliga West'},
    'germany7': {'country': 'Germany', 'league_name': 'Regionalliga Südwest'},
    'germany8': {'country': 'Germany', 'league_name': 'Regionalliga Bayern'},
    'usa': {'country': 'USA', 'league_name': 'MLS'},
    'usa2': {'country': 'USA', 'league_name': 'MLS Next Pro'},
    'netherlands': {'country': 'Netherlands', 'league_name': 'Eredivisie'},
    'netherlands2': {'country': 'Netherlands', 'league_name': 'Eerste Divisie'},
    'norway2': {'country': 'Norway', 'league_name': 'First Division'},
    'norway3': {'country': 'Norway', 'league_name': '2. Division'},
    'switzerland': {'country': 'Switzerland', 'league_name': 'Super League'},
    'switzerland2': {'country': 'Switzerland', 'league_name': 'Challenge League'},
    'iceland': {'country': 'Iceland', 'league_name': 'Úrvalsdeild'},
    'iceland2': {'country': 'Iceland', 'league_name': '1. Deild'},
    'estonia': {'country': 'Estonia', 'league_name': 'Meistriliiga'},
    'finland': {'country': 'Finland', 'league_name': 'Veikkausliiga'},
    'finland2': {'country': 'Finland', 'league_name': 'Ykkösliiga'},
    'finland4': {'country': 'Finland', 'league_name': 'Kakkonen', 'group_hint': 'A'},
    'finland5': {'country': 'Finland', 'league_name': 'Kakkonen', 'group_hint': 'B'},
    'finland6': {'country': 'Finland', 'league_name': 'Kakkonen', 'group_hint': 'C'},
    'scotland': {'country': 'Scotland', 'league_name': 'Premiership'},
    'singapore': {'country': 'Singapore', 'league_name': 'S.League'},
    'sweden': {'country': 'Sweden', 'league_name': 'Allsvenskan'},
}

# Ligas soportadas para el escrapeador SoccerStats (con XPaths y nombres personalizados)
SOCCERSTATS_LEAGUES = {
    'denmark2': {'name': 'Dinamarca - 1ra División', 'filename': 'Dinamarca_1raDiv_Stats.xlsx'},
    'england': {'name': 'Inglaterra - Premier League', 'filename': 'PremierLeague_Stats.xlsx'},
    'england3': {'name': 'Inglaterra - League One', 'filename': 'Ing_League_One_Stats.xlsx'},
    'england15': {'name': 'Inglaterra - Premier League Two', 'filename': 'Ing_Premier_League_Two_Stats.xlsx'},
    'germany': {'name': 'Alemania - Bundesliga', 'filename': 'Bundesliga_Stats.xlsx'},
    'germany2': {'name': 'Alemania - 2. Bundesliga', 'filename': 'Bundesliga_2_Stats.xlsx'},
    'germany4': {'name': 'Alemania - Reg. Nord', 'filename': 'Bundesliga_Reg_Nord_Stats.xlsx'},
    'germany6': {'name': 'Alemania - Reg. West', 'filename': 'Bundesliga_Reg_West_Stats.xlsx'},
    'germany7': {'name': 'Alemania - Reg. Südwest', 'filename': 'Bundesliga_Reg_Sudwest_Stats.xlsx'},
    'germany8': {'name': 'Alemania - Reg. Bayern', 'filename': 'Bundesliga_Reg_Bayern_Stats.xlsx'},
    'usa': {'name': 'EE.UU. - MLS', 'filename': 'MLS_Stats.xlsx'},
    'usa2': {'name': 'EE.UU. - MLS Next Pro (2da)', 'filename': 'MLS_2da_Div_Stats.xlsx'},
    'netherlands': {'name': 'Países Bajos - Eredivisie', 'filename': 'Holanda_Eredivisie_Stats.xlsx'},
    'netherlands2': {'name': 'Países Bajos - Eerste Divisie', 'filename': 'Holanda_Eerste_divisie_Stats.xlsx'},
    'norway2': {'name': 'Noruega - 1st Division', 'filename': 'Noruega_1st_Div_Stats.xlsx'},
    'norway3': {'name': 'Noruega - Division 2', 'filename': 'Noruega_Division_2_Stats.xlsx'},
    'switzerland': {'name': 'Suiza - Super League', 'filename': 'Suiza_Super_League_Stats.xlsx'},
    'switzerland2': {'name': 'Suiza - Challenge League', 'filename': 'Suiza_Challenge_League_Stats.xlsx'},
    'iceland': {'name': 'Islandia - Úrvalsdeild', 'filename': 'Iceland_Urvalsdeild_Stats.xlsx'},
    'iceland2': {'name': 'Islandia - 1. Deild', 'filename': 'Iceland_1_Stats.xlsx'},
    'estonia': {'name': 'Estonia - Meistriliiga', 'filename': 'Estonia_Meistriliiga_Stats.xlsx'},
    'finland': {'name': 'Finlandia - Veikkausliiga', 'filename': 'Finlandia_Veikkauslliiga_Stats.xlsx'},
    'finland2': {'name': 'Finlandia - Ykkösliiga', 'filename': 'Finlandia_Ykkosliga_Stats.xlsx'},
    'finland4': {'name': 'Finlandia - Kakkonen A', 'filename': 'Finlandia_Kakkonen_A_Stats.xlsx'},
    'finland5': {'name': 'Finlandia - Kakkonen B', 'filename': 'Finlandia_Kakkonen_B_Stats.xlsx'},
    'finland6': {'name': 'Finlandia - Kakkonen C', 'filename': 'Finlandia_Kakkonen_C_Stats.xlsx'},
    'scotland': {'name': 'Escocia - Premiership', 'filename': 'Escocia_Premiership_Stats.xlsx'},
    'singapore': {'name': 'Singapur - Premier League', 'filename': 'Singapur_Premier_League_Stats.xlsx'},
    'sweden': {'name': 'Suecia - Allsvenskan', 'filename': 'Suecia_Allsvenskan_Stats.xlsx'}
}

# ==========================================
# RUTAS DE ALMACENAMIENTO DE DATOS
# ==========================================
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
HISTORICAL_DATA_DIR = os.path.join(DATA_DIR, 'historical')
API_DATA_DIR = os.path.join(DATA_DIR, 'api')
SOCCERSTATS_DATA_DIR = os.path.join(DATA_DIR, 'soccerstats')
SOCCERSTATS_CONSOLIDATED_DIR = os.path.join(SOCCERSTATS_DATA_DIR, 'consolidated')
SOCCERSTATS_SNAPSHOT_DIR = SOCCERSTATS_CONSOLIDATED_DIR
FOOTYSTATS_DATA_DIR = os.path.join(DATA_DIR, 'footystats')
FOOTYSTATS_CACHE_DIR = os.path.join(FOOTYSTATS_DATA_DIR, 'cache')
FOOTYSTATS_EXPORT_DIR = os.path.join(FOOTYSTATS_DATA_DIR, 'exports')
API_FOOTBALL_DATA_DIR = os.path.join(DATA_DIR, 'api_football')
API_FOOTBALL_CACHE_DIR = os.path.join(API_FOOTBALL_DATA_DIR, 'cache')
API_FOOTBALL_EXPORT_DIR = os.path.join(API_FOOTBALL_DATA_DIR, 'exports')
HISTORICAL_MATCHES_DIR = os.path.join(DATA_DIR, 'historical_matches')
HISTORICAL_MATCHES_PATH = os.path.join(HISTORICAL_MATCHES_DIR, 'matches.csv')
DAILY_PICKS_DIR = os.path.join(DATA_DIR, 'picks')

# ==========================================
# CONFIGURACIÓN DE GITHUB PAGES (AUTO-UPLOAD)
# ==========================================
GITHUB_ENABLED = os.environ.get("GITHUB_ENABLED", "True").lower() == "true"
GITHUB_TOKEN = clean_secret(os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_TOKEN", ""))
GITHUB_REPO_OWNER = os.environ.get("GITHUB_REPO_OWNER", "rhonnyr").strip()
GITHUB_REPO_NAME = os.environ.get("GITHUB_REPO_NAME", "ht_betting_system").strip()

# ==========================================
# CONFIGURACIÓN DEL BOT DE TELEGRAM
# ==========================================
TELEGRAM_BOT_TOKEN = clean_secret(os.environ.get("TELEGRAM_BOT_TOKEN") or "TU_BOT_TOKEN_AQUI")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID") or "TU_CHAT_ID_AQUI"


