import os
import re
import json
import datetime
import io
import pandas as pd
from google.oauth2 import service_account
from google.cloud import storage

# ----------------------------------------------------------------------
# 1. ENVIRONMENT VARIABLES
# ----------------------------------------------------------------------
GOOGLE_BUCKET_NAME   = os.getenv("GOOGLE_BUCKET_NAME")   # pubsite_prod_5000038799006733268
ANDROID_PACKAGE_NAME = os.getenv("ANDROID_PACKAGE_NAME") # com.wedding.planner
GCP_KEY_JSON         = os.getenv("GCP_SERVICE_ACCOUNT_KEY")

# iOS — update this number monthly from App Store Connect → Trends → Sales
IOS_TOTAL_DOWNLOADS  = 2775

# ----------------------------------------------------------------------
# 2. GOOGLE FETCH ENGINE
# ----------------------------------------------------------------------

def fetch_google_cumulative():
    try:
        info        = json.loads(GCP_KEY_JSON)
        credentials = service_account.Credentials.from_service_account_info(info)
        client      = storage.Client(credentials=credentials)
        bucket      = client.bucket(GOOGLE_BUCKET_NAME)

        # List all overview files for this package
        prefix    = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_"
        all_blobs = list(client.list_blobs(GOOGLE_BUCKET_NAME, prefix=prefix))
        
        # Filter to only _overview files
        overview_blobs = [b for b in all_blobs if b.name.endswith('_overview.csv')]
        print(f"  Found {len(overview_blobs)} monthly overview files")

        total_installs = 0
        for blob in sorted(overview_blobs, key=lambda b: b.name):
            try:
                content = blob.download_as_text()
                df      = pd.read_csv(io.StringIO(content))
                if 'Daily User Installs' in df.columns:
                    month_installs = pd.to_numeric(
                        df['Daily User Installs'], errors='coerce'
                    ).fillna(0).sum()
                    print(f"  {blob.name.split('_')[-2]}: {int(month_installs)} installs")
                    total_installs += int(month_installs)
            except Exception as e:
                print(f"  ⚠️ Skipped {blob.name}: {e}")

        print(f"  📊 Grand total installs: {total_installs}")
        return total_installs

    except Exception as e:
        print(f"  ❌ Google cumulative exception: {e}")
        import traceback
        traceback.print_exc()
        return 0
        
def fetch_real_google_data(year_month):
    try:
        info        = json.loads(GCP_KEY_JSON)
        credentials = service_account.Credentials.from_service_account_info(info)
        client      = storage.Client(credentials=credentials)
        bucket      = client.bucket(GOOGLE_BUCKET_NAME)

        blob_path = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_{year_month}_overview.csv"
        print(f"  Attempting path   : {blob_path}")
        blob   = bucket.blob(blob_path)
        exists = blob.exists()
        print(f"  Exists            : {exists}")

        if not exists:
            prev      = datetime.datetime.utcnow().replace(day=1) - datetime.timedelta(days=1)
            prev_ym   = prev.strftime("%Y%m")
            blob_path = f"stats/installs/installs_{ANDROID_PACKAGE_NAME}_{prev_ym}_overview.csv"
            print(f"  Trying prev month : {blob_path}")
            blob   = bucket.blob(blob_path)
            exists = blob.exists()
            print(f"  Exists            : {exists}")

        if exists:
            data_content = blob.download_as_text()
            df = pd.read_csv(io.StringIO(data_content))
            print(f"  Columns           : {list(df.columns)}")
            print(f"  Rows              : {len(df)}")
            print(f"  Full content      :\n{df.to_string()}")

            # Extract total installs from last row
            if 'Total User Installs' in df.columns:
                total = pd.to_numeric(df['Total User Installs'], errors='coerce').fillna(0).iloc[-1]
                return int(total)
            else:
                print(f"  ⚠️ 'Total User Installs' not found. Columns: {list(df.columns)}")
                return 0

        print("  ⚠️ No blob found for current or previous month")
        return 0

    except Exception as e:
        print(f"  ❌ Google exception: {e}")
        import traceback
        traceback.print_exc()
        return 0


# ----------------------------------------------------------------------
# 3. CORE PROCESSING PIPELINE
# ----------------------------------------------------------------------
try:
    today         = datetime.datetime.utcnow()
    target_ym_str = today.strftime("%Y%m")
    sync_date     = today.strftime("%Y-%m-%d")

    print(f"🕐 Sync Date    : {sync_date}")
    print(f"🕐 Target month : {target_ym_str}")

    # ── Google ───────────────────────────────────────────────────────
    print("\n--- GOOGLE FETCH START ---")
    print(f"  GOOGLE_BUCKET_NAME   : {'SET' if GOOGLE_BUCKET_NAME else '❌ MISSING'}")
    print(f"  ANDROID_PACKAGE_NAME : {'SET' if ANDROID_PACKAGE_NAME else '❌ MISSING'}")
    print(f"  GCP_KEY_JSON         : {'SET (length=' + str(len(GCP_KEY_JSON)) + ')' if GCP_KEY_JSON else '❌ MISSING'}")

    android_live_units = fetch_google_cumulative()
    print(f"  ✅ Google result     : {android_live_units}")

    # ── Apple (manual) ────────────────────────────────────────────────
    print("\n--- APPLE (MANUAL) ---")
    ios_live_units = IOS_TOTAL_DOWNLOADS
    print(f"  ✅ iOS total (manual): {ios_live_units}")

    # ── Fallback check ───────────────────────────────────────────────
    print("\n--- FALLBACK CHECK ---")
    if android_live_units == 0:
        print("  ⚠️ Android returned 0 — check logs above for root cause")
        android_live_units = 0  # show real zero, no fake fallback
    else:
        print(f"  ✅ Android live value: {android_live_units}")

    # ── Progress bar ─────────────────────────────────────────────────
    GOAL           = 50000
    combined_total = ios_live_units + android_live_units
    percentage     = min(combined_total / GOAL, 1.0)
    filled         = int(round(20 * percentage))
    bar            = '█' * filled + '░' * (20 - filled)

    # ── Build dashboard ───────────────────────────────────────────────
    dashboard_content = f"""```text
+-------------------------------------------------------+
| 📱 MOBILE APPS DOWNLOAD TRACKER                       |
+-------------------------------------------------------+
| 📊 LIVE GROWTH PERFORMANCE (Sync Date: {sync_date}) |
+-------------------------------------------------------+
| 🍏 iOS Cumulative App Store : {ios_live_units:,} units
| 🤖 Android Google Play Tally: {android_live_units:,} installs
|
| 🏆 GOAL MILESTONE           : {combined_total:,} / {GOAL:,}
| Milestone Progress         : [{bar}] {int(percentage * 100)}%
+-------------------------------------------------------+
```"""

    # ── Write to README ───────────────────────────────────────────────
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()

    updated_readme = re.sub(
        r'<!--START_DASHBOARD-->.*?<!--END_DASHBOARD-->',
        f'<!--START_DASHBOARD-->\n{dashboard_content}\n<!--END_DASHBOARD-->',
        readme,
        flags=re.DOTALL
    )

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(updated_readme)

    print("\n✅ README updated successfully.")

except Exception as main_err:
    print(f"\n❌ Pipeline failure: {main_err}")
    raise
