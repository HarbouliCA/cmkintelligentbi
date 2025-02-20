import json
import os
import time
from datetime import datetime, timedelta
import pandas as pd
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient

# Import necessary functions and classes from facebook_data_extractor.py
from facebook_data_extractor import (
    get_facebook_data,
    FacebookDataTransformer,
    upload_dataframe_to_blob,
    get_last_run_time,
    update_last_run_time,
    add_campaign_to_queue,
    STATE_FILE,
    DEFAULT_SLEEP,
    QUEUE_FILE,
    AZURE_STORAGE_CONNECTION_STRING,
    AZURE_CONTAINER_NAME,
    FACEBOOK_ACCESS_TOKEN,
    FACEBOOK_AD_ACCOUNT_ID,
    API_VERSION,
    OVERLAP_DAYS,
    MAX_RETRIES,
    RATE_LIMIT_THRESHOLD,
    RATE_LIMIT_SLEEP
)

load_dotenv()

def process_campaign(campaign):
    print(f"Reprocessing campaign: {campaign['campaign_name']} ({campaign['campaign_id']})")

    transformer = FacebookDataTransformer()

    # Calculate incremental time range
    last_run_time = get_last_run_time()
    start_date = last_run_time - timedelta(days=OVERLAP_DAYS)
    end_date = datetime.now()
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    # 1. Get AdSets for the campaign (including targeting info)
    adsets_endpoint = f"{campaign['campaign_id']}/adsets"
    adsets_params = {"fields": "id,name,targeting"}
    adsets_data = get_facebook_data(adsets_endpoint, adsets_params)

    if adsets_data is None:
        print(f"Failed to retrieve adsets for campaign: {campaign['campaign_name']} ({campaign['campaign_id']}). Adding to queue for later processing.")
        add_campaign_to_queue(campaign)
        return False

    if "data" in adsets_data:
        for adset in adsets_data["data"]:
            adset_name = adset["name"].replace("/", "_")
            print(f"  Processing adset: {adset_name} ({adset['id']})")
            adset_df = transformer.transform_adset(adset, campaign["campaign_id"])
            transformer.adsets_df = pd.concat([transformer.adsets_df, adset_df], ignore_index=True)

            # Transform and accumulate targeting information
            targeting = adset.get("targeting", {})
            targeting_df = transformer.transform_targeting(targeting, adset["id"])
            transformer.targeting_df = pd.concat([transformer.targeting_df, targeting_df], ignore_index=True)

            # 2. Get Ads for the adset
            ads_endpoint = f"{adset['id']}/ads"
            ads_params = {"fields": "id,name,effective_status"}
            ads_data = get_facebook_data(ads_endpoint, ads_params)

            if ads_data and "data" in ads_data:
                for ad in ads_data["data"]:
                    ad_name = ad["name"].replace("/", "_")
                    print(f"    Processing ad: {ad_name} ({ad['id']}) - Status: {ad.get('effective_status', 'unknown')}")
                    ad_df = transformer.transform_ad(ad, adset["id"])
                    transformer.ads_df = pd.concat([transformer.ads_df, ad_df], ignore_index=True)

                    # 3. Get Insights for the ad (for the incremental time range)
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
        print(f"  No adsets data found for campaign: {campaign['campaign_name']} ({campaign['campaign_id']})")

    # Upload all DataFrames as CSV files to Azure Blob Storage under the "csv" folder.
    folder_name = datetime.now().strftime("%Y-%m-%d")
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

    return True

def load_queue():
    if os.path.exists(QUEUE_FILE):
        with open(QUEUE_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_queue(queue):
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=4)

def process_failed_campaigns():
    queue = load_queue()
    if not queue:
        print("No failed campaigns in the queue.")
        return

    remaining_queue = []
    for campaign in queue:
        success = process_campaign(campaign)
        if not success:
            remaining_queue.append(campaign)
        else:
            print(f"Successfully processed campaign: {campaign['campaign_name']} ({campaign['campaign_id']})")

    # Save the remaining campaigns back to the queue file
    save_queue(remaining_queue)
    print("Finished processing failed campaigns.")

if __name__ == "__main__":
    process_failed_campaigns()
