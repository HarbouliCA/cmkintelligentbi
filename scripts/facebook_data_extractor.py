import requests
import json
import os
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
import time
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# -----------------------------------------------------------------------------  
# Configuration and Setup
# -----------------------------------------------------------------------------  

# Facebook API credentials from environment variables
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
FACEBOOK_AD_ACCOUNT_ID = os.getenv("FACEBOOK_AD_ACCOUNT_ID")

# Azure Blob Storage credentials from environment variables
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
CLIENT_NAME = os.getenv("CLIENT_NAME")

# API Version
API_VERSION = "v22.0"

# State file & incremental configuration
STATE_FILE = "last_run.txt"
OVERLAP_DAYS = 1            # Overlap period (in days) to re-query recent data for retroactive updates
BATCH_INTERVAL = 15         # Interval in minutes between each batch of API requests (adjustable)
DEFAULT_SLEEP = 5           # Default sleep (seconds) between individual API calls
RATE_LIMIT_THRESHOLD = 80   # Threshold (% usage) at which to pause for rate limiting
RATE_LIMIT_SLEEP = 60       # Sleep duration (seconds) if rate limit threshold is exceeded

# -----------------------------------------------------------------------------  
# Helper Functions
# -----------------------------------------------------------------------------  

def check_rate_limits(response):
    """
    Checks the X-App-Usage header from the Facebook API response.
    If any metric (call_count, total_time, or total_cputime) exceeds the threshold,
    the function will sleep for RATE_LIMIT_SLEEP seconds.
    """
    if "X-App-Usage" in response.headers:
        try:
            usage = json.loads(response.headers["X-App-Usage"])
            call_count = usage.get("call_count", 0)
            total_time = usage.get("total_time", 0)
            total_cputime = usage.get("total_cputime", 0)
            if (call_count > RATE_LIMIT_THRESHOLD or 
                total_time > RATE_LIMIT_THRESHOLD or 
                total_cputime > RATE_LIMIT_THRESHOLD):
                print(f"Approaching rate limit (usage: {usage}), sleeping for {RATE_LIMIT_SLEEP} seconds...")
                time.sleep(RATE_LIMIT_SLEEP)
        except Exception as e:
            print("Error parsing X-App-Usage header:", e)

def get_facebook_data(endpoint, params=None):
    """
    Retrieves data from the Facebook API with error handling and rate-limit checks.
    """
    try:
        url = f"https://graph.facebook.com/{API_VERSION}/{endpoint}"
        params = params or {}
        params["access_token"] = FACEBOOK_ACCESS_TOKEN
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        check_rate_limits(response)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error during API call to {endpoint}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON response from {endpoint}: {e}")
        return None

def upload_to_blob_storage(data, file_path):
    """
    Uploads data to Azure Blob Storage.
    """
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_CONTAINER_NAME, blob=file_path)
        blob_client.upload_blob(json.dumps(data, indent=4), overwrite=True)
        print(f"Data uploaded to: {file_path}")
        return True
    except Exception as e:
        print(f"Error uploading to Blob Storage for {file_path}: {e}")
        return False

def create_blob_path(campaign_name, adset_name, ad_name):
    """
    Creates a unique blob path based on the current timestamp and campaign details.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    return f"{CLIENT_NAME}/{campaign_name}/{adset_name}/{ad_name}/{timestamp}.json"

def get_last_run_time(state_file=STATE_FILE):
    """
    Reads the last run timestamp from a file.
    Defaults to 2 days ago if no state is found.
    """
    if os.path.exists(state_file):
        try:
            with open(state_file, "r") as f:
                ts = f.read().strip()
                return datetime.fromisoformat(ts)
        except Exception as e:
            print(f"Error reading state file, defaulting to 2 days ago: {e}")
    return datetime.now() - timedelta(days=2)

def update_last_run_time(new_time, state_file=STATE_FILE):
    """
    Writes the new run timestamp to a file.
    """
    try:
        with open(state_file, "w") as f:
            f.write(new_time.isoformat())
    except Exception as e:
        print(f"Error updating state file: {e}")

# -----------------------------------------------------------------------------  
# Batch Processing Functions
# -----------------------------------------------------------------------------  

def process_batch(data_batch):
    """
    Process a batch of API requests. Each item in data_batch is a tuple:
    (campaign_name, adset_name, ad_name, combined_data)
    """
    for campaign_name, adset_name, ad_name, combined_data in data_batch:
        file_path = create_blob_path(campaign_name, adset_name, ad_name)
        upload_to_blob_storage(combined_data, file_path)
        time.sleep(DEFAULT_SLEEP)  # Respect default sleep between calls

def divide_into_batches(data, batch_size):
    """
    Divide the data into batches of size batch_size.
    """
    return [data[i:i + batch_size] for i in range(0, len(data), batch_size)]

# -----------------------------------------------------------------------------  
# Main Function
# -----------------------------------------------------------------------------  

def main():
    """
    Extracts insights and targeting data from Facebook API, divides the work into batches,
    and uploads the data to Azure Blob Storage. Batches are processed at set intervals.
    Also tracks the total time taken for the process.
    """
    print("Starting Facebook data extraction and upload to Azure Blob Storage...")
    start_time = datetime.now()

    # Calculate incremental time range
    last_run_time = get_last_run_time()
    start_date = last_run_time - timedelta(days=OVERLAP_DAYS)
    end_date = datetime.now()
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    print(f"Fetching insights data from {start_date} to {end_date}")

    # 1. Get Campaigns
    limit = 300  # Adjust limit as needed   
    campaigns_endpoint = f"{FACEBOOK_AD_ACCOUNT_ID}/campaigns?"
    campaigns_params = {"fields": "id,name,status,objective", "limit": limit}
    campaigns_data = get_facebook_data(campaigns_endpoint, campaigns_params)

    all_data = []  # To store all combined (insights + targeting) data

    if campaigns_data and "data" in campaigns_data:
        for campaign in campaigns_data["data"]:
            campaign_id = campaign["id"]
            campaign_name = campaign["name"].replace("/", "_")
            print(f"Processing campaign: {campaign_name} ({campaign_id})")

            # 2. Get AdSets for the campaign (including targeting info)
            adsets_endpoint = f"{campaign_id}/adsets"
            adsets_params = {"fields": "id,name,targeting"}
            adsets_data = get_facebook_data(adsets_endpoint, adsets_params)

            if adsets_data and "data" in adsets_data:
                for adset in adsets_data["data"]:
                    adset_id = adset["id"]
                    adset_name = adset["name"].replace("/", "_")
                    print(f"  Processing adset: {adset_name} ({adset_id})")
                    targeting_info = adset.get("targeting", {})
                    print(f"    Targeting Information for adset {adset_name}:")
                    print(json.dumps(targeting_info, indent=4))

                    # 3. Get Ads for the adset
                    ads_endpoint = f"{adset_id}/ads"
                    ads_params = {"fields": "id,name,effective_status"}
                    ads_data = get_facebook_data(ads_endpoint, ads_params)

                    if ads_data and "data" in ads_data:
                        for ad in ads_data["data"]:
                            ad_id = ad["id"]
                            ad_name = ad["name"].replace("/", "_")
                            ad_status = ad.get("effective_status", "unknown")
                            print(f"   Processing ad: {ad_name} ({ad_id}) - Status: {ad_status}")

                            # 4. Get Insights (Ad Level) for the incremental time range
                            insights_endpoint = f"{FACEBOOK_AD_ACCOUNT_ID}/insights"
                            insights_params = {
                                "fields": "campaign_name,adset_name,ad_name,spend,cpc,cpm,clicks,impressions,reach,frequency,conversions,conversion_values,objective,campaign_id,actions,action_values,dda_results,ctr",
                                "breakdowns": "age",
                                "time_range": json.dumps({"since": start_date_str, "until": end_date_str}),
                                "level": "ad",
                            }
                            insights_data = get_facebook_data(insights_endpoint, insights_params)

                            if insights_data and "data" in insights_data:
                                insights_data["ad_status"] = ad_status
                                combined_data = {
                                    "insights": insights_data,
                                    "targeting": targeting_info,
                                    "ad_status": ad_status
                                }
                                all_data.append((campaign_name, adset_name, ad_name, combined_data))
                            else:
                                print(f"   No insights data found for ad: {ad_name} ({ad_id})")
                            time.sleep(DEFAULT_SLEEP)
                    else:
                        print(f"   No ads found for adset: {adset_name} ({adset_id})")
            else:
                print(f"  No adsets found for campaign: {campaign_name} ({campaign_id})")
    else:
        print("No campaigns found.")

    # Divide all collected data into batches
    batch_size = 10  # Adjust batch size as needed
    batches = divide_into_batches(all_data, batch_size)

    # Process each batch at the configured interval
    for i, batch in enumerate(batches):
        print(f"Processing batch {i+1}/{len(batches)}")
        process_batch(batch)
        if i < len(batches) - 1:
            print(f"Waiting {BATCH_INTERVAL} minutes before processing the next batch...")
            time.sleep(BATCH_INTERVAL * 60)

    # Update the state file for the next incremental run
    update_last_run_time(end_date)
    end_time = datetime.now()
    total_time = end_time - start_time
    print("Finished Facebook data extraction and upload to Azure Blob Storage.")
    print("Total time taken:", total_time)

if __name__ == "__main__":
    main()
