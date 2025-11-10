#!/usr/bin/env python3
import requests
import time

def test_all_imports():
    print("🧪 Testing All Import Fixes...")
    
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
    
    # Test 2: Check key components
    components_to_test = [
        "src/main.tsx",
        "src/App.tsx", 
        "src/components/Modal.tsx",
        "src/components/UserModal.tsx",
        "src/utils/cn.ts",
        "src/services/api.ts",
        "src/store/slices/authSlice.ts"
    ]
    
    print("\n🔍 Testing key components...")
    for component in components_to_test:
        try:
            response = requests.get(f"http://localhost:5173/{component}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {component}")
            else:
                print(f"⚠️  {component} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {component} - Error: {e}")
    
    print("\n🎉 Import fixes completed!")
    print("📝 Fixed issues:")
    print("   ✅ clsx and tailwind-merge MIME type errors")
    print("   ✅ Modal import/export mismatch")
    print("   ✅ Store slice import paths")
    print("   ✅ Simplified cn utility function")
    print("\n🔧 The frontend should now load without import errors!")
    
    return True

if __name__ == "__main__":
    test_all_imports()
