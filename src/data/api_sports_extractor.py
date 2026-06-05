import os
import time
import json
import pandas as pd
from config import settings
from src.data.api_football_client import ApiFootballClient

class ApiSportsExtractor:
    def __init__(self):
        self.client = ApiFootballClient()
        self.db_dir = os.path.join('data', 'db_historico')
        os.makedirs(self.db_dir, exist_ok=True)
        self.current_season = getattr(settings, 'API_CURRENT_SEASON', 2025)
        self.ttl_seconds = 7 * 24 * 3600  # 7 días en segundos

    def get_current_season(self, league_id):
        """
        Obtiene la temporada activa/actual para una liga específica desde la API-Sports
        y la guarda en una caché local para evitar llamadas excesivas.
        """
        cache_file = os.path.join(self.db_dir, "active_seasons.json")
        seasons_cache = {}
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    seasons_cache = json.load(f)
            except Exception as e:
                print(f"Error al leer active_seasons.json: {e}")
        
        # Si la liga está en caché y tiene menos de 7 días, usarla
        if str(league_id) in seasons_cache:
            cache_data = seasons_cache[str(league_id)]
            cache_time = cache_data.get('timestamp', 0)
            if time.time() - cache_time < 7 * 24 * 3600:
                return cache_data['year']
                
        # Si no está en caché o expiró, consultar la API
        print(f"Consultando temporada actual de API para liga ID {league_id}...")
        try:
            payload = self.client.fetch_leagues(id=int(league_id))
            if payload:
                current_years = [s['year'] for s in payload[0]['seasons'] if s['current']]
                if current_years:
                    current_year = current_years[0]
                    # Guardar en caché
                    seasons_cache[str(league_id)] = {
                        'year': current_year,
                        'timestamp': time.time()
                    }
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        json.dump(seasons_cache, f, indent=4)
                    print(f"Liga ID {league_id} temporada actual resuelta: {current_year}")
                    return current_year
        except Exception as e:
            print(f"Error al obtener temporada activa de API para liga {league_id}: {e}")
            
        # Fallback si falla
        return self.current_season

    def get_fixtures_for_season(self, league_id, season_year):
        """
        Descarga todos los partidos para una liga y temporada específica,
        utilizando una base de datos local como caché inteligente.
        """
        cache_file = os.path.join(self.db_dir, f"fixtures_{league_id}_{season_year}.parquet")
        
        # Determinar si cargamos desde la base de datos local
        use_db = False
        if os.path.exists(cache_file):
            if season_year < self.current_season:
                # Las temporadas pasadas nunca cambian
                use_db = True
                print(f"Cargando liga ID {league_id} temporada {season_year} desde la Base de Datos Local (Histórico Permanente)...")
            else:
                # Temporada actual: actualizar cada 12 horas (12 * 3600 segundos)
                current_season_ttl = 12 * 3600
                file_age = time.time() - os.path.getmtime(cache_file)
                if file_age < current_season_ttl:
                    use_db = True
                    horas_restantes = (current_season_ttl - file_age) / 3600
                    print(f"Cargando liga ID {league_id} temporada {season_year} desde la Base de Datos Local (Actualizado hace {file_age/3600:.1f} hrs, expira en {horas_restantes:.1f} horas)...")
                else:
                    print(f"Los datos locales de la temporada actual para liga ID {league_id} tienen más de 12 horas. Se requiere actualización.")

        if use_db:
            try:
                df = pd.read_parquet(cache_file)
                if not df.empty:
                    return df
            except Exception as e:
                print(f"Error al leer la base de datos local ({cache_file}): {e}. Descargando de nuevo...")

        # Si no se usa la base de datos local, descargar desde la API
        print(f"Descargando fixtures para la liga ID {league_id}, temporada {season_year} desde la API-Sports...")
        raw_fixtures = self.client.fetch_fixtures(league_id, season_year)
        
        rows = []
        for item in raw_fixtures:
            fixture = item.get('fixture') or {}
            teams = item.get('teams') or {}
            goals = item.get('goals') or {}
            score = item.get('score') or {}
            halftime = score.get('halftime') or {}
            fulltime = score.get('fulltime') or {}
            league_info = item.get('league') or {}
            
            # Mapeo de goles y resultados
            ht_home = halftime.get('home')
            ht_away = halftime.get('away')
            ft_home = fulltime.get('home') if fulltime.get('home') is not None else goals.get('home')
            ft_away = fulltime.get('away') if fulltime.get('away') is not None else goals.get('away')
            
            rows.append({
                'match_id': fixture.get('id'),
                'date': fixture.get('date'),
                'status': (fixture.get('status') or {}).get('short'),
                'league_id': league_info.get('id'),
                'league_name': league_info.get('name'),
                'season': league_info.get('season'),
                'home_team_id': teams.get('home', {}).get('id'),
                'home_team_name': teams.get('home', {}).get('name'),
                'away_team_id': teams.get('away', {}).get('id'),
                'away_team_name': teams.get('away', {}).get('name'),
                'ht_home_goals': ht_home,
                'ht_away_goals': ht_away,
                'ft_home_goals': ft_home,
                'ft_away_goals': ft_away
            })
            
        df = pd.DataFrame(rows)
        # Convertir a numérico donde corresponda
        for col in ['ht_home_goals', 'ht_away_goals', 'ft_home_goals', 'ft_away_goals']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Guardar en la base de datos local
        if not df.empty:
            try:
                df.to_parquet(cache_file, index=False)
                print(f"Guardado exitosamente en Base de Datos Local: {cache_file}")
            except Exception as e:
                print(f"Error al guardar en la base de datos local: {e}")
                
        return df

    def get_today_fixtures(self, date_str):
        """
        Descarga todos los partidos programados para una fecha específica (YYYY-MM-DD).
        """
        print(f"Descargando todos los partidos programados para el día: {date_str}...")
        payload = self.client._get_json('fixtures', params={'date': date_str, 'timezone': 'UTC'})
        raw_fixtures = payload.get('response', [])
        
        rows = []
        for item in raw_fixtures:
            fixture = item.get('fixture') or {}
            teams = item.get('teams') or {}
            league_info = item.get('league') or {}
            
            rows.append({
                'match_id': fixture.get('id'),
                'date': fixture.get('date'),
                'status': (fixture.get('status') or {}).get('short'),
                'league_id': league_info.get('id'),
                'league_name': league_info.get('name'),
                'season': league_info.get('season'),
                'home_team_id': teams.get('home', {}).get('id'),
                'home_team_name': teams.get('home', {}).get('name'),
                'away_team_id': teams.get('away', {}).get('id'),
                'away_team_name': teams.get('away', {}).get('name')
            })
            
        return pd.DataFrame(rows)

    def get_odds_for_fixture(self, fixture_id):
        """
        Obtiene las cuotas para un partido específico desde el endpoint /odds,
        buscando el mercado de 'Goals Over/Under First Half' y el valor 'Over 0.5'.
        Retorna la cuota recomendada (máxima), la casa de apuesta recomendada,
        y un comparador con las cuotas de otras casas de apuestas.
        """
        fallback_odds = {
            'cuota_recomendada': settings.DEFAULT_HT_O05_ODDS,
            'bookmaker_recomendado': "Por determinar",
            'otras_cuotas': {}
        }
        
        try:
            print(f"Consultando cuotas para partido ID {fixture_id}...")
            response_list = self.client.fetch_odds_for_fixture(fixture_id)
            if not response_list:
                print(f"No se encontraron cuotas para partido ID {fixture_id} en la API.")
                return fallback_odds
                
            bookmakers = response_list[0].get('bookmakers', [])
            odds_by_bookmaker = {}
            
            for bm in bookmakers:
                bm_name = bm.get('name')
                for bet in bm.get('bets', []):
                    # El ID de mercado 6 es 'Goals Over/Under First Half'
                    if bet.get('id') == 6 or ("First Half" in bet.get('name', '') and "Over/Under" in bet.get('name', '')):
                        for val in bet.get('values', []):
                            if val.get('value') == 'Over 0.5':
                                try:
                                    odd_val = float(val.get('odd'))
                                    odds_by_bookmaker[bm_name] = odd_val
                                except (ValueError, TypeError):
                                    pass
                                break
            
            if not odds_by_bookmaker:
                print(f"No se encontró el mercado Over 0.5 HT en las cuotas para partido ID {fixture_id}.")
                return fallback_odds
                
            # Identificar la cuota recomendada (la máxima)
            best_bm = max(odds_by_bookmaker, key=odds_by_bookmaker.get)
            best_odd = odds_by_bookmaker[best_bm]
            
            # Quitar la recomendada de 'otras_cuotas' para que no esté duplicada
            otras = {k: v for k, v in odds_by_bookmaker.items() if k != best_bm}
            
            return {
                'cuota_recomendada': best_odd,
                'bookmaker_recomendado': best_bm,
                'otras_cuotas': otras
            }
            
        except Exception as e:
            print(f"Error al obtener cuotas para partido ID {fixture_id}: {e}")
            return fallback_odds

