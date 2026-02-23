# 2FA SMS-Only Customization Summary

## Changes Made

### Modified File:
`apps/frappe/frappe/core/doctype/system_settings/system_settings.json`

### What Was Changed:
Modified the `two_factor_method` field to restrict Two Factor Authentication to **SMS only**.

**Before:**
```json
{
  "default": "OTP App",
  "depends_on": "enable_two_factor_auth",
  "description": "Choose authentication method to be used by all users",
  "fieldname": "two_factor_method",
  "fieldtype": "Select",
  "label": "Two Factor Authentication method",
  "options": "OTP App\nSMS\nEmail"
}
```

**After:**
```json
{
  "default": "SMS",
  "depends_on": "enable_two_factor_auth",
  "description": "Choose authentication method to be used by all users",
  "fieldname": "two_factor_method",
  "fieldtype": "Select",
  "label": "Two Factor Authentication method",
  "options": "SMS"
}
```

## Impact:
- ✅ Users will only see "SMS" as an option for 2FA in System Settings
- ✅ Default 2FA method is now SMS (changed from OTP App)
- ✅ OTP App and Email options are no longer available
- ✅ Existing login.js code handles SMS verification automatically

## How to Use:
1. Go to **Settings → System Settings**
2. Scroll to **Login** section
3. Enable **Two Factor Authentication**
4. The **Two Factor Authentication method** field will only show "SMS"
5. Configure SMS settings in your site

## Prerequisites:
Make sure you have SMS gateway configured in your ERPNext/Frappe instance for SMS delivery.

## Date Modified:
2026-02-23
