"""
Quick Python test to probe the registration endpoint against the Atlas-backed backend.
Run this while the backend (port 3002) and frontend (port 3000) are running.
"""
import requests, json, uuid

BASE = "http://localhost:3000"
uid = uuid.uuid4().hex[:8]

def test_register():
    print("=== Atlas-Backed Registration Test ===\n")
    payload = {
        "name": f"Test User {uid}",
        "username": f"testuser_{uid}",
        "email": f"test_{uid}@hubble.dev",
        "password": "TestPass123!"
    }
    print(f"Registering: {payload['email']}")
    res = requests.post(f"{BASE}/api/auth/register", json=payload, timeout=15)
    print(f"Status: {res.status_code}")
    try:
        body = res.json()
        print(json.dumps(body, indent=2))
        if res.status_code in (200, 201):
            print("\n✅ Registration SUCCESS — user written to Atlas")
        else:
            print(f"\n❌ Registration FAILED — {body.get('message', body.get('error', 'Unknown error'))}")
    except Exception:
        print("Raw response:", res.text[:500])

if __name__ == "__main__":
    test_register()
