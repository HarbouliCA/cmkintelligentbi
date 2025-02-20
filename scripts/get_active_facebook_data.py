import requests
import json
import os
import time
import uuid
from datetime import datetime, timedelta
import pandas as pd
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient

# ------------------------------------------------------------------------------
# Load environment variables from .env file
# ------------------------------------------------------------------------------
load_dotenv()

# ------------------------------------------------------------------------------
# Configuration and Setup
# ------------------------------------------------------------------------------
# Facebook API credentials from environment variables
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
FACEBOOK_AD_ACCOUNT_ID = os.getenv("FACEBOOK_AD_ACCOUNT_ID")

# Azure Blob Storage credentials from environment variables
# Ensure that AZURE_CONTAINER_NAME is set to "pleyabeauty"
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
CLIENT_NAME = os.getenv("CLIENT_NAME")

# API Version
API_VERSION = "v22.0"

# State file & incremental configuration
STATE_FILE = "last_run.txt"
OVERLAP_DAYS = 1  # Overlap period (in days) to re-query recent data for retroactive updates

# API call sleep and rate limit parameters
DEFAULT_SLEEP = 10           # Default sleep (seconds) between individual API calls
RATE_LIMIT_THRESHOLD = 80    # Threshold (% usage) at which to pause for rate limiting
RATE_LIMIT_SLEEP = 300       # Sleep duration (seconds) if rate limit threshold is exceeded

# Maximum number of retries for an API call
MAX_RETRIES = 7

# Queue file to store failed campaign processing attempts
QUEUE_FILE = "failed_campaigns_queue.json"

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------
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

def get_facebook_data(endpoint, params=None, max_retries=MAX_RETRIES):
    """
    Retrieves data from the Facebook API with retry logic and exponential backoff.
    If a rate limit error (or other transient error) is encountered, the function waits longer before retrying.
    """
    retries = 0
    backoff = 5  # initial backoff in seconds
    while retries < max_retries:
        try:
            url = f"https://graph.facebook.com/{API_VERSION}/{endpoint}"
            params = params or {}
            params["access_token"] = FACEBOOK_ACCESS_TOKEN
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Check if the API returned an error in the JSON response
            if "error" in data:
                error = data["error"]
                # Check for rate limit error (code 17 and error_subcode 2446079)
                if error.get("code") == 17 or error.get("error_subcode") == 2446079:
                    print("Rate limit reached: ", error.get("message"))
                    print("Sleeping for 300 seconds before retrying...")
                    time.sleep(300)
                    retries += 1
                    continue
                else:
                    print(f"API returned error: {error}")
                    return None

            check_rate_limits(response)
            return data

        except requests.exceptions.RequestException as e:
            print(f"Error during API call to {endpoint}: {e}")
            print(f"Sleeping for {backoff} seconds before retrying...")
            time.sleep(backoff)
            retries += 1
            backoff *= 2  # exponential backoff

        except json.JSONDecodeError as e:
            print(f"Error decoding JSON response from {endpoint}: {e}")
            return None

    print(f"Max retries reached for endpoint: {endpoint}")
    return None

def get_last_run_time(state_file=STATE_FILE):
    """
    Reads the last run timestamp from a file.
    Defaults to 49 days ago if no state is found.
    """
    if os.path.exists(state_file):
        try:
            with open(state_file, "r") as f:
                ts = f.read().strip()
                return datetime.fromisoformat(ts)
        except Exception as e:
            print(f"Error reading state file, defaulting to 49 days ago: {e}")
    return datetime.now() - timedelta(days=49)

def update_last_run_time(new_time, state_file=STATE_FILE):
    """
    Writes the new run timestamp to a file.
    """
    try:
        with open(state_file, "w") as f:
            f.write(new_time.isoformat())
    except Exception as e:
        print(f"Error updating state file: {e}")

def add_campaign_to_queue(campaign):
    """
    Adds the given campaign to a queue file for later processing.
    The queue file is a JSON file (failed_campaigns_queue.json) that stores a list of campaign records.
    """
    record = {"campaign_id": campaign["id"], "campaign_name": campaign["name"]}
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r") as f:
            try:
                queue = json.load(f)
            except json.JSONDecodeError:
                queue = []
    else:
        queue = []
    # Avoid duplicate entries in the queue
    if any(item["campaign_id"] == campaign["id"] for item in queue):
        print(f"Campaign {campaign['name']} ({campaign['id']}) is already in the queue.")
    else:
        queue.append(record)
        with open(QUEUE_FILE, "w") as f:
            json.dump(queue, f, indent=4)
        print(f"Campaign {campaign['name']} ({campaign['id']}) added to queue for later processing.")

# ------------------------------------------------------------------------------
# Data Transformation Class and CSV Upload Function
# ------------------------------------------------------------------------------
class FacebookDataTransformer:
    def __init__(self):
        self.campaigns_df = pd.DataFrame()
        self.adsets_df = pd.DataFrame()
        self.ads_df = pd.DataFrame()
        self.insights_df = pd.DataFrame()
        self.actions_df = pd.DataFrame()
        self.targeting_df = pd.DataFrame()

    def transform_campaign(self, campaign_data):
        return pd.DataFrame([{
            'campaign_id': campaign_data['id'],
            'campaign_name': campaign_data['name'],
            'status': campaign_data.get('status'),
            'objective': campaign_data.get('objective')
        }])

    def transform_adset(self, adset_data, campaign_id):
        return pd.DataFrame([{
            'adset_id': adset_data['id'],
            'campaign_id': campaign_id,
            'adset_name': adset_data['name']
        }])

    def transform_targeting(self, targeting_data, adset_id):
        interests = []
        if 'flexible_spec' in targeting_data:
            for spec in targeting_data['flexible_spec']:
                if 'interests' in spec:
                    interests.extend([i['name'] for i in spec['interests']])
        return pd.DataFrame([{
            'targeting_id': str(uuid.uuid4()),
            'adset_id': adset_id,
            'age_min': targeting_data.get('age_min'),
            'age_max': targeting_data.get('age_max'),
            'genders': str(targeting_data.get('genders')),
            'interests': ','.join(interests),
            'geo_locations': str(targeting_data.get('geo_locations'))
        }])

    def transform_ad(self, ad_data, adset_id):
        return pd.DataFrame([{
            'ad_id': ad_data['id'],
            'adset_id': adset_id,
            'ad_name': ad_data['name'],
            'status': ad_data.get('effective_status', 'unknown')
        }])

    def transform_insights(self, insights_data, ad_id):
        rows = []
        for insight in insights_data.get('data', []):
            base_row = {
                'insight_id': str(uuid.uuid4()),
                'ad_id': ad_id,
                'date_start': insight.get('date_start'),
                'date_stop': insight.get('date_stop'),
                'spend': float(insight.get('spend', 0)),
                'impressions': int(insight.get('impressions', 0)),
                'clicks': int(insight.get('clicks', 0)),
                'ctr': float(insight.get('ctr', 0)),
                'reach': int(insight.get('reach', 0)),
                'frequency': float(insight.get('frequency', 0)),
                'cpc': float(insight.get('cpc', 0)),
                'cpm': float(insight.get('cpm', 0)),
                'age': insight.get('age'),
                'gender': insight.get('gender')
            }
            rows.append(base_row)
            # Process actions separately
            if 'actions' in insight:
                for action in insight['actions']:
                    self.actions_df = pd.concat([self.actions_df, pd.DataFrame([{
                        'action_id': str(uuid.uuid4()),
                        'insight_id': base_row['insight_id'],
                        'action_type': action.get('action_type'),
                        'value': int(float(action.get('value', 0)))
                    }])], ignore_index=True)
        return pd.DataFrame(rows)

def upload_dataframe_to_blob(df, table_name, folder_name):
    """
    Upload a DataFrame in CSV format to Azure Blob Storage.
    Files will be stored under the 'csv' folder in the container.
    """
    try:
        csv_data = df.to_csv(index=False)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = f"csv/{folder_name}/{table_name}/{timestamp}.csv"
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_CONTAINER_NAME, blob=file_path)
        blob_client.upload_blob(csv_data, overwrite=True)
        print(f"Table '{table_name}' uploaded to: {file_path}")
        return True
    except Exception as e:
        print(f"Error uploading {table_name} to Blob Storage: {e}")
        return False

# ------------------------------------------------------------------------------
# Main Function
# ------------------------------------------------------------------------------
def main():
    """
    Extracts data from the Facebook API, transforms the data into DataFrames,
    and uploads the resulting CSV tables to Azure Blob Storage under the 'csv' folder.
    
    If an API call fails (for example, retrieving adsets for a campaign), the campaign is
    added to a queue (failed_campaigns_queue.json) for later reprocessing.
    """
    print("Starting Facebook data extraction and transformation...")
    start_time = datetime.now()

    # Calculate incremental time range
    last_run_time = get_last_run_time()
    start_date = datetime(2025, 1, 1)
    end_date = datetime.now()
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    print(f"Fetching insights data from {start_date_str} to {end_date_str}")

    transformer = FacebookDataTransformer()

    # 1. Get Campaigns
    limit = 300  # Adjust limit as needed   
    campaigns_endpoint = f"{FACEBOOK_AD_ACCOUNT_ID}/campaigns"
    campaigns_params = {"fields": "id,name,status,objective", "limit": limit}
    campaigns_data = get_facebook_data(campaigns_endpoint, campaigns_params)

    if campaigns_data and "data" in campaigns_data:
        for campaign in campaigns_data["data"]:
            if campaign.get('status') != 'ACTIVE':
                continue
            campaign_name = campaign["name"].replace("/", "_")
            print(f"Processing campaign: {campaign_name} ({campaign['id']})")
            campaign_df = transformer.transform_campaign(campaign)
            transformer.campaigns_df = pd.concat([transformer.campaigns_df, campaign_df], ignore_index=True)

            # 2. Get AdSets for the campaign (including targeting info)
            adsets_endpoint = f"{campaign['id']}/adsets"
            adsets_params = {"fields": "id,name,targeting"}
            adsets_data = get_facebook_data(adsets_endpoint, adsets_params)

            if adsets_data is None:
                # If adsets API call fails after max retries, add campaign to the queue and skip further processing.
                print(f"Failed to retrieve adsets for campaign: {campaign_name} ({campaign['id']}). Adding to queue for later processing.")
                add_campaign_to_queue(campaign)
                continue

            if "data" in adsets_data:
                for adset in adsets_data["data"]:
                    adset_name = adset["name"].replace("/", "_")
                    print(f"  Processing adset: {adset_name} ({adset['id']})")
                    adset_df = transformer.transform_adset(adset, campaign["id"])
                    transformer.adsets_df = pd.concat([transformer.adsets_df, adset_df], ignore_index=True)

                    # Transform and accumulate targeting information
                    targeting = adset.get("targeting", {})
                    targeting_df = transformer.transform_targeting(targeting, adset["id"])
                    transformer.targeting_df = pd.concat([transformer.targeting_df, targeting_df], ignore_index=True)

                    # 3. Get Ads for the adset
                    ads_endpoint = f"{adset['id']}/ads"
                    ads_params = {"fields": "id,name,effective_status"}
                    ads_data = get_facebook_data(ads_endpoint, ads_params)

                    if ads_data and "data" in ads_data:
                        for ad in ads_data["data"]:
                            ad_name = ad["name"].replace("/", "_")
                            print(f"    Processing ad: {ad_name} ({ad['id']}) - Status: {ad.get('effective_status', 'unknown')}")
                            ad_df = transformer.transform_ad(ad, adset["id"])
                            transformer.ads_df = pd.concat([transformer.ads_df, ad_df], ignore_index=True)

                            # 4. Get Insights for the ad (for the incremental time range)
                            insights_endpoint = f"{ad['id']}/insights"
                            insights_params = {
                                "fields": (
                                    "campaign_name,adset_name,ad_name,spend,cpc,cpm,clicks,"
                                    "impressions,reach,frequency,conversions,conversion_values,"
                                    "objective,campaign_id,actions,action_values,dda_results,ctr,"
                                    "date_start,date_stop,account_currency"
                                ),
                                "breakdowns": "age,gender",
                                "time_range": json.dumps({"since": start_date_str, "until": end_date_str}),
                                "level": "ad",
                            }
                            insights_data = get_facebook_data(insights_endpoint, insights_params)

                            if insights_data and "data" in insights_data:
                                insights_df = transformer.transform_insights(insights_data, ad["id"])
                                transformer.insights_df = pd.concat([transformer.insights_df, insights_df], ignore_index=True)
                            else:
                                print(f"    No insights data found for ad: {ad_name} ({ad['id']})")

                            time.sleep(DEFAULT_SLEEP)
                    else:
                        print(f"  No ads found for adset: {adset_name} ({adset['id']})")
            else:
                print(f"  No adsets data found for campaign: {campaign_name} ({campaign['id']})")
    else:
        print("No campaigns found.")

# Upload all DataFrames as CSV files to Azure Blob Storage under the "csv" folder.
    folder_name = "api"
    tables = {
        'campaigns': transformer.campaigns_df,
        'adsets': transformer.adsets_df,
        'ads': transformer.ads_df,
        'insights': transformer.insights_df,
        'actions': transformer.actions_df,
        'targeting': transformer.targeting_df
    }

    for table_name, df in tables.items():
        if not df.empty:
            upload_dataframe_to_blob(df, table_name, folder_name)
        else:
            print(f"Table '{table_name}' is empty and was not uploaded.")

    update_last_run_time(end_date)
    end_time = datetime.now()
    total_time = end_time - start_time
    print("Finished Facebook data extraction, transformation, and upload to Azure Blob Storage.")
    print("Total time taken:", total_time)

if __name__ == "__main__":
    main()
