# Complete Cache Clear Instructions for ERPNext

## ✅ Backend Confirmed Working!

The server is correctly returning `"label": "Human Resource"` in the API response.
The issue is **browser-side caching** (Local Storage, Service Workers, or IndexedDB).

---

## 🔧 Complete Browser Cache Clear (Step-by-Step)

### **Method 1: Clear All Site Data (RECOMMENDED)**

#### **For Chrome/Edge:**
1. **Open Developer Tools**: Press `F12` or `Ctrl+Shift+I`
2. **Go to Application tab**
3. **In the left sidebar**, find "Storage"
4. **Click "Clear site data"** button
5. **Check all boxes**:
   - ✅ Local and session storage
   - ✅ IndexedDB
   - ✅ Web SQL
   - ✅ Cookies
   - ✅ Cache storage
   - ✅ Service workers
6. **Click "Clear site data"**
7. **Close Developer Tools**
8. **Hard refresh**: `Ctrl+Shift+R`

#### **For Firefox:**
1. **Open Developer Tools**: Press `F12`
2. **Go to Storage tab**
3. **Right-click on your site URL** (in the left sidebar)
4. **Select "Delete All"**
5. **Go to Application → Service Workers**
6. **Click "Unregister"** for any service workers
7. **Close Developer Tools**
8. **Hard refresh**: `Ctrl+Shift+R`

#### **For Safari:**
1. **Open Web Inspector**: `Cmd+Option+I`
2. **Go to Storage tab**
3. **Click "Delete All" for each storage type**:
   - Local Storage
   - Session Storage
   - IndexedDB
   - Service Workers
4. **Close Web Inspector**
5. **Hard refresh**: `Cmd+Shift+R`

---

### **Method 2: Using Browser Console (FASTEST)**

1. **Open ERPNext in your browser**
2. **Press `F12`** to open Developer Tools
3. **Go to Console tab**
4. **Paste this code and press Enter**:

```javascript
// Clear all local storage
localStorage.clear();

// Clear all session storage
sessionStorage.clear();

// Unregister service workers
navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
        registration.unregister();
        console.log('Unregistered service worker');
    }
});

// Clear IndexedDB
indexedDB.databases().then(databases => {
    databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log('Deleted database:', db.name);
    });
});

console.log('✅ All caches cleared! Now reload the page with Ctrl+Shift+R');
```

5. **Wait for the console to show "✅ All caches cleared!"**
6. **Hard refresh**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

### **Method 3: Incognito/Private Window Test**

To verify it's a caching issue:

1. **Open Incognito/Private window**:
   - Chrome/Edge: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`
   - Safari: `Cmd+Shift+N`

2. **Navigate to your ERPNext URL**
3. **Login**
4. **Check if you see "Human Resource"**

If you see "Human Resource" in incognito mode, it confirms it's a cache issue in your normal browser.

---

### **Method 4: Complete Browser Reset (NUCLEAR OPTION)**

Only if nothing else works:

1. **Completely close your browser** (all windows and tabs)
2. **Reopen the browser**
3. **Go to Settings → Privacy → Clear browsing data**
4. **Select "All time"**
5. **Check**:
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
6. **Click "Clear data"**
7. **Restart browser**
8. **Go to ERPNext and login fresh**

---

## 🎯 What You Should See After Clearing Cache

### **Before (Cached):**
```html
<div class="icon-title" data-original-title="Frappe HR">Frappe HR</div>
```

### **After (Fresh):**
```html
<div class="icon-title" data-original-title="Human Resource">Human Resource</div>
```

---

## ✅ Verification Checklist

After clearing cache, verify these:

1. **Desktop Icon Label**: Should show "Human Resource"
2. **Tooltip on hover**: Should show "Human Resource"
3. **Child icons parent reference**: Should reference "Human Resource"

---

## 🆘 Still Not Working?

If you've tried all methods and still see "Frappe HR":

1. **Check browser console for errors**: Press `F12` → Console tab
2. **Take a screenshot** of the console
3. **Check Network tab**: See what API response you're getting
4. **Try a different browser** to isolate the issue

---

## 📝 Technical Details

The API is returning the correct data:
```json
{
  "label": "Human Resource",
  "name": "Frappe HR",
  "link": "/desk/people",
  "app": "hrms"
}
```

The issue is that your browser has cached the old label in:
- Local Storage
- Service Workers
- IndexedDB
- Or browser HTTP cache

---

**After trying Method 2 (Console Script), please let me know if you see "Human Resource"!**
