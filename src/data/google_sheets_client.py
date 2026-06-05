import os
import gspread
import pandas as pd
from google.oauth2.service_account import Credentials
from gspread_formatting import (
    get_conditional_format_rules,
    ConditionalFormatRule,
    BooleanRule,
    BooleanCondition,
    CellFormat,
    Color,
    TextFormat,
    format_cell_range,
    set_column_width,
    GridRange
)

class GoogleSheetsClient:
    def __init__(self, credentials_path=None):
        if credentials_path is None:
            # Ruta por defecto en config/credentials.json
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            credentials_path = os.path.join(base_dir, 'config', 'credentials.json')
            
        self.credentials_path = credentials_path
        self.scope = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        self.client = None

    def authenticate(self):
        """
        Autentica usando el archivo credentials.json de la cuenta de servicio.
        """
        if not os.path.exists(self.credentials_path):
            raise FileNotFoundError(
                f"No se encontró el archivo de credenciales de Google en: {self.credentials_path}\n"
                "Por favor, guárdalo en esa ruta antes de ejecutar el pipeline."
            )
        creds = Credentials.from_service_account_file(self.credentials_path, scopes=self.scope)
        self.client = gspread.authorize(creds)
        print("Autenticación con Google Sheets completada exitosamente.")

    def open_or_create_spreadsheet(self, title):
        """
        Abre una hoja de cálculo existente por título, o crea una nueva si no existe.
        """
        if not self.client:
            self.authenticate()
        try:
            spreadsheet = self.client.open(title)
            print(f"Abierta hoja de cálculo existente: '{title}'")
            return spreadsheet
        except gspread.SpreadsheetNotFound:
            spreadsheet = self.client.create(title)
            print(f"Creada nueva hoja de cálculo: '{title}'")
            # Nota: El usuario debe compartirla con su cuenta de Google o con el correo de la cuenta de servicio
            return spreadsheet

    def write_tab_ligas(self, sh, df_stats):
        """
        Escribe y formatea la pestaña 1_Ligas_Filtro.
        """
        ws = self.get_or_create_worksheet(sh, "1_Ligas_Filtro")
        ws.clear()
        
        # Preparar datos para escribir
        # Columnas: Liga ID, Liga, Temporada, % Over 1.5, % Over 2.5, Estado
        write_df = df_stats.copy()
        write_df['Estado'] = write_df['passed'].apply(lambda x: "APROBADA" if x else "RECHAZADA")
        write_df['over_15_pct'] = (write_df['over_15_pct'] * 100).round(1).astype(str) + "%"
        write_df['over_25_pct'] = (write_df['over_25_pct'] * 100).round(1).astype(str) + "%"
        
        # Seleccionar y renombrar columnas
        write_df = write_df[['league_id', 'league_name', 'season', 'over_15_pct', 'over_25_pct', 'Estado']]
        write_df.columns = ['ID Liga', 'Liga', 'Temporada', 'Over 1.5 FT %', 'Over 2.5 FT %', 'Estado']
        
        # Escribir cabecera y filas
        ws.update([write_df.columns.tolist()] + write_df.values.tolist())
        
        # Dar formato
        self.apply_premium_styles(ws, len(write_df) + 1, len(write_df.columns))
        
        # Formato condicional para la columna Estado (columna F)
        self.apply_conditional_formatting_status(ws, "F2:F1000")
        
        # Anchos de columna
        set_column_width(ws, 'A', 80)
        set_column_width(ws, 'B', 220)
        set_column_width(ws, 'C', 100)
        set_column_width(ws, 'D', 120)
        set_column_width(ws, 'E', 120)
        set_column_width(ws, 'F', 120)

    def write_tab_equipos(self, sh, df_local, df_away):
        """
        Escribe y formatea la pestaña 2_Equipos_Radar.
        """
        ws = self.get_or_create_worksheet(sh, "2_Equipos_Radar")
        ws.clear()
        
        # Combinar candidatos locales y visitantes
        df_all = pd.concat([df_local, df_away]).copy()
        # Filtrar solo candidatos aprobados
        df_all = df_all[df_all['is_candidate'] == True].copy()
        
        if df_all.empty:
            ws.update([["No se encontraron equipos que cumplan con todos los filtros estrictos en esta ejecución."]])
            return
            
        # Formatear porcentajes
        for col in ['ht_05_pct', 'ht_15_pct', 'bts_pct', 'rendimiento_ht']:
            df_all[col] = (df_all[col] * 100).round(1).astype(str) + "%"
            
        for col in ['avg_goals_ht_general', 'avg_goals_ht_rol']:
            df_all[col] = df_all[col].round(2)
            
        write_df = df_all[['league_name', 'team_name', 'role', 'ht_05_pct', 'ht_15_pct', 'bts_pct', 'rendimiento_ht', 'avg_goals_ht_general', 'avg_goals_ht_rol', 'racha_ht']]
        write_df.columns = ['Liga', 'Equipo', 'Rol', 'HT 0.5+ %', 'HT 1.5+ %', 'BTS FT %', 'Rendimiento HT', 'Media Goles HT (Gral)', 'Media Goles HT (Rol)', 'Racha HT']
        
        # Escribir
        ws.update([write_df.columns.tolist()] + write_df.values.tolist())
        
        # Formato
        self.apply_premium_styles(ws, len(write_df) + 1, len(write_df.columns))
        
        # Anchos de columna
        set_column_width(ws, 'A', 200)
        set_column_width(ws, 'B', 200)
        set_column_width(ws, 'C', 100)
        set_column_width(ws, 'D', 100)
        set_column_width(ws, 'E', 100)
        set_column_width(ws, 'F', 100)
        set_column_width(ws, 'G', 120)
        set_column_width(ws, 'H', 140)
        set_column_width(ws, 'I', 140)
        set_column_width(ws, 'J', 100)

    def write_tab_backtesting(self, sh, df_backtest):
        """
        Escribe y formatea la pestaña 3_Backtesting, incluyendo fórmulas de KPIs.
        """
        ws = self.get_or_create_worksheet(sh, "3_Backtesting")
        ws.clear()
        
        if df_backtest.empty:
            ws.update([["No hay partidos cruzados en el backtesting de las últimas 2 temporadas."]])
            return
            
        # Ordenar por fecha cronológica descendente para facilitar lectura
        df_backtest = df_backtest.sort_values('Fecha', ascending=False).copy()
        
        # Cabecera de tabla de datos en A1:F1
        headers = ['Fecha', 'Liga', 'Local', 'Visitante', 'Goles HT', 'Resultado']
        ws.update([headers] + df_backtest[headers].values.tolist())
        
        # Dar formato a la tabla de datos
        self.apply_premium_styles(ws, len(df_backtest) + 1, 6)
        
        # Formato condicional para Resultados (columna F)
        self.apply_conditional_formatting_results(ws, "F2:F2000")
        
        # Insertar Fórmulas de KPIs en H1:I4
        kpis = [
            ["KPI", "Valor"],
            ["Aciertos (GANADA)", '=CONTAR.SI(F2:F2000, "GANADA")'],
            ["Fallos (PERDIDA)", '=CONTAR.SI(F2:F2000, "PERDIDA")'],
            ["Win Rate Global", '=SI((I2+I3)>0, I2/(I2+I3), 0)']
        ]
        ws.update(kpis, "H1:I4")
        
        # Formatear panel de KPIs
        format_cell_range(ws, "H1:I1", CellFormat(
            backgroundColor=Color(0.12, 0.12, 0.18),
            textFormat=TextFormat(bold=True, color=Color(1, 1, 1)),
            horizontalAlignment='CENTER'
        ))
        format_cell_range(ws, "H2:I4", CellFormat(
            backgroundColor=Color(0.96, 0.96, 0.98),
            textFormat=TextFormat(bold=True)
        ))
        format_cell_range(ws, "I4:I4", CellFormat(
            numberFormat={'type': 'PERCENT', 'pattern': '0.00%'}
        ))
        
        # Anchos de columna
        set_column_width(ws, 'A', 110)
        set_column_width(ws, 'B', 180)
        set_column_width(ws, 'C', 180)
        set_column_width(ws, 'D', 180)
        set_column_width(ws, 'E', 80)
        set_column_width(ws, 'F', 100)
        set_column_width(ws, 'H', 150)
        set_column_width(ws, 'I', 100)

    def write_tab_picks(self, sh, df_picks):
        """
        Escribe y formatea la pestaña 4_Picks_Del_Día.
        """
        ws = self.get_or_create_worksheet(sh, "4_Picks_Del_Día")
        ws.clear()
        
        if df_picks.empty:
            ws.update([["No hay partidos programados para hoy de los equipos aprobados."]])
            return
            
        headers = ['Hora', 'Liga', 'Local', 'Visitante', 'Probabilidad HT 0.5+ Combinada']
        ws.update([headers] + df_picks[headers].values.tolist())
        
        # Dar formato
        self.apply_premium_styles(ws, len(df_picks) + 1, len(headers))
        
        # Anchos de columna
        set_column_width(ws, 'A', 80)
        set_column_width(ws, 'B', 200)
        set_column_width(ws, 'C', 200)
        set_column_width(ws, 'D', 200)
        set_column_width(ws, 'E', 220)

    def get_or_create_worksheet(self, sh, name):
        try:
            return sh.worksheet(name)
        except gspread.WorksheetNotFound:
            return sh.add_worksheet(title=name, rows="2000", cols="20")

    def apply_premium_styles(self, ws, num_rows, num_cols):
        """
        Aplica un estilo premium con cabecera oscura y bordes limpios.
        """
        # Formatear cabecera (Fila 1)
        header_range = f"A1:{chr(64 + num_cols)}1"
        format_cell_range(ws, header_range, CellFormat(
            backgroundColor=Color(0.09, 0.09, 0.15),  # Azul oscuro / negro
            textFormat=TextFormat(bold=True, color=Color(1, 1, 1), fontSize=10),
            horizontalAlignment='CENTER'
        ))
        
        # Formatear filas de datos
        if num_rows > 1:
            data_range = f"A2:{chr(64 + num_cols)}{num_rows}"
            format_cell_range(ws, data_range, CellFormat(
                textFormat=TextFormat(fontSize=9),
                horizontalAlignment='CENTER'
            ))

    def apply_conditional_formatting_status(self, ws, cell_range):
        """
        Aplica reglas de formato condicional: APROBADA (verde), RECHAZADA (rojo).
        """
        rules = get_conditional_format_rules(ws)
        
        green_format = CellFormat(
            backgroundColor=Color(0.827, 0.929, 0.855),  # Verde claro
            textFormat=TextFormat(bold=True, color=Color(0.082, 0.341, 0.141))
        )
        red_format = CellFormat(
            backgroundColor=Color(0.973, 0.843, 0.855),  # Rojo claro
            textFormat=TextFormat(bold=True, color=Color(0.447, 0.110, 0.141))
        )
        
        rules.clear()
        rules.append(ConditionalFormatRule(
            ranges=[GridRange.from_a1_range(ws, cell_range)],
            booleanRule=BooleanRule(
                condition=BooleanCondition(type='TEXT_EQ', values=[{'userEnteredValue': 'APROBADA'}]),
                format=green_format
            )
        ))
        rules.append(ConditionalFormatRule(
            ranges=[GridRange.from_a1_range(ws, cell_range)],
            booleanRule=BooleanRule(
                condition=BooleanCondition(type='TEXT_EQ', values=[{'userEnteredValue': 'RECHAZADA'}]),
                format=red_format
            )
        ))
        rules.save()

    def apply_conditional_formatting_results(self, ws, cell_range):
        """
        Aplica reglas de formato condicional: GANADA (verde), PERDIDA (rojo).
        """
        rules = get_conditional_format_rules(ws)
        
        green_format = CellFormat(
            backgroundColor=Color(0.827, 0.929, 0.855),  # Verde claro
            textFormat=TextFormat(bold=True, color=Color(0.082, 0.341, 0.141))
        )
        red_format = CellFormat(
            backgroundColor=Color(0.973, 0.843, 0.855),  # Rojo claro
            textFormat=TextFormat(bold=True, color=Color(0.447, 0.110, 0.141))
        )
        
        rules.clear()
        rules.append(ConditionalFormatRule(
            ranges=[GridRange.from_a1_range(ws, cell_range)],
            booleanRule=BooleanRule(
                condition=BooleanCondition(type='TEXT_EQ', values=[{'userEnteredValue': 'GANADA'}]),
                format=green_format
            )
        ))
        rules.append(ConditionalFormatRule(
            ranges=[GridRange.from_a1_range(ws, cell_range)],
            booleanRule=BooleanRule(
                condition=BooleanCondition(type='TEXT_EQ', values=[{'userEnteredValue': 'PERDIDA'}]),
                format=red_format
            )
        ))
        rules.save()
