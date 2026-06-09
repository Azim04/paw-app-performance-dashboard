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
# 1. ENVIRONMENT VARIABLES & APP CONFIGURATIONS
# ----------------------------------------------------------------------
GOOGLE_BUCKET_NAME   = os.getenv("GOOGLE_BUCKET_NAME")
GCP_KEY_JSON         = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
SPREADSHEET_ID       = "1ydkkBv6DKesQDu-xUHrbq-W_-jk-dskdpNVz1f-9-G0"

DEFAULT_PACKAGE_NAME = os.getenv("ANDROID_PACKAGE_NAME")

APPS_CONFIG = [
    {
        "name": "Original App",
        "package_name": DEFAULT_PACKAGE_NAME,
        "monthly_sheet": "Business_Monthly",
        "weekly_sheet": "Business_Weekly"
    },
    {
        "name": "Couple App",
        "package_name": "com.planawedding.customer",
        "monthly_sheet": "Couple_Monthly",
        "weekly_sheet": "Couple_Weekly"
    }
]

# ----------------------------------------------------------------------
# 2. GOOGLE FETCH ENGINE
# ----------------------------------------------------------------------
def get_gcp_credentials():
    if not GCP_KEY_JSON:
        raise ValueError("❌ Critical Error: The environment variable 'GCP_SERVICE_ACCOUNT_KEY' is completely empty or missing.")
    info = json.loads(GCP_KEY_JSON)
    return service_account.Credentials.from_service_account_info(
        info,
        scopes=[
            "https://www.googleapis.com/auth/cloud-platform",
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    )

def fetch_and_process_gcs_data(package_name, sheet_name, run_mode, today):
    """Processes GCS files, parses all columns, sums metrics, and appends to Google Sheets"""
    if not package_name:
        print("  ⚠️ Package name missing. Skipping fetch.")
        return 0
        
    try:
        credentials = get_gcp_credentials()
        client      = storage.Client(credentials=credentials)
        prefix      = f"stats/installs/installs_{package_name}_"
        all_blobs   = list(client.list_blobs(GOOGLE_BUCKET_NAME, prefix=prefix))
        overview_blobs = [b for b in all_blobs if b.name.endswith('_overview.csv')]
        print(f"  Found {len(overview_blobs)} overview files for {package_name}")

        # Track grand total cumulative installs across ALL time for the README dashboard
        grand_total_user_installs = 0
        
        # We target the most recent file for extracting detailed row records
        sorted_blobs = sorted(overview_blobs, key=lambda b: b.name)
        if not sorted_blobs:
            print(f"  ⚠️ No CSV overview logs discovered for {package_name}")
            return 0

        # Calculate grand cumulative user installs across all historical monthly logs
        for blob in sorted_blobs:
            try:
                content = blob.download_as_text()
                df = pd.read_csv(io.StringIO(content))
                if 'Daily User Installs' in df.columns:
                    grand_total_user_installs += int(pd.to_numeric(df['Daily User Installs'], errors='coerce').fillna(0).sum())
            except Exception as e:
                print(f"  ⚠️ Error parsing historical file {blob.name}: {e}")

        # Get data from the latest active file to push all metrics into the spreadsheet rows
        latest_blob = sorted_blobs[-1]
        print(f"  📄 Processing latest active log data from: {latest_blob.name}")
        content = latest_blob.download_as_text()
        df = pd.read_csv(io.StringIO(content))
        
        # Clean data frame columns to match dictionary indexing safely
        df.columns = [col.strip() for col in df.columns]

        # Determine how many records we write based on run mode
        # If weekly: extract the last 7 entries. If monthly: pass the whole month file.
        target_df = df.tail(7) if run_mode == "weekly" else df

        print(f"  ✍️ Pushing {len(target_df)} rows of complete console data fields to {sheet_name}...")
        
        # Iterate over rows to build dynamic payload mappings for all parameters
        for _, row in target_df.iterrows():
            payload = {
                # Sync tags
                "Month": today.strftime("%B %Y"),
                "Week_Date": today.strftime("%d/%m/%Y"),
                
                # Direct metrics from file source row
                "Date": str(row.get("Date", "")),
                "Package name": str(row.get("Package name", package_name)),
                "Daily Device Installs": int(pd.to_numeric(row.get("Daily Device Installs"), errors='coerce') or 0),
                "Daily Device Uninstalls": int(pd.to_numeric(row.get("Daily Device Uninstalls"), errors='coerce') or 0),
                "Daily Device Upgrades": int(pd.to_numeric(row.get("Daily Device Upgrades"), errors='coerce') or 0),
                "Total User Installs": int(pd.to_numeric(row.get("Total User Installs"), errors='coerce') or 0),
                "Daily User Installs": int(pd.to_numeric(row.get("Daily User Installs"), errors='coerce') or 0),
                "Daily User Uninstalls": int(pd.to_numeric(row.get("Daily User Uninstalls"), errors='coerce') or 0),
                "Active Device Installs": int(pd.to_numeric(row.get("Active Device Installs"), errors='coerce') or 0),
                "Install events": int(pd.to_numeric(row.get("Install events"), errors='coerce') or 0),
                "Update events": int(pd.to_numeric(row.get("Update events"), errors='coerce') or 0),
                "Uninstall events": int(pd.to_numeric(row.get("Uninstall events"), errors='coerce') or 0),
            }
            
            write_to_sheet_by_headers(sheet_name, payload)

        return grand_total_user_installs

    except Exception as e:
        print(f"  ❌ Error processing telemetry metrics for {package_name}: {e}")
        return 0

def write_to_sheet_by_headers(sheet_name, data_dict):
    """Appends a row to the sheet mapping dictionary keys straight to the column headers"""
    try:
        credentials = get_gcp_credentials()
        gc          = gspread.authorize(credentials)
        sh          = gc.open_by_key(SPREADSHEET_ID)
        worksheet   = sh.worksheet(sheet_name)
        
        headers = [h.strip() for h in worksheet.row_values(1)]
        
        row_to_append = []
        for header in headers:
            row_to_append.append(data_dict.get(header, ""))
            
        worksheet.append_row(row_to_append, value_input_option='USER_ENTERED')
    except Exception as e:
        print(f"  ❌ Sheet write exception on {sheet_name}: {str(e)}")
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

    total_combined_installs = 0
    dashboard_lines = []

    for app in APPS_CONFIG:
        print(f"\n=======================================================")
        print(f" PROCESSING APP: {app['name']} ({app['package_name']})")
        print(f"=======================================================")
        
        target_sheet = app['monthly_sheet'] if run_mode == "monthly" else app['weekly_sheet']
        
        # Execute processing engine
        android_cumulative = fetch_and_process_gcs_data(app['package_name'], target_sheet, run_mode, today)
        
        total_combined_installs += android_cumulative
        dashboard_lines.append(f"| 🤖 {app['name']} Tally: {android_cumulative:,} installs")

    # ── Build Combined README dashboard ────────────────────────────────
    print("\n--- UPDATING METRICS DASHBOARD ---")
    GOAL      = 50000
    pct       = min(total_combined_installs / GOAL, 1.0)
    filled    = int(round(20 * pct))
    bar       = '█' * filled + '░' * (20 - filled)

    apps_performance_log = "\n".join(dashboard_lines)

    dashboard_content = f"""```text
+-------------------------------------------------------+
| 📱 MOBILE APPS DOWNLOAD TRACKER                       |
+-------------------------------------------------------+
| 📊 LIVE GROWTH PERFORMANCE (Sync Date: {sync_date}) |
+-------------------------------------------------------+
{apps_performance_log}
|
| 🏆 COMBINED GOAL MILESTONE  : {total_combined_installs:,} / {GOAL:,}
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

    print("✅ Full telemetry processing cycle completed successfully.")

except Exception as main_err:
    print(f"\n❌ Pipeline failure: {main_err}")
    raise
