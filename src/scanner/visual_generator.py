import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import os
import datetime
from matplotlib.patches import FancyBboxPatch

def generate_pick_infographic(pick_data, output_path):
    """
    Generates a beautiful stats card (infographic) for a given pick
    and saves it to the specified output path.
    """
    try:
        # Set up dark theme
        plt.style.use('dark_background')
        fig = plt.figure(figsize=(9, 6.2), dpi=120)
        fig.patch.set_facecolor('#0f172a')  # Slate 900
        
        ax = fig.add_subplot(111)
        ax.set_facecolor('#0f172a')
        ax.axis('off')
        
        # Extract data
        local = pick_data.get('local', 'Local')
        visitante = pick_data.get('visitante', 'Visitante')
        liga = pick_data.get('liga', 'Liga')
        fecha = pick_data.get('fecha', '')
        hora = pick_data.get('hora', '')
        clase = pick_data.get('clase', 'Clase B')
        prob = pick_data.get('probabilidad', '75%')
        tier = int(pick_data.get('tier', 3))
        
        # Parse date/time for display (convert from UTC to VET)
        fecha_vet = fecha
        hora_vet = hora
        try:
            dt_utc = datetime.datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
            dt_vet = dt_utc - datetime.timedelta(hours=4)
            fecha_vet = dt_vet.strftime("%Y-%m-%d")
            hora_vet = dt_vet.strftime("%H:%M")
        except Exception:
            pass
            
        tier_names = {1: "Tier 1 (Alta Liquidez)", 2: "Tier 2 (Media Liquidez)", 3: "Tier 3 (Exótica)"}
        tier_name = tier_names.get(tier, f"Tier {tier}")
        
        # 1. Draw Title Area
        plt.text(0.5, 0.94, "SISTEMA HT OVER 0.5+ GOLES", color='#10b981', fontsize=11, fontweight='bold', ha='center')
        plt.text(0.5, 0.86, f"{local} vs {visitante}", color='#ffffff', fontsize=17, fontweight='bold', ha='center')
        plt.text(0.5, 0.80, f"LIGA: {liga} ({tier_name})   |   FECHA: {fecha_vet}   |   HORA: {hora_vet} VET", color='#94a3b8', fontsize=9.5, ha='center')
        
        # Draw horizontal separator line
        plt.plot([0.05, 0.95], [0.75, 0.75], color='#334155', lw=1.5)
        
        # 2. Main Stats Cards
        local_stats = pick_data.get('local_stats', {})
        visitante_stats = pick_data.get('visitante_stats', {})
        
        # Combined Prob Card (Center)
        rect_prob = FancyBboxPatch((0.36, 0.42), 0.28, 0.28, facecolor='#1e293b', edgecolor='#3b82f6', boxstyle="round,pad=0.03", lw=1.5)
        ax.add_patch(rect_prob)
        
        plt.text(0.5, 0.65, "PROBABILIDAD COMBINADA", color='#94a3b8', fontsize=7.5, fontweight='bold', ha='center')
        plt.text(0.5, 0.52, f"{prob}", color='#3b82f6', fontsize=26, fontweight='bold', ha='center')
        plt.text(0.5, 0.46, f"{clase}", color='#10b981' if "A" in clase else '#f59e0b', fontsize=10, fontweight='bold', ha='center')
        
        # Local Card (Left)
        rect_local = FancyBboxPatch((0.05, 0.42), 0.28, 0.28, facecolor='#1e293b', edgecolor='#475569', boxstyle="round,pad=0.03")
        ax.add_patch(rect_local)
        
        local_pct = local_stats.get('ht_05_pct', 'N/A')
        plt.text(0.19, 0.65, "LOCAL HT 0.5+", color='#cbd5e1', fontsize=8, fontweight='bold', ha='center')
        plt.text(0.19, 0.52, f"{local_pct}", color='#ffffff', fontsize=22, fontweight='bold', ha='center')
        plt.text(0.19, 0.46, f"Media Goles: {local_stats.get('avg_goals_ht_rol', 'N/A')}", color='#94a3b8', fontsize=8.5, ha='center')
        
        # Visitante Card (Right)
        rect_away = FancyBboxPatch((0.67, 0.42), 0.28, 0.28, facecolor='#1e293b', edgecolor='#475569', boxstyle="round,pad=0.03")
        ax.add_patch(rect_away)
        
        away_pct = visitante_stats.get('ht_05_pct', 'N/A')
        plt.text(0.81, 0.65, "VISITANTE HT 0.5+", color='#cbd5e1', fontsize=8, fontweight='bold', ha='center')
        plt.text(0.81, 0.52, f"{away_pct}", color='#ffffff', fontsize=22, fontweight='bold', ha='center')
        plt.text(0.81, 0.46, f"Media Goles: {visitante_stats.get('avg_goals_ht_rol', 'N/A')}", color='#94a3b8', fontsize=8.5, ha='center')

        # Draw another separator
        plt.plot([0.05, 0.95], [0.38, 0.38], color='#334155', lw=1.5)
        
        # 3. Streaks / Rachas
        plt.text(0.05, 0.32, f"Racha Reciente en la 1ra Mitad (HT):", color='#cbd5e1', fontsize=9.5, fontweight='bold')
        
        # Draw Local Streak
        local_display_name = local[:22] + "..." if len(local) > 22 else local
        plt.text(0.05, 0.25, f"{local_display_name}:", color='#cbd5e1', fontsize=9)
        loc_streak = local_stats.get('racha_detalles', [])
        for idx, match in enumerate(loc_streak[-5:]):
            total_ht = match.get('total_ht', 0)
            color = '#10b981' if total_ht > 0 else '#ef4444'
            rect = FancyBboxPatch((0.35 + idx*0.045, 0.23), 0.035, 0.05, facecolor=color, edgecolor='none', boxstyle="round,pad=0.01")
            ax.add_patch(rect)
            plt.text(0.3675 + idx*0.045, 0.25, str(total_ht), color='#ffffff', fontsize=9, fontweight='bold', ha='center')
            
        # Draw Away Streak
        visitante_display_name = visitante[:22] + "..." if len(visitante) > 22 else visitante
        plt.text(0.05, 0.16, f"{visitante_display_name}:", color='#cbd5e1', fontsize=9)
        away_streak = visitante_stats.get('racha_detalles', [])
        for idx, match in enumerate(away_streak[-5:]):
            total_ht = match.get('total_ht', 0)
            color = '#10b981' if total_ht > 0 else '#ef4444'
            rect = FancyBboxPatch((0.35 + idx*0.045, 0.14), 0.035, 0.05, facecolor=color, edgecolor='none', boxstyle="round,pad=0.01")
            ax.add_patch(rect)
            plt.text(0.3675 + idx*0.045, 0.16, str(total_ht), color='#ffffff', fontsize=9, fontweight='bold', ha='center')

        # Draw legend
        rect_g = plt.Rectangle((0.65, 0.24), 0.02, 0.03, facecolor='#10b981', edgecolor='none')
        ax.add_patch(rect_g)
        plt.text(0.68, 0.245, "Over 0.5 HT Goles", color='#cbd5e1', fontsize=8)
        
        rect_r = plt.Rectangle((0.65, 0.15), 0.02, 0.03, facecolor='#ef4444', edgecolor='none')
        ax.add_patch(rect_r)
        plt.text(0.68, 0.155, "0 - 0 HT Goles", color='#cbd5e1', fontsize=8)
        
        # 4. Draw Drawdown Warning if applicable
        recent_wr = pick_data.get('league_recent_win_rate', 1.0)
        is_dd = pick_data.get('is_drawdown', False)
        
        if is_dd:
            # Draw warning banner at the bottom
            rect_warn = FancyBboxPatch((0.05, 0.04), 0.90, 0.07, facecolor='#f59e0b', edgecolor='none', alpha=0.15, boxstyle="round,pad=0.01")
            ax.add_patch(rect_warn)
            rect_warn_border = FancyBboxPatch((0.05, 0.04), 0.90, 0.07, facecolor='none', edgecolor='#f59e0b', lw=1.2, boxstyle="round,pad=0.01")
            ax.add_patch(rect_warn_border)
            plt.text(0.5, 0.065, f"[!] ALERTA RACHA NEGATIVA: Win Rate Reciente Liga: {recent_wr*100:.1f}% (Riesgo Alto)", color='#fbbf24', fontsize=8.5, fontweight='bold', ha='center')
        else:
            plt.text(0.5, 0.05, f"Análisis generado por Antigravity HT Betting System   |   Win Rate Reciente Liga: {recent_wr*100:.1f}%", color='#64748b', fontsize=8, ha='center')
            
        plt.xlim(0, 1)
        plt.ylim(0, 1)
        
        # Save the figure
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, facecolor='#0f172a', bbox_inches='tight', pad_inches=0.1, dpi=150)
        plt.close()
        return True
    except Exception as e:
        print(f"[Visual Generator] Error al generar infografía: {e}")
        try:
            plt.close()
        except:
            pass
        return False
