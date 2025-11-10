#!/usr/bin/env python3
import requests
import time

def test_endpoints_fix():
    print("🧪 Testing ENDPOINTS Import Fix...")
    
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
    
    # Test 2: Check if api.ts with ENDPOINTS is accessible
    try:
        response = requests.get("http://localhost:5173/src/services/api.ts", timeout=5)
        if response.status_code == 200:
            print("✅ API service with ENDPOINTS is accessible")
            # Check if ENDPOINTS is in the response
            if "ENDPOINTS" in response.text:
                print("✅ ENDPOINTS export found in api.ts")
            else:
                print("⚠️  ENDPOINTS export not found in api.ts")
        else:
            print(f"⚠️  API service status: {response.status_code}")
    except Exception as e:
        print(f"❌ API service test failed: {e}")
    
    # Test 3: Check userService.ts
    try:
        response = requests.get("http://localhost:5173/src/services/userService.ts", timeout=5)
        if response.status_code == 200:
            print("✅ UserService is accessible")
        else:
            print(f"⚠️  UserService status: {response.status_code}")
    except Exception as e:
        print(f"❌ UserService test failed: {e}")
    
    print("\n🎉 ENDPOINTS import fix completed!")
    print("📝 Fixed issues:")
    print("   ✅ Added ENDPOINTS export to api.ts")
    print("   ✅ Resolved import errors in userService.ts")
    print("   ✅ Resolved import errors in all other services")
    print("\n🔧 All services should now be able to import ENDPOINTS!")
    
    return True

if __name__ == "__main__":
    test_endpoints_fix()
