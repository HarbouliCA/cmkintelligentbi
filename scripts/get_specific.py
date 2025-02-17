import requests
import json
import os
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
from datetime import datetime

load_dotenv()

FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
CLIENT_NAME = os.getenv("CLIENT_NAME")
API_VERSION = "v22.0"
ADSET_ID = "120203887612730221"


def upload_to_blob(data, filename):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_CONTAINER_NAME, blob=filename)
        blob_client.upload_blob(json.dumps(data, indent=2), overwrite=True)
        return True
    except Exception as e:
        print(f"Erreur Blob Storage: {str(e)}")
        return False

def get_facebook_data(endpoint, params=None):
    try:
        url = f"https://graph.facebook.com/{API_VERSION}/{endpoint}"
        params = params or {}
        params["access_token"] = FACEBOOK_ACCESS_TOKEN
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erreur API Facebook: {str(e)}")
        return None

def get_specific_adset():
    try:
        # 1. Récupération des insights uniquement (pas d'accès direct à l'AdSet)
        insights_data = get_facebook_data(f"{ADSET_ID}/insights", {
            "fields": "reach,objective,spend,cpc,cpm,cpp,ctr,cost_per_unique_outbound_click,impressions,clicks,actions",
            "date_preset": "last_30d",
            "level": "adset"
        })

        if not insights_data or "data" not in insights_data:
            raise Exception("Données d'insights non disponibles")

        # 2. Structure des données
        combined_data = {
            "extraction_date": datetime.now().isoformat(),
            "adset_id": ADSET_ID,
            "performance_data": insights_data.get("data", [])
        }

        # 3. Upload
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{CLIENT_NAME}/specific_adset/adset_{ADSET_ID}_{timestamp}.json"
        
        if upload_to_blob(combined_data, filename):
            print(f"Données uploadées: {filename}")
        
        return combined_data

    except Exception as e:
        print(f"Erreur lors de l'extraction: {str(e)}")
        return None

if __name__ == "__main__":
    print("Démarrage de l'extraction...")
    result = get_specific_adset()
    if result:
        print("Extraction terminée avec succès.")
    else:
        print("Échec de l'extraction.")