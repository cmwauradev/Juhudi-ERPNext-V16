# Complete Guide to User Permissions for Multi-Branch/Multi-Company Scenarios

## 📚 Table of Contents
1. [Understanding User Permissions](#understanding-user-permissions)
2. [User Permissions vs Role Permissions](#user-permissions-vs-role-permissions)
3. [Multi-Company Setup](#multi-company-setup)
4. [Multi-Branch Setup](#multi-branch-setup)
5. [Practical Examples](#practical-examples)
6. [Programmatic Setup](#programmatic-setup)
7. [Troubleshooting](#troubleshooting)

---

## 1. Understanding User Permissions

**User Permissions** are record-level restrictions that limit which specific documents a user can access, even if their role gives them general access.

### Key Concepts:
- **Role Permissions** = What you CAN do (Read, Write, Create, etc.)
- **User Permissions** = What records you CAN see (Company A, Branch B, etc.)

**Formula:**
```
Actual Access = Role Permissions ∩ User Permissions
```

---

## 2. User Permissions vs Role Permissions

| Feature | Role Permissions | User Permissions |
|---------|-----------------|------------------|
| **Scope** | DocType-level (all documents) | Record-level (specific documents) |
| **Controls** | Actions (read, write, create) | Data visibility (which records) |
| **Example** | "Can read Sales Orders" | "Can only see Sales Orders from Branch A" |
| **Set By** | Role Permission Manager | User Permission Manager |
| **Applies To** | All users with that role | Individual users |

---

## 3. Multi-Company Setup

### Scenario: Multiple Companies in One ERPNext Instance

**Business Case:** You have 3 companies using the same ERPNext instance:
- Company A (Headquarters)
- Company B (Subsidiary 1)
- Company C (Subsidiary 2)

### Step-by-Step Setup:

#### **Step 1: Create Companies**
```
Setup → Company → New Company

Company A: ABC Corporation
Company B: ABC Retail Ltd
Company C: ABC Manufacturing Ltd
```

#### **Step 2: Create Users**
```
Users:
- john@abc.com (Works for Company A only)
- sarah@abc.com (Works for Company B only)
- admin@abc.com (Can see all companies)
```

#### **Step 3: Apply User Permissions**

**Via UI:**
1. Go to **User Permission Manager** (search in awesome bar)
2. Select User: `john@abc.com`
3. Click **Add User Permission**
4. Set:
   - **Allow**: Company
   - **For Value**: ABC Corporation
   - **Is Default**: ✓ (checked)

**Result:** John can only create/view documents for ABC Corporation.

**Via Code:**
```python
import frappe

# Add user permission for Company A to john@abc.com
frappe.get_doc({
    "doctype": "User Permission",
    "user": "john@abc.com",
    "allow": "Company",
    "for_value": "ABC Corporation",
    "is_default": 1
}).insert(ignore_permissions=True)

frappe.db.commit()
```

#### **Step 4: Set Default Company**
In User master → **Defaults** section:
- Default Company: ABC Corporation

---

## 4. Multi-Branch Setup

### Scenario: One Company with Multiple Branches

**Business Case:** ABC Corporation has 3 branches:
- Head Office (Delhi)
- Branch 1 (Mumbai)
- Branch 2 (Bangalore)

### Step-by-Step Setup:

#### **Step 1: Create Branches (Warehouses or Cost Centers)**

**Option A: Using Warehouses**
```
Stock → Warehouse → New

- Head Office Warehouse
- Mumbai Branch Warehouse
- Bangalore Branch Warehouse
```

**Option B: Using Cost Centers**
```
Accounts → Cost Center → New

- Delhi Branch
- Mumbai Branch
- Bangalore Branch
```

#### **Step 2: Create Branch-Specific Users**

```
Users:
- delhi.manager@abc.com (Delhi branch only)
- mumbai.manager@abc.com (Mumbai branch only)
- regional.head@abc.com (Delhi + Mumbai)
```

#### **Step 3: Apply User Permissions**

**For Mumbai Branch Manager:**
```python
import frappe

user = "mumbai.manager@abc.com"

# Restrict to Mumbai Warehouse
frappe.get_doc({
    "doctype": "User Permission",
    "user": user,
    "allow": "Warehouse",
    "for_value": "Mumbai Branch Warehouse",
    "is_default": 1
}).insert(ignore_permissions=True)

# Also restrict to Mumbai Cost Center
frappe.get_doc({
    "doctype": "User Permission",
    "user": user,
    "allow": "Cost Center",
    "for_value": "Mumbai Branch",
    "is_default": 1
}).insert(ignore_permissions=True)

frappe.db.commit()
```

**Result:** Mumbai manager can only see/create documents related to Mumbai branch.

---

## 5. Practical Examples

### Example 1: Sales Person Restrictions

**Requirement:** Each sales person should only see their own customers and sales orders.

**Setup:**
```python
import frappe

def setup_salesperson_permissions(user_email, salesperson_name):
    """Restrict user to see only their customers and sales orders"""
    
    # Restrict to specific salesperson
    frappe.get_doc({
        "doctype": "User Permission",
        "user": user_email,
        "allow": "Sales Person",
        "for_value": salesperson_name,
        "is_default": 1
    }).insert(ignore_permissions=True)
    
    # Get all customers assigned to this salesperson
    customers = frappe.get_all(
        "Customer",
        filters={"default_sales_partner": salesperson_name},
        pluck="name"
    )
    
    # Add user permission for each customer
    for customer in customers:
        frappe.get_doc({
            "doctype": "User Permission",
            "user": user_email,
            "allow": "Customer",
            "for_value": customer
        }).insert(ignore_permissions=True)
    
    frappe.db.commit()

# Usage
setup_salesperson_permissions("rajesh@abc.com", "Rajesh Kumar")
```

### Example 2: Regional Manager (Multiple Branches)

**Requirement:** Regional manager oversees Delhi and Mumbai branches.

**Setup:**
```python
import frappe

def setup_regional_manager(user_email, branches):
    """Give access to multiple branches"""
    
    for branch in branches:
        # Add warehouse permission
        frappe.get_doc({
            "doctype": "User Permission",
            "user": user_email,
            "allow": "Warehouse",
            "for_value": f"{branch} Warehouse",
            "is_default": branch == branches[0]  # First branch is default
        }).insert(ignore_permissions=True)
        
        # Add cost center permission
        frappe.get_doc({
            "doctype": "User Permission",
            "user": user_email,
            "allow": "Cost Center",
            "for_value": branch,
            "is_default": branch == branches[0]
        }).insert(ignore_permissions=True)
    
    frappe.db.commit()

# Usage
setup_regional_manager("regional.head@abc.com", ["Delhi Branch", "Mumbai Branch"])
```

### Example 3: Department-Based Access

**Requirement:** HR users should only see employees from their department.

**Setup:**
```python
import frappe

def setup_department_access(user_email, department):
    """Restrict user to see only employees from their department"""
    
    # Add department permission
    frappe.get_doc({
        "doctype": "User Permission",
        "user": user_email,
        "allow": "Department",
        "for_value": department,
        "is_default": 1
    }).insert(ignore_permissions=True)
    
    frappe.db.commit()

# Usage
setup_department_access("hr.manager@abc.com", "Human Resources")
```

---

## 6. Programmatic Setup

### Bulk User Permission Setup

**Script to set up permissions for multiple users:**

```python
#!/usr/bin/env python3
"""
Bulk User Permission Setup Script
Run this from bench console or as a scheduled job
"""

import frappe
from frappe import _

def bulk_setup_user_permissions(permission_mapping):
    """
    Set up user permissions for multiple users at once
    
    Args:
        permission_mapping (dict): Format:
            {
                "user@example.com": {
                    "Company": ["Company A", "Company B"],
                    "Warehouse": ["Warehouse 1"],
                    "Cost Center": ["Main - CA"]
                }
            }
    """
    
    for user, permissions in permission_mapping.items():
        # Verify user exists
        if not frappe.db.exists("User", user):
            print(f"⚠️  User {user} does not exist. Skipping...")
            continue
        
        print(f"\n🔧 Setting up permissions for: {user}")
        
        for doctype, values in permissions.items():
            for idx, value in enumerate(values):
                # Check if permission already exists
                exists = frappe.db.exists({
                    "doctype": "User Permission",
                    "user": user,
                    "allow": doctype,
                    "for_value": value
                })
                
                if exists:
                    print(f"  ✓ Already exists: {doctype} - {value}")
                    continue
                
                try:
                    doc = frappe.get_doc({
                        "doctype": "User Permission",
                        "user": user,
                        "allow": doctype,
                        "for_value": value,
                        "is_default": idx == 0  # First value is default
                    })
                    doc.insert(ignore_permissions=True)
                    print(f"  ✓ Added: {doctype} - {value}")
                    
                except Exception as e:
                    print(f"  ✗ Error: {doctype} - {value}: {str(e)}")
        
        frappe.db.commit()
    
    print("\n✅ Bulk user permission setup completed!")

# Example usage:
if __name__ == "__main__":
    permission_map = {
        "john@abc.com": {
            "Company": ["ABC Corporation"],
            "Warehouse": ["Head Office Warehouse"],
            "Cost Center": ["Main - ABC"]
        },
        "sarah@abc.com": {
            "Company": ["ABC Retail Ltd"],
            "Warehouse": ["Mumbai Branch Warehouse"],
            "Cost Center": ["Mumbai - ABR"]
        },
        "regional@abc.com": {
            "Company": ["ABC Corporation"],
            "Warehouse": ["Head Office Warehouse", "Mumbai Branch Warehouse"],
            "Cost Center": ["Main - ABC", "Mumbai - ABC"]
        }
    }
    
    bulk_setup_user_permissions(permission_map)
```

**To run this script:**
```bash
# From bench directory
bench --site sitename console

# In console
exec(open('tmp_rovodev_bulk_permissions.py').read())
```

---

## 7. Troubleshooting

### Common Issues and Solutions

#### Issue 1: User Can't See Any Records

**Symptom:** User has role permission but sees empty lists.

**Diagnosis:**
```python
# Check user permissions
frappe.get_all(
    "User Permission",
    filters={"user": "john@abc.com"},
    fields=["allow", "for_value", "is_default"]
)
```

**Solution:**
- Verify user permissions are correctly set
- Check if "Apply User Permissions" is enabled on the role
- Ensure the user has the correct default company/branch

#### Issue 2: User Sees Records from Other Branches

**Symptom:** Branch restrictions not working.

**Diagnosis:**
```python
# Check role settings
role = frappe.get_doc("Role", "Sales User")
print(f"Desk Access: {role.desk_access}")
print(f"Two Factor Auth: {role.two_factor_auth}")
```

**Solution:**
- Ensure the role has "Apply User Permissions" enabled in Role Permission Manager
- Check if user has System Manager role (bypasses user permissions)

#### Issue 3: Can't Create New Documents

**Symptom:** User can view but not create records.

**Solution:**
1. Check role has "Create" permission
2. Ensure user has a default company/branch set
3. Verify user permissions include the default values

**Check defaults:**
```python
user_doc = frappe.get_doc("User", "john@abc.com")
print(user_doc.defaults)  # Should show default company, etc.
```

#### Issue 4: Permission Changes Not Taking Effect

**Solution:**
```python
# Clear cache
frappe.clear_cache(user="john@abc.com")

# Or clear all cache
frappe.clear_cache()
```

#### Issue 5: Need to Temporarily Bypass Permissions

**For testing/debugging:**
```python
# In custom script or server script
frappe.set_user("Administrator")  # Bypass all permissions

# Do your operations

frappe.set_user(original_user)  # Switch back
```

---

## Best Practices

### 1. **Plan Your Permission Structure**
- Document your branch/company hierarchy first
- Identify which roles need which level of access
- Create a permission matrix before implementation

### 2. **Use Permission Hierarchies**
```
Company (Top Level)
  └── Cost Center (Department/Branch)
      └── Warehouse (Location)
          └── Sales Person (Individual)
```

### 3. **Set Defaults Properly**
- Always set a default company for users
- Use `is_default=1` for the primary branch/location
- Reduces clicks and errors for users

### 4. **Test Permissions Thoroughly**
```python
# Test script
def test_user_permissions(user_email):
    """Test what a user can see"""
    frappe.set_user(user_email)
    
    # Test different doctypes
    doctypes = ["Customer", "Sales Order", "Employee", "Warehouse"]
    
    for dt in doctypes:
        count = frappe.db.count(dt)
        print(f"{dt}: {count} records visible")
    
    frappe.set_user("Administrator")
```

### 5. **Document Your Permission Setup**
- Keep a spreadsheet of user → permissions mapping
- Document why certain permissions were granted
- Review permissions quarterly

### 6. **Use User Permission Logs**
```python
# Enable logging
frappe.get_doc({
    "doctype": "User Permission Log",
    "user": "john@abc.com",
    "action": "Added",
    "permission_type": "Company",
    "permission_value": "ABC Corporation"
}).insert()
```

---

## Quick Reference Commands

```python
# Get all permissions for a user
user_perms = frappe.get_all(
    "User Permission",
    filters={"user": "john@abc.com"},
    fields=["allow", "for_value", "is_default", "apply_to_all_doctypes"]
)

# Remove all permissions for a user
frappe.db.delete("User Permission", {"user": "john@abc.com"})
frappe.db.commit()

# Check if user can access a specific record
can_access = frappe.has_permission(
    "Sales Order", 
    "read", 
    user="john@abc.com",
    doc="SO-2024-00001"
)

# Get user's default company
default_company = frappe.defaults.get_user_default("Company", "john@abc.com")
```

---

## Summary

**User Permissions are essential for:**
- ✅ Multi-company setups
- ✅ Multi-branch operations
- ✅ Sales territory management
- ✅ Department-based access control
- ✅ Data privacy and security

**Remember:**
1. Role Permissions define WHAT users can do
2. User Permissions define WHICH records they can see
3. Both must work together for proper access control
4. Always test permissions from the user's perspective
5. Document your permission structure

---

**Need Help?**
- Check ERPNext Forum: https://discuss.erpnext.com
- Documentation: https://docs.erpnext.com/docs/user/manual/en/setting-up/users-and-permissions
- Or run the audit script to analyze your current setup!
