# Browser Cache Clearing Instructions

## Issue: Still Seeing "Frappe HR" Instead of "Human Resource"

**Status:** ✅ Database is correctly updated to "Human Resource"  
**Problem:** Browser is showing cached version

---

## ✅ Confirmed: Database is Correct

The backend database shows:
- Desktop Icon Label: **"Human Resource"** ✓
- Last Modified: 2026-02-23 23:57:43
- No references to "Frappe HR" in workspaces or modules

---

## 🔄 How to Clear Browser Cache

### Method 1: Hard Refresh (Quickest)

**Windows/Linux:**
1. Press `Ctrl + Shift + R`
2. Or `Ctrl + F5`

**Mac:**
1. Press `Cmd + Shift + R`
2. Or `Cmd + Option + R`

---

### Method 2: Clear Browser Cache Completely

#### **Google Chrome:**
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Select "Cached images and files"
3. Time range: "Last hour" or "All time"
4. Click "Clear data"
5. Refresh the ERPNext page

#### **Firefox:**
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Select "Cache"
3. Time range: "Everything"
4. Click "Clear Now"
5. Refresh the ERPNext page

#### **Safari:**
1. Go to Safari → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Press `Cmd + Option + E` to empty caches
4. Refresh the ERPNext page

#### **Microsoft Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear now"
4. Refresh the ERPNext page

---

### Method 3: Incognito/Private Mode (Test)

This confirms if it's a caching issue:

1. Open an **Incognito/Private window**:
   - Chrome: `Ctrl + Shift + N` (or `Cmd + Shift + N` on Mac)
   - Firefox: `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac)
   - Safari: `Cmd + Shift + N`
   - Edge: `Ctrl + Shift + N`

2. Login to ERPNext
3. Check if you see "Human Resource"

If you see "Human Resource" in incognito mode, it's definitely a cache issue.

---

### Method 4: Logout and Login

1. Click on your profile picture (top right)
2. Click "Logout"
3. Close all browser tabs with ERPNext
4. Open a new tab
5. Login again
6. Check the sidebar

---

### Method 5: Disable Browser Cache (Developer Mode)

For Chrome/Edge:
1. Press `F12` to open Developer Tools
2. Go to "Network" tab
3. Check "Disable cache" checkbox
4. Keep DevTools open
5. Refresh the page with `Ctrl + R`

---

## 🔍 How to Verify the Change

After clearing cache, you should see:

### ✅ In the Sidebar:
- Look for **"Human Resource"** icon
- Should have the same icon and color as before
- Links to `/desk/people`

### ✅ In App Launcher:
- Grid view should show **"Human Resource"**
- Should be in the same position as "Frappe HR" was

### ✅ Child Items Still Work:
These should still be accessible under "Human Resource":
- People
- Payroll
- Recruitment
- Performance
- Shift & Attendance
- Leaves
- Expenses
- Tenure
- Tax & Benefits

---

## 🐛 Still Not Working?

If you've tried all methods above and still see "Frappe HR":

### Check Browser Extensions
Some extensions cache aggressively:
1. Try disabling all extensions temporarily
2. Refresh the page
3. Re-enable extensions one by one

### Check Network Issues
1. Open DevTools (`F12`)
2. Go to Network tab
3. Refresh the page
4. Look for any failed requests (red items)

### Server-Side Cache
Run these commands on the server:
```bash
bench --site localhost clear-cache
bench --site localhost clear-website-cache
bench restart
```

### Contact Support
If none of the above works:
1. Take a screenshot showing "Frappe HR"
2. Open DevTools Console (`F12` → Console tab)
3. Look for any error messages
4. Share these details for further troubleshooting

---

## 📝 Technical Details

**What Changed:**
- Database field `tabDesktop Icon.label` for record "Frappe HR"
- Changed from: "Frappe HR"
- Changed to: "Human Resource"
- Last modified: 2026-02-23 23:57:43

**What Stayed the Same:**
- Internal name: "Frappe HR" (used as database key)
- Link: `/desk/people`
- Icon, color, all functionality

**Why Browser Shows Old Version:**
- Browsers cache JSON responses, CSS, and JavaScript
- The desktop icon data is cached
- Hard refresh forces browser to fetch fresh data

---

## ✅ Success Indicators

You'll know it worked when:
1. Sidebar shows "Human Resource" instead of "Frappe HR"
2. All child items (People, Payroll, etc.) still work
3. Clicking the icon still goes to `/desk/people`
4. No functionality is broken
