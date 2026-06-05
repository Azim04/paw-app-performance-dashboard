import pandas as pd
import re

# paste your Google Sheet ID here
SPREADSHEET_ID = "1ydkkBv6DKesQDu-xUHrbq-W_-jk-dskdpNVz1f-9-G0"

# Load the Google Sheet data safely into Python arrays via CSV web endpoints
monthly_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Monthly_Stats"
weekly_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Weekly_Stats"

try:
    df_month = pd.read_csv(monthly_url)
    df_week = pd.read_csv(weekly_url)
    
    # Extract Latest Data Points
    latest_month = df_month.iloc[-1]
    m_name = str(latest_month['Month'])
    m_total = int(latest_month['Total'])
    m_ios = int(latest_month['iOS'])
    m_android = int(latest_month['Android'])
    
    latest_week = df_week.iloc[-1]
    w_date = str(latest_week['Week_Date'])
    w_total = int(latest_week['Total_Weekly'])
    w_ios = int(latest_week['iOS_Weekly'])
    w_android = int(latest_week['Android_Weekly'])
    
    # Milestone Calculations (Goal: 50,000 Cumulative downloads)
    GOAL = 50000
    percentage = min(m_total / GOAL, 1.0)
    filled_blocks = int(round(20 * percentage))
    bar = '█' * filled_blocks + '░' * (20 - filled_blocks)

    # Build Dashboard Output Text block
    dashboard_content = f"""```text
+-------------------------------------------------------+
| 📱 MOBILE APPS DOWNLOAD TRACKER                       |
+-------------------------------------------------------+
| 📊 WEEKLY GROWTH SUMMARY (Week Ending: {w_date})     |
| 🍏 iOS: +{w_ios:,}  |  🤖 Android: +{w_android:,}  |  🚀 Total: +{w_total:,} |
+-------------------------------------------------------+
| 🗓️ LIFETIME STATS HISTORICAL ({m_name})                |
| 🍏 iOS Total Cumulative    : {m_ios:,}               |
| 🤖 Android Total Cumulative: {m_android:,}               |
|                                                       |
| 🏆 GOAL MILESTONE          : {m_total:,} / {GOAL:,}
| Milestone Progress        : [{bar}] {int(percentage * 100)}%             |
+-------------------------------------------------------+
