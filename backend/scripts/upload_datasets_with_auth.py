#!/usr/bin/env python3
"""
Script to register a test user and upload generated CSV datasets to the backend API.
"""

import os
import requests
import json
from pathlib import Path

# Configuration
BACKEND_URL = "http://127.0.0.1:8000"
DATASETS_DIR = "generated_datasets"

# Test user credentials
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
}

def register_user():
    """Register a test user."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/register",
            json=TEST_USER
        )
        
        if response.status_code == 200:
            print("Successfully registered test user")
            return response.json()
        elif response.status_code == 400 and "already registered" in response.text:
            print("User already exists, proceeding to login")
            return login_user()
        else:
            print(f"Failed to register user: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error registering user: {e}")
        return None

def login_user():
    """Login and get access token."""
    try:
        login_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            print("Successfully logged in")
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"Failed to login: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error logging in: {e}")
        return None

def upload_csv_file(file_path: str, access_token: str):
    """Upload a single CSV file to the backend."""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'text/csv')}
            data = {
                'name': os.path.basename(file_path).replace('.csv', ''),
                'description': f"Realistic {os.path.basename(file_path).replace('.csv', '')} data for testing"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/v1/datasets/upload", 
                files=files, 
                data=data,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"Successfully uploaded {os.path.basename(file_path)}")
                return True
            else:
                print(f"Failed to upload {os.path.basename(file_path)}")
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"Error uploading {os.path.basename(file_path)}: {e}")
        return False

def main():
    """Register user and upload all CSV files."""
    print("Starting dataset upload process...")
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
    
    # Register/login user
    print("\n1. Setting up authentication...")
    access_token = login_user()
    
    if not access_token:
        print("Authentication failed. Cannot proceed with upload.")
        return
    
    print(f"Authentication successful!")
    
    # Find all CSV files
    datasets_path = Path(DATASETS_DIR)
    if not datasets_path.exists():
        print(f"Datasets directory '{DATASETS_DIR}' not found. Please run the dataset generator first.")
        return
    
    csv_files = list(datasets_path.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in '{DATASETS_DIR}' directory.")
        return
    
    print(f"\n2. Found {len(csv_files)} CSV files to upload:")
    for file in csv_files:
        print(f"  - {file.name}")
    
    # Upload each file
    print(f"\n3. Uploading datasets...")
    successful_uploads = 0
    for csv_file in csv_files:
        print(f"Uploading {csv_file.name}...")
        if upload_csv_file(str(csv_file), access_token):
            successful_uploads += 1
    
    print(f"\nUpload process completed!")
    print(f"Successfully uploaded: {successful_uploads}/{len(csv_files)} files")
    
    if successful_uploads > 0:
        print(f"\nYou can now view the uploaded datasets in the frontend application!")
        print(f"Login with: {TEST_USER['email']} / {TEST_USER['password']}")

if __name__ == "__main__":
    main()
