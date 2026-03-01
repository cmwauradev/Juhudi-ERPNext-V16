# API Key Setup Guide

## Method 1: Generate via ERPNext UI (Recommended)

1. **Open ERPNext in your browser:**
   ```
   http://localhost:8000
   ```

2. **Login as Administrator**
   - Username: `Administrator`
   - Password: (your admin password)

3. **Navigate to User Settings:**
   - Click on your profile icon (top right)
   - Go to: **User** → **Administrator** (or your user)
   - Or directly visit: http://localhost:8000/app/user/Administrator

4. **Generate API Keys:**
   - Scroll down to the **API Access** section
   - Click the **"Generate Keys"** button
   - A popup will show your API Key and API Secret
   - **IMPORTANT:** Copy both values immediately - the secret won't be shown again!

5. **Save your keys:**
   - Copy the API Key
   - Copy the API Secret
   - Update the `.env` file with these values

---

## Method 2: Generate via Bench Console (Quick)

Run this command in your terminal:

```bash
bench --site localhost console
```

Then paste this Python code:

```python
from frappe.core.doctype.user.user import generate_keys

# Generate keys for Administrator
api_key, api_secret = generate_keys("Administrator")

print("\n" + "="*60)
print("API KEY:", api_key)
print("API SECRET:", api_secret)
print("="*60)
print("\nCopy these values to your .env file!")
print("="*60)
```

Press `Ctrl+D` to exit the console.

---

## Method 3: Automated Script (Easiest)

I can create a script to do this automatically. Just run:

```bash
bench --site localhost execute frappe.core.doctype.user.user.generate_keys --args '["Administrator"]'
```

---

## After Getting Your Keys

Update the `.env` file:

```bash
ERPNEXT_URL=http://localhost:8000
ERPNEXT_API_KEY=your_actual_api_key_here
ERPNEXT_API_SECRET=your_actual_api_secret_here
ERPNEXT_COMPANY=Your Company
```

Then test the connection:

```bash
node test_connection.js
```

---

## Troubleshooting

### If you get "User does not exist" error:
Check available users:
```bash
bench --site localhost console
```
```python
import frappe
users = frappe.get_all("User", filters={"enabled": 1}, fields=["name", "email"])
for user in users:
    print(user)
```

### If keys already exist:
They will be regenerated. Old keys will stop working.

### Security Note:
- Keep your API keys secret
- Don't commit `.env` to version control
- The `.env` file is already in `.gitignore`
