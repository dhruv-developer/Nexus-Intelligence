#!/usr/bin/env python3
"""
Script to upload generated CSV datasets to the backend API.
"""

import os
import requests
import json
from pathlib import Path

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
DATASETS_DIR = "generated_datasets"
API_ENDPOINT = f"{BACKEND_URL}/api/v1/datasets/upload"

# User credentials (you'll need to register/login first)
# For now, we'll use a test user ID
TEST_USER_ID = "ac67a87f-b5b1-4b27-ba03-5911d946e8ac"  # From the logs

def upload_csv_file(file_path: str, user_id: str):
    """Upload a single CSV file to the backend."""
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'text/csv')}
            data = {
                'user_id': user_id,
                'name': os.path.basename(file_path).replace('.csv', ''),
                'description': f"Realistic {os.path.basename(file_path).replace('.csv', '')} data for testing"
            }
            
            response = requests.post(API_ENDPOINT, files=files, data=data)
            
            if response.status_code == 200:
                print(f"Successfully uploaded {os.path.basename(file_path)}")
                print(f"Response: {response.json()}")
            else:
                print(f"Failed to upload {os.path.basename(file_path)}")
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"Error uploading {os.path.basename(file_path)}: {e}")

def main():
    """Upload all CSV files in the generated_datasets directory."""
    print("Starting dataset upload to backend...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Datasets Directory: {DATASETS_DIR}")
    
    # Check if backend is running
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        if response.status_code != 200:
            print("Backend is not responding correctly. Please make sure it's running.")
            return
    except requests.exceptions.RequestException:
        print("Cannot connect to backend. Please make sure the backend is running on http://127.0.0.1:8000")
        return
    
    # Find all CSV files
    datasets_path = Path(DATASETS_DIR)
    if not datasets_path.exists():
        print(f"Datasets directory '{DATASETS_DIR}' not found. Please run the dataset generator first.")
        return
    
    csv_files = list(datasets_path.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in '{DATASETS_DIR}' directory.")
        return
    
    print(f"Found {len(csv_files)} CSV files to upload:")
    for file in csv_files:
        print(f"  - {file.name}")
    
    # Upload each file
    for csv_file in csv_files:
        print(f"\nUploading {csv_file.name}...")
        upload_csv_file(str(csv_file), TEST_USER_ID)
    
    print("\nUpload process completed!")

if __name__ == "__main__":
    main()
