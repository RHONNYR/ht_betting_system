import time

import numpy as np
import pandas as pd
import requests

from config import settings


class ApiFootballClient:
    def __init__(self, api_key=None, base_url=None, timeout=30, pause_seconds=0.25):
        self.api_key = (api_key or settings.API_FOOTBALL_KEY).strip()
        self.base_url = (base_url or settings.API_FOOTBALL_BASE_URL).rstrip('/')
        self.timeout = timeout
        self.pause_seconds = pause_seconds

        if not self.api_key:
            raise ValueError("Falta API_FOOTBALL_KEY en config/settings.py.")

    def status(self):
        return self._get_json('status')

    def fetch_leagues(self, **params):
        return self._get_json('leagues', params=params).get('response', [])

    def fetch_fixtures(self, league_id, season, **extra_params):
        params = {
            'league': int(league_id),
            'season': int(season),
            'timezone': 'UTC',
        }
        params.update({k: v for k, v in extra_params.items() if v is not None})
        payload = self._get_json('fixtures', params=params)
        fixtures = payload.get('response', [])

        paging = payload.get('paging') or {}
        total_pages = int(paging.get('total') or 1)
        for page in range(2, total_pages + 1):
            page_params = dict(params)
            page_params['page'] = page
            page_payload = self._get_json('fixtures', params=page_params)
            fixtures.extend(page_payload.get('response', []))
            time.sleep(self.pause_seconds)

        return fixtures

    def fetch_odds_for_fixture(self, fixture_id):
        params = {
            'fixture': int(fixture_id)
        }
        return self._get_json('odds', params=params).get('response', [])

    def download_fixtures_for_target(self, league_key, season_year):
        if league_key not in settings.API_FOOTBALL_LEAGUE_TARGETS:
            raise KeyError(f"No hay mapeo API-Football para league_key={league_key}")

        target = settings.API_FOOTBALL_LEAGUE_TARGETS[league_key]
        fixtures = self.fetch_fixtures(target['api_id'], season_year)
        league_name = get_configured_league_name(league_key, target)
        return normalize_api_football_fixtures(
            fixtures=fixtures,
            league_key=league_key,
            league_name=league_name,
            season_year=season_year,
            api_league_id=target['api_id'],
        )

    def _get_json(self, endpoint, params=None):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'x-apisports-key': self.api_key}

        try:
            response = requests.get(url, headers=headers, params=params or {}, timeout=self.timeout)
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(_redact_api_key(str(exc), self.api_key)) from exc

        if response.status_code == 429:
            raise RuntimeError("API-Football devolvió 429. Límite de rate alcanzado; espera y reintenta.")

        response.raise_for_status()
        payload = response.json()
        errors = payload.get('errors')
        if errors:
            raise RuntimeError(f"API-Football devolvió error: {errors}")

        return payload


def normalize_api_football_fixtures(fixtures, league_key, league_name, season_year, api_league_id):
    rows = []
    for item in fixtures:
        fixture = item.get('fixture') or {}
        teams = item.get('teams') or {}
        goals = item.get('goals') or {}
        score = item.get('score') or {}
        halftime = score.get('halftime') or {}
        fulltime = score.get('fulltime') or {}
        league = item.get('league') or {}

        status = _map_status((fixture.get('status') or {}).get('short'))
        ht_home = _to_number(halftime.get('home'))
        ht_away = _to_number(halftime.get('away'))
        ft_home = _to_number(fulltime.get('home'))
        ft_away = _to_number(fulltime.get('away'))

        if pd.isna(ft_home):
            ft_home = _to_number(goals.get('home'))
        if pd.isna(ft_away):
            ft_away = _to_number(goals.get('away'))

        ht_total = np.nan
        if pd.notna(ht_home) and pd.notna(ht_away):
            ht_total = ht_home + ht_away

        home = teams.get('home') or {}
        away = teams.get('away') or {}

        rows.append({
            'Source': 'api-football',
            'Source_Match_ID': fixture.get('id'),
            'Source_Season_ID': api_league_id,
            'Season': league.get('season') or season_year,
            'League_Key': league_key,
            'League': league_name,
            'Date': _parse_fixture_date(fixture.get('date')),
            'HomeTeam': home.get('name') or home.get('id'),
            'AwayTeam': away.get('name') or away.get('id'),
            'Status': status,
            'HTHG': ht_home,
            'HTAG': ht_away,
            'FTHG': ft_home,
            'FTAG': ft_away,
            'HT_Total_Goals': ht_total,
            'HT_Over_05_Hit': int(ht_total > 0) if pd.notna(ht_total) else np.nan,
            'Odds_HT_O05': settings.DEFAULT_HT_O05_ODDS,
            'Odds_HT_O05_Source': 'default_api_football_no_historical_ht_odds',
        })

    return pd.DataFrame(rows)


def get_configured_league_name(league_key, target):
    if league_key in settings.SOCCERSTATS_LEAGUES:
        return settings.SOCCERSTATS_LEAGUES[league_key]['name']
    return f"{target.get('country')} - {target.get('league_name')}"


def _map_status(status):
    value = str(status or '').upper()
    if value in {'FT', 'AET', 'PEN'}:
        return 'FT'
    if value in {'NS', 'TBD'}:
        return 'NS'
    if value in {'PST', 'CANC', 'ABD'}:
        return 'CANCELLED'
    if value in {'1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'}:
        return 'LIVE'
    return value or 'UNKNOWN'


def _parse_fixture_date(value):
    dt = pd.to_datetime(value, errors='coerce', utc=True)
    if pd.isna(dt):
        return pd.NaT
    return dt.tz_convert(None)


def _to_number(value):
    return pd.to_numeric(value, errors='coerce')


def _redact_api_key(message, api_key):
    if not api_key:
        return message
    return message.replace(api_key, '***REDACTED***')
