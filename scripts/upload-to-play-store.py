#!/usr/bin/env python3
"""
Upload an AAB to Google Play Internal Testing track via the Google Play API.
First submission must be done via code since the web UI requires manual file upload.
"""
import sys
import os

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
except ImportError:
    print("ERROR: Missing dependencies. Run: pip3 install google-api-python-client google-auth")
    sys.exit(1)

# Configuration
KEY_FILE = os.path.join(os.path.dirname(__file__), '..', 'google-play-key.json')
AAB_FILE = os.path.join(os.path.dirname(__file__), '..', 'ecrin-virtuel-release.aab')
PACKAGE_NAME = 'com.inferencevision.lecrinvirtuel'
TRACK = 'internal'

def main():
    print(f"🔑 Loading service account key from: {KEY_FILE}")
    
    # Authenticate
    credentials = service_account.Credentials.from_service_account_file(
        KEY_FILE,
        scopes=['https://www.googleapis.com/auth/androidpublisher']
    )
    
    # Build the service
    service = build('androidpublisher', 'v3', credentials=credentials, cache_discovery=False)
    
    print(f"📦 Package: {PACKAGE_NAME}")
    print(f"📁 AAB file: {AAB_FILE} ({os.path.getsize(AAB_FILE) / 1024 / 1024:.1f} MB)")
    
    # Create an edit
    print("\n1️⃣  Creating edit...")
    edit = service.edits().insert(packageName=PACKAGE_NAME, body={}).execute()
    edit_id = edit['id']
    print(f"   ✅ Edit ID: {edit_id}")
    
    # Upload the AAB
    print("\n2️⃣  Uploading AAB (this may take a minute)...")
    media = MediaFileUpload(
        AAB_FILE,
        mimetype='application/octet-stream',
        resumable=True,
        chunksize=5 * 1024 * 1024  # 5MB chunks
    )
    
    upload = service.edits().bundles().upload(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        media_body=media
    ).execute()
    
    version_code = upload['versionCode']
    print(f"   ✅ AAB uploaded! Version code: {version_code}")
    
    # Set the track
    print(f"\n3️⃣  Setting '{TRACK}' track...")
    track_body = {
        'releases': [{
            'name': '1.0.0 (1)',
            'status': 'draft',
            'releaseNotes': [
                {'language': 'fr-FR', 'text': "Version initiale de l'application"}
            ],
            'versionCodes': [str(version_code)]
        }]
    }
    
    track_result = service.edits().tracks().update(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        track=TRACK,
        body=track_body
    ).execute()
    
    print(f"   ✅ Track updated: {track_result['track']}")
    
    # Commit the edit
    print("\n4️⃣  Committing edit...")
    commit_result = service.edits().commit(
        packageName=PACKAGE_NAME,
        editId=edit_id
    ).execute()
    
    print(f"   ✅ Edit committed: {commit_result['id']}")
    print("\n🎉 SUCCESS! The AAB has been uploaded to Google Play Internal Testing.")
    print(f"   Package: {PACKAGE_NAME}")
    print(f"   Track: {TRACK}")
    print(f"   Version code: {version_code}")
    print("\n   ℹ️  The release is in 'draft' status. Go to Google Play Console to promote it.")

if __name__ == '__main__':
    main()
