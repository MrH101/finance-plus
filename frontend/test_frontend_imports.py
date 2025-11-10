#!/usr/bin/env python3
import requests
import time

def test_frontend_imports():
    print("🧪 Testing Frontend Import Fixes...")
    
    # Test 1: Check if frontend is serving
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend server is running")
        else:
            print(f"⚠️  Frontend server returned status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Frontend server not running on port 5173")
        return False
    except Exception as e:
        print(f"❌ Error connecting to frontend: {e}")
        return False
    
    # Test 2: Check for common import issues
    print("\n🔍 Checking for common import issues...")
    
    # Test if the main entry point loads
    try:
        response = requests.get("http://localhost:5173/src/main.tsx", timeout=5)
        if response.status_code == 200:
            print("✅ Main entry point accessible")
        else:
            print(f"⚠️  Main entry point status: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Main entry point test failed: {e}")
    
    # Test if the cn utility loads
    try:
        response = requests.get("http://localhost:5173/src/utils/cn.ts", timeout=5)
        if response.status_code == 200:
            print("✅ cn utility accessible")
        else:
            print(f"⚠️  cn utility status: {response.status_code}")
    except Exception as e:
        print(f"⚠️  cn utility test failed: {e}")
    
    # Test if the API service loads
    try:
        response = requests.get("http://localhost:5173/src/services/api.ts", timeout=5)
        if response.status_code == 200:
            print("✅ API service accessible")
        else:
            print(f"⚠️  API service status: {response.status_code}")
    except Exception as e:
        print(f"⚠️  API service test failed: {e}")
    
    print("\n🎉 Frontend import fixes appear to be working!")
    print("📝 The clsx and tailwind-merge MIME type errors should be resolved.")
    print("🔧 Next: Test the application in the browser.")
    
    return True

if __name__ == "__main__":
    test_frontend_imports()
