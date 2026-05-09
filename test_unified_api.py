"""
Full integration test for the Unified FastAPI.
Tests: register, login, get_me, scan_text, alerts, analyze/text (raw)
"""
import requests
import uuid
import json

BASE = "http://localhost:8000"
uid = uuid.uuid4().hex[:8]


def section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")


def check(res, expected_status, label):
    ok = res.status_code == expected_status
    icon = "✅" if ok else "❌"
    print(f"{icon} [{res.status_code}] {label}")
    if not ok:
        print(f"   Response: {res.text[:300]}")
    return ok


# ──────────────────────────────────────────────
section("1. REGISTER PARENT")
reg = requests.post(f"{BASE}/api/v1/auth/register", json={
    "email": f"parent_{uid}@gmail.com",
    "username": f"parent_{uid}",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "Parent",
})
check(reg, 201, "Register parent")
if reg.status_code == 201:
    data = reg.json()
    ACCESS_TOKEN = data.get("access_token")
    REFRESH_TOKEN = data.get("refresh_token")
    print(f"   user_id: {data.get('user', {}).get('id')}")
    print(f"   access_token: {ACCESS_TOKEN[:30]}..." if ACCESS_TOKEN else "   NO TOKEN")
else:
    ACCESS_TOKEN = None
    REFRESH_TOKEN = None
    print("   Registration failed, cannot retrieve tokens.")

# ──────────────────────────────────────────────
section("2. LOGIN")
login = requests.post(f"{BASE}/api/v1/auth/login", json={
    "login": f"parent_{uid}@gmail.com",
    "password": "TestPass123!",
})
check(login, 200, "Login with email")
login_data = login.json()
ACCESS_TOKEN = login_data.get("access_token")  # refresh token from login
print(f"   role: {login_data.get('user', {}).get('role')}")

# ──────────────────────────────────────────────
section("3. GET ME")
me = requests.get(f"{BASE}/api/v1/auth/me", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})
check(me, 200, "GET /auth/me")
print(f"   username: {me.json().get('user', {}).get('username')}")

# ──────────────────────────────────────────────
section("4. CREATE CHILD")
child = requests.post(f"{BASE}/api/v1/auth/create-child",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    json={
        "username": f"child_{uid}",
        "password": "ChildPass456!",
        "first_name": "Test",
        "last_name": "Child",
    },
)
check(child, 201, "Create child account")
if child.status_code == 201:
    CHILD_ID = child.json().get("user", {}).get("id")
    print(f"   child_id: {CHILD_ID}")
else:
    CHILD_ID = None

# ──────────────────────────────────────────────
section("5. REFRESH TOKEN")
rt = requests.post(f"{BASE}/api/v1/auth/refresh", json={"refresh_token": REFRESH_TOKEN})
check(rt, 200, "Refresh token")
if rt.status_code == 200:
    ACCESS_TOKEN = rt.json().get("access_token")

# ──────────────────────────────────────────────
section("6. SCAN TEXT (authenticated)")
scan = requests.post(
    f"{BASE}/api/v1/scan/text",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    json={"text": "you are so stupid and worthless"},
)
check(scan, 200, "Scan toxic text")
if scan.status_code == 200:
    s = scan.json()
    print(f"   risk_level: {s.get('risk_level')}")
    print(f"   action: {s.get('status')}")
    print(f"   scan_id: {s.get('scan_id')}")

# ──────────────────────────────────────────────
section("7. SCAN HISTORY")
hist = requests.get(f"{BASE}/api/v1/scan/history",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})
check(hist, 200, "Scan history")
results = hist.json().get("results", [])
print(f"   total scans in history: {len(results)}")

# ──────────────────────────────────────────────
section("8. ALERTS (parent)")
alerts = requests.get(f"{BASE}/api/v1/alerts",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})
check(alerts, 200, "List alerts")
print(f"   alerts found: {len(alerts.json().get('alerts', []))}")

# ──────────────────────────────────────────────
section("9. RAW ANALYZE (no auth — existing endpoint)")
raw = requests.post(f"{BASE}/api/v1/analyze/text",
    json={"text": "hello world", "user_id": "test"})
check(raw, 200, "Raw analyze/text (no auth)")
if raw.status_code == 200:
    r = raw.json()
    print(f"   risk_level: {r.get('risk_level')}")

# ──────────────────────────────────────────────
section("10. USERS/ME")
um = requests.get(f"{BASE}/api/v1/users/me",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})
check(um, 200, "GET /users/me")

# ──────────────────────────────────────────────
section("11. USERS/CHILDREN")
ch = requests.get(f"{BASE}/api/v1/users/children",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})
check(ch, 200, "GET /users/children")
print(f"   children: {len(ch.json().get('children', []))}")

# ──────────────────────────────────────────────
section("12. LOGOUT")
lo = requests.post(f"{BASE}/api/v1/auth/logout",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    json={"refresh_token": rt.json().get("refresh_token") if rt.status_code == 200 else ""})
check(lo, 200, "Logout")

print("\n" + "="*50)
print("  ALL TESTS COMPLETE")
print("="*50 + "\n")
