# Fix Aquasmart Settings Display Issue

## Problem
When clicking settings in Aquasmart module, the breadcrumb shows "ERPNext Settings" instead of "Aquasmart Settings".

## Root Cause
The settings pages are inheriting from ERPNext's setup module instead of Aquasmart's own module configuration.

---

## Solution 1: Check Module Configuration

### Step 1: Verify Aquasmart Module Exists

```bash
# SSH into your server
cd frappe-bench

# Check if aquasmart app exists
ls apps/

# Check module
bench --site juhudi.local console
```

In the console:
```python
import frappe
modules = frappe.get_all('Module Def', fields=['name', 'app_name'])
for m in modules:
    print(m)
```

Look for your Aquasmart module.

---

## Solution 2: Fix DocType Module Assignment

The settings DocTypes might be assigned to wrong module.

### Check Global Defaults Module

```bash
bench --site juhudi.local console
```

```python
import frappe

# Check Global Defaults
doc = frappe.get_doc('DocType', 'Global Defaults')
print(f"Module: {doc.module}")
print(f"App: {doc.get('app_name')}")

# If it shows ERPNext, we need to change it
```

### Fix the Module Assignment

```python
# Update module to Aquasmart
doc = frappe.get_doc('DocType', 'Global Defaults')
doc.module = 'Aquasmart Settings'  # or your module name
doc.save()
frappe.db.commit()
```

---

## Solution 3: Create Custom Aquasmart Settings Module

If Aquasmart doesn't have its own settings module:

### Step 1: Create Module Def

```python
# In bench console
import frappe

# Create new module
module = frappe.get_doc({
    'doctype': 'Module Def',
    'module_name': 'Aquasmart Settings',
    'app_name': 'aquasmart',  # or your app name
    'custom': 0
})
module.insert()
frappe.db.commit()
```

### Step 2: Assign Settings to New Module

```python
# Move Global Defaults to Aquasmart Settings
settings_doctypes = [
    'Global Defaults',
    'System Settings',
    'Email Settings',
    # Add other settings here
]

for doctype_name in settings_doctypes:
    try:
        doc = frappe.get_doc('DocType', doctype_name)
        doc.module = 'Aquasmart Settings'
        doc.save()
        print(f"Updated {doctype_name}")
    except:
        print(f"Could not update {doctype_name}")

frappe.db.commit()
```

---

## Solution 4: Fix Module in Workspace/Page

The issue might be in the Workspace configuration:

### Step 1: Check Aquasmart Workspace

```python
# In bench console
import frappe

# Get Aquasmart workspace
workspace = frappe.get_doc('Workspace', 'Aquasmart')
print(workspace.as_json())

# Check links
for link in workspace.links:
    print(f"{link.label} -> {link.link_to} -> Module: {link.get('module')}")
```

### Step 2: Update Workspace Links

```python
# Update workspace
workspace = frappe.get_doc('Workspace', 'Aquasmart')

for link in workspace.links:
    if link.label == 'Global Defaults':
        link.link_to = 'Global Defaults'
        link.link_type = 'DocType'
        # Don't set module here - it's inherited

workspace.save()
frappe.db.commit()
```

---

## Solution 5: Quick Fix - Update Page Title

If you just want to change what's displayed:

### Method A: Via Console

```python
import frappe

# Update the page title
doc = frappe.get_doc('DocType', 'Global Defaults')
doc.module = 'Aquasmart'
doc.save()
frappe.db.commit()

# Clear cache
frappe.clear_cache()
```

### Method B: Via Database (Advanced)

```sql
-- SSH to server
bench --site juhudi.local mariadb

-- Update module for Global Defaults
UPDATE `tabDocType` 
SET module = 'Aquasmart' 
WHERE name = 'Global Defaults';

-- Check
SELECT name, module FROM `tabDocType` WHERE name = 'Global Defaults';

-- Exit
exit;
```

Then clear cache:
```bash
bench --site juhudi.local clear-cache
```

---

## Solution 6: Check if it's a Custom App Issue

### Find where Aquasmart app is defined

```bash
# Check hooks.py
cat apps/aquasmart/aquasmart/hooks.py

# Look for:
# app_name = "aquasmart"
# app_title = "Aquasmart"
```

### Check modules.txt

```bash
cat apps/aquasmart/aquasmart/modules.txt
```

Should contain your modules like:
```
Aquasmart
Aquasmart Settings
```

If missing, add them:
```bash
echo "Aquasmart Settings" >> apps/aquasmart/aquasmart/modules.txt
```

Then:
```bash
bench --site juhudi.local migrate
bench --site juhudi.local clear-cache
```

---

## Quick Diagnostic Script

Run this to diagnose the issue:

```python
# bench --site juhudi.local console

import frappe

print("\n=== AQUASMART SETTINGS DIAGNOSTIC ===\n")

# 1. Check if Aquasmart module exists
modules = frappe.get_all('Module Def', 
    filters={'app_name': 'aquasmart'}, 
    fields=['name', 'app_name'])
print("Aquasmart Modules:")
for m in modules:
    print(f"  • {m.name} ({m.app_name})")

# 2. Check Global Defaults
gd = frappe.get_doc('DocType', 'Global Defaults')
print(f"\nGlobal Defaults:")
print(f"  Module: {gd.module}")

# 3. Check Workspace
try:
    ws = frappe.get_doc('Workspace', 'Aquasmart')
    print(f"\nAquasmart Workspace:")
    print(f"  Title: {ws.title}")
    print(f"  Module: {ws.module}")
    print(f"\n  Links:")
    for link in ws.links[:5]:  # Show first 5
        print(f"    • {link.label} -> {link.link_to}")
except:
    print("\nAquasmart Workspace not found")

# 4. Recommend fix
print("\n=== RECOMMENDED FIX ===")
print("Run this to fix:")
print("doc = frappe.get_doc('DocType', 'Global Defaults')")
print("doc.module = 'Aquasmart'")
print("doc.save()")
print("frappe.db.commit()")
print("frappe.clear_cache()")
```

---

## Most Likely Quick Fix

**Run these commands on your server:**

```bash
# SSH to server
cd frappe-bench

# Open console
bench --site juhudi.local console
```

Then paste this:

```python
import frappe

# Fix all common settings
settings = ['Global Defaults', 'System Settings', 'Selling Settings', 
            'Buying Settings', 'Stock Settings']

for setting in settings:
    try:
        doc = frappe.get_doc('DocType', setting)
        if doc.module.startswith('ERPNext'):
            doc.module = 'Aquasmart'
            doc.save()
            print(f"✅ Fixed {setting}")
    except Exception as e:
        print(f"⚠️  {setting}: {str(e)}")

frappe.db.commit()
frappe.clear_cache()
print("\n✅ Done! Refresh your browser.")
```

Press `Ctrl+D` to exit console.

Then refresh your browser and check if it says "Aquasmart Settings" now.

---

## If Nothing Works

The issue might be hardcoded in the app. Check:

```bash
# Search for "ERPNext Settings" in Aquasmart code
grep -r "ERPNext Settings" apps/aquasmart/

# If found, replace with "Aquasmart Settings"
```

Or check the workspace JSON:

```bash
bench --site juhudi.local export-fixtures
# Edit the exported workspace file
# Change module names
bench --site juhudi.local import-fixtures
```

---

## Let Me Know

**To help you better, tell me:**

1. Is "Aquasmart" a custom app you installed?
2. Is it in the `apps/` folder?
3. Can you run: `bench --site juhudi.local list-apps`

I'll give you exact commands to fix it!

