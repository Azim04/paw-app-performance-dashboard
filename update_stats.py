import os
import re
import json
import datetime
import io
import gspread
import pandas as pd
from google.oauth2 import service_account
from google.cloud import storage

# ----------------------------------------------------------------------
# 1. ENVIRONMENT VARIABLES
# ----------------------------------------------------------------------
GOOGLE_BUCKET_NAME   = os.getenv("GOOGLE_BUCKET_NAME")
ANDROID_PACKAGE_NAME = os.getenv("ANDROID_PACKAGE_NAME")
GCP_KEY_JSON         = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
SPREADSHEET_ID       = "1ydkkBv6DKesQDu-xUHrbq-W_-jk-dskdpNVz1f-9-G0"

# ----------------------------------------------------------------------
# 2. GOOGLE FETCH ENGINE
# ----------------------------------------------------------------------
def get_gcp_credentials():
    if not GCP_KEY_JSON:
        raise ValueError("❌ Critical Error: The environment variable 'GCP_SERVICE_ACCOUNT_KEY' is completely empty or missing from the GitHub runner environment.")
    info = json.loads(GCP_KEY_JSON)
    return service_account.Credentials.from_service_account_info(
        info,
        scopes=[
            "https://www.googleapis.com/auth/cloud-platform",
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    )

def fetch_google_cumulative():
    """Sum Install events across all monthly GCS overview files"""
    try:
        credentials = get_gcp_credentials()
        client      = storage.Client(credentials=credentials)
        prefix      = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_"
        all_blobs   = list(client.list_blobs(GOOGLE_BUCKET_NAME, prefix=prefix))
        overview_blobs = [b for b in all_blobs if b.name.endswith('_overview.csv')]
        print(f"  Found {len(overview_blobs)} monthly overview files")

        running_totals = {}
        for blob in sorted(overview_blobs, key=lambda b: b.name):
            try:
                content = blob.download_as_text()
                df      = pd.read_csv(io.StringIO(content))
                for col in ['Daily Device Installs', 'Daily User Installs',
                            'Active Device Installs', 'Install events']:
                    if col in df.columns:
                        val = pd.to_numeric(df[col], errors='coerce').fillna(0).sum()
                        running_totals[col] = running_totals.get(col, 0) + int(val)
            except Exception as e:
                print(f"  ⚠️ Skipped {blob.name}: {e}")

        print("  📊 Grand totals per column:")
        for col, val in running_totals.items():
            print(f"     {col}: {val:,}")

        return running_totals.get('Daily User Installs', 0)

    except Exception as e:
        print(f"  ❌ Google cumulative exception: {e}")
        return 0


def fetch_google_weekly():
    """Get this week's install events from the most recent overview file"""
    try:
        credentials = get_gcp_credentials()
        client      = storage.Client(credentials=credentials)
        today       = datetime.datetime.utcnow()
        year_month  = today.strftime("%Y%m")

        blob_path = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_{year_month}_overview.csv"
        blob      = client.bucket(GOOGLE_BUCKET_NAME).blob(blob_path)

        if not blob.exists():
            prev       = today.replace(day=1) - datetime.timedelta(days=1)
            year_month = prev.strftime("%Y%m")
            blob_path  = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_{year_month}_overview.csv"
            blob       = client.bucket(GOOGLE_BUCKET_NAME).blob(blob_path)

        if blob.exists():
            content = blob.download_as_text()
            df      = pd.read_csv(io.StringIO(content))
            print(f"  Weekly file columns: {list(df.columns)}")

            if 'Daily User Installs' in df.columns:
                # Sum last 7 rows for weekly total
                weekly = pd.to_numeric(
                    df['Daily User Installs'], errors='coerce'
                ).fillna(0).tail(7).sum()
                return int(weekly)
        return 0

    except Exception as e:
        print(f"  ❌ Weekly fetch exception: {e}")
        return 0


def write_to_sheet_by_headers(sheet_name, data_dict):
    """Appends a row to the sheet mapping dictionary keys straight to the column headers"""
    try:
        credentials = get_gcp_credentials()
        gc          = gspread.authorize(credentials)
        sh          = gc.open_by_key(SPREADSHEET_ID)
        worksheet   = sh.worksheet(sheet_name)
        
        # Read the top row of headers from the sheet
        headers = worksheet.row_values(1)
        
        # Build out a row matched perfectly to the sheet's columns
        row_to_append = []
        for header in headers:
            row_to_append.append(data_dict.get(header, ""))
            
        worksheet.append_row(row_to_append, value_input_option='USER_ENTERED')
        print(f"  ✅ Written to {sheet_name} matching headers: {data_dict}")
    except Exception as e:
        print(f"  ❌ Sheet write exception: {str(e)}")
        raise e


# ----------------------------------------------------------------------
# 3. CORE PROCESSING PIPELINE
# ----------------------------------------------------------------------
try:
    today     = datetime.datetime.utcnow()
    sync_date = today.strftime("%Y-%m-%d")
    run_mode  = os.getenv("RUN_MODE", "weekly")

    print(f"1️⃣ Sync Date : {sync_date}")
    print(f"🚀 Run Mode  : {run_mode}")

    # ── Fetch Android data ────────────────────────────────────────────
    print("\n--- ANDROID FETCH ---")
    android_cumulative = fetch_google_cumulative()
    android_weekly     = fetch_google_weekly()
    print(f"  ✅ Android cumulative : {android_cumulative:,}")
    print(f"  ✅ Android weekly     : {android_weekly:,}")

    # ── Write to Google Sheet ─────────────────────────────────────────
    print("\n--- SHEET WRITE ---")
    if run_mode == "monthly":
        month_label = today.strftime("%B %Y")
        
        payload = {
            "Date": month_label,
            "Android_Cumulative": android_cumulative
        }
        write_to_sheet_by_headers("Monthly_Stats", payload)
        print(f"  📅 Monthly row written for {month_label}")

    elif run_mode == "weekly":
        # Changed format from "%Y-%m-%d" to "%d/%m/%Y" (DD/MM/YYYY)
        week_label = today.strftime("%d/%m/%Y")
        
        payload = {
            "Week_Date": week_label,  # Matches your specified layout token name
            "Android_Weekly": android_cumulative 
        }
        write_to_sheet_by_headers("Weekly_Stats", payload)
        print(f"  📅 Weekly row written for {week_label}")

    # ── Build README dashboard ────────────────────────────────────────
    combined  = android_cumulative
    GOAL      = 50000
    pct       = min(combined / GOAL, 1.0)
    filled    = int(round(20 * pct))
    bar       = '█' * filled + '░' * (20 - filled)

    dashboard_content = f"""```text
+-------------------------------------------------------+
| 📱 MOBILE APPS DOWNLOAD TRACKER                       |
+-------------------------------------------------------+
| 📊 LIVE GROWTH PERFORMANCE (Sync Date: {sync_date}) |
+-------------------------------------------------------+
| 🤖 Android Google Play Tally: {android_cumulative:,} installs
|
| 🏆 GOAL MILESTONE           : {combined:,} / {GOAL:,}
| Milestone Progress         : [{bar}] {int(pct * 100)}%
+-------------------------------------------------------+
```"""

    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()

    updated_readme = re.sub(
        r'.*?',
        f'\n{dashboard_content}\n',
        readme,
        flags=re.DOTALL
    )

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(updated_readme)

    print("\n✅ README updated successfully.")

except Exception as main_err:
    print(f"\n❌ Pipeline failure: {main_err}")
    raise
