import pandas as pd
import re

# Paste your Google Sheet ID here
SPREADSHEET_ID = "1ydkkBv6DKesQDu-xUHrbq-W_-jk-dskdpNVz1f-9-G0"

# Load the Google Sheet data safely into Python arrays via CSV web endpoints
monthly_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Monthly_Stats"
weekly_url  = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Weekly_Stats"

def safe_int(value):
    """Safely convert a cell value to int, handling blanks and commas."""
    try:
        return int(float(str(value).replace(',', '').strip() or 0))
    except (ValueError, TypeError):
        return 0

try:
    df_month = pd.read_csv(monthly_url)
    df_week  = pd.read_csv(weekly_url)

    # ── Extract Latest Data Points ────────────────────────────────────────────
    latest_month = df_month.iloc[-1]
    m_name    = str(latest_month['Month'])
    m_total   = safe_int(latest_month['Total'])
    m_ios     = safe_int(latest_month['iOS'])
    m_android = safe_int(latest_month['Android'])

    latest_week = df_week.iloc[-1]
    w_date      = str(latest_week['Week_Date'])
    w_total     = safe_int(latest_week['Total_Weekly'])
    w_ios       = safe_int(latest_week['iOS_Weekly'])
    w_android   = safe_int(latest_week['Android_Weekly'])

    # ── Month-over-Month Growth ───────────────────────────────────────────────
    if len(df_month) >= 2:
        prev_month  = df_month.iloc[-2]
        mom_growth  = m_total - safe_int(prev_month['Total'])
        mom_label   = f"+{mom_growth:,}" if mom_growth >= 0 else f"{mom_growth:,}"
    else:
        mom_label   = "N/A (first month)"

    # ── Milestone Calculations (Goal: 50,000 cumulative downloads) ────────────
    GOAL          = 50000
    percentage    = min(m_total / GOAL, 1.0)
    filled_blocks = int(round(20 * percentage))
    bar           = '█' * filled_blocks + '░' * (20 - filled_blocks)

    # ── Build Dashboard Output Text Block ────────────────────────────────────
    dashboard_content = f"""```text
+-------------------------------------------------------+
| 📱 MOBILE APPS DOWNLOAD TRACKER                       |
+-------------------------------------------------------+
| 📊 WEEKLY GROWTH SUMMARY (Week Ending: {w_date})
| 🍏 iOS: +{w_ios:,}  |  🤖 Android: +{w_android:,}  |  🚀 Total: +{w_total:,}
+-------------------------------------------------------+
| 🗓️  LIFETIME STATS HISTORICAL ({m_name})
| 🍏 iOS Total Cumulative    : {m_ios:,}
| 🤖 Android Total Cumulative: {m_android:,}
| 📈 Month-over-Month Growth : {mom_label}
|
| 🏆 GOAL MILESTONE          : {m_total:,} / {GOAL:,}
| Milestone Progress        : [{bar}] {int(percentage * 100)}%
+-------------------------------------------------------+
```"""

    # ── Write Back to README.md ───────────────────────────────────────────────
    README_PATH = "README.md"

    with open(README_PATH, 'r', encoding='utf-8') as f:
        readme = f.read()

    new_readme = re.sub(
        r'<!--START_DASHBOARD-->.*?<!--END_DASHBOARD-->',
        f'<!--START_DASHBOARD-->\n{dashboard_content}\n<!--END_DASHBOARD-->',
        readme,
        flags=re.DOTALL
    )

    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(new_readme)

    print("✅ README.md updated successfully.")

except Exception as e:
    print(f"❌ Pipeline failed: {e}")
    raise
