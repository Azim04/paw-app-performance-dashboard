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

# Original package fallback if env variable is used elsewhere
DEFAULT_PACKAGE_NAME = os.getenv("ANDROID_PACKAGE_NAME")

# Mapping configurations for both mobile applications
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
        raise ValueError("❌ Critical Error: The environment variable 'GCP_SERVICE_ACCOUNT_KEY' is completely empty or missing from the GitHub runner environment.")
    info = json.loads(GCP_KEY_JSON)
    return service_account.Credentials.from_service_account_info(
        info,
        scopes=[
            "https://www.googleapis.com/auth/cloud-platform",
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    )

def fetch_google_cumulative(package_name):
    """Sum Install events across all monthly GCS overview files for a specific package"""
    if not package_name:
        print("  ⚠️ Package name missing. Skipping fetch.")
        return 0
    try:
        credentials = get_gcp_credentials()
        client      = storage.Client(credentials=credentials)
        prefix      = f"stats/installs/installs_{package_name}_"
        all_blobs   = list(client.list_blobs(GOOGLE_BUCKET_NAME, prefix=prefix))
        overview_blobs = [b for b in all_blobs if b.name.endswith('_overview.csv')]
        print(f"  Found {len(overview_blobs)} monthly overview files for {package_name}")

        running_totals = {}
        for blob in sorted(overview_blobs, key=lambda b: b.name):
            try:
                content = blob.download_as_text()
                df      = pd.read_csv(io.StringIO(content))
                
                # 👇 NEW PRINT STATEMENT: Outputs the contents of the fetched CSV file 👇
                print(f"\n--- 📄 Content Preview for blob: {blob.name} ---")
                print(df.head(5).to_string())  # Prints the first 5 rows cleanly in the console
                print("-" * 60 + "\n")
                
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
        print(f"  ❌ Google cumulative exception for {package_name}: {e}")
        return 0


def write_to_sheet_by_headers(sheet_name, data_dict):
    """Appends a row to the sheet mapping dictionary keys straight to the column headers"""
    try:
        credentials = get_gcp_credentials()
        gc          = gspread.authorize(credentials)
        sh          = gc.open_by_key(SPREADSHEET_ID)
        worksheet   = sh.worksheet(sheet_name)
        
        # Read the top row of headers from the sheet
        headers = [h.strip() for h in worksheet.row_values(1)]
        
        # Build out a row matched perfectly to the sheet's columns
        row_to_append = []
        for header in headers:
            row_to_append.append(data_dict.get(header, ""))
            
        worksheet.append_row(row_to_append, value_input_option='USER_ENTERED')
        print(f"  ✅ Written to {sheet_name} matching headers: {data_dict}")
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

    # Loop through each configured application sequentially
    for app in APPS_CONFIG:
        print(f"\n=======================================================")
        print(f" PROCESSING APP: {app['name']} ({app['package_name']})")
        print(f"=======================================================")
        
        if not app['package_name']:
            print("❌ Skipping application profile: Package name variable is unassigned.")
            continue

        # ── Fetch Android data ────────────────────────────────────────────
        print("--- ANDROID FETCH ---")
        android_cumulative = fetch_google_cumulative(app['package_name'])
        print(f"  ✅ Android cumulative : {android_cumulative:,}")
        
        # Add to cumulative tracker across all applications
        total_combined_installs += android_cumulative
        dashboard_lines.append(f"| 🤖 {app['name']} Tally: {android_cumulative:,} installs")

        # ── Write to Google Sheet ─────────────────────────────────────────
        print("--- SHEET WRITE ---")
        if run_mode == "monthly":
            month_label = today.strftime("%B %Y")  # e.g., "June 2026"
            
            payload = {
                "Month": month_label,
                "Android": android_cumulative
            }
            write_to_sheet_by_headers(app['monthly_sheet'], payload)
            print(f"  📅 Monthly row written for {app['name']} to {app['monthly_sheet']}")

        elif run_mode == "weekly":
            week_label = today.strftime("%d/%m/%Y")
            
            payload = {
                "Week_Date": week_label,
                "Android_Weekly": android_cumulative 
            }
            write_to_sheet_by_headers(app['weekly_sheet'], payload)
            print(f"  📅 Weekly row written for {app['name']} to {app['weekly_sheet']}")

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

    print("✅ README update cycle sequence finished successfully.")

except Exception as main_err:
    print(f"\n❌ Pipeline failure: {main_err}")
    raise
