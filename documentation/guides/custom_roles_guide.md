# Complete Guide to Creating Custom Roles in ERPNext

## 📚 Table of Contents
1. [When to Create Custom Roles](#when-to-create-custom-roles)
2. [Step-by-Step Role Creation](#step-by-step-role-creation)
3. [Real-World Examples](#real-world-examples)
4. [Advanced Configuration](#advanced-configuration)
5. [Testing and Validation](#testing-and-validation)

---

## 🎯 When to Create Custom Roles

### **Create Custom Roles When:**

✅ **Standard roles don't match your business process**
- Example: Your organization has a "Quality Inspector" position not covered by standard roles

✅ **You need specific permission combinations**
- Example: Users who can create Sales Orders but cannot modify prices

✅ **Compliance or audit requirements**
- Example: Segregation of duties - separate "Payment Creator" from "Payment Approver"

✅ **Department-specific workflows**
- Example: "Warehouse Supervisor" with limited stock permissions

✅ **Customer/Vendor portals with custom access**
- Example: "Vendor Portal User" with access to specific doctypes

### **DON'T Create Custom Roles When:**

❌ **Standard role + User Permission would work**
- Use User Permissions to limit data access instead

❌ **Just need to restrict data, not features**
- Apply User Permissions or Permission Rules

❌ **Temporary access needs**
- Use time-bound role assignment instead

---

## 🛠️ Step-by-Step Role Creation

### **Method 1: Through User Interface (Recommended for Non-Technical Users)**

#### **Step 1: Navigate to Role List**
```
Home → Settings → Users and Permissions → Role → New Role
```

Or use Quick Search: `Ctrl/Cmd + K` → Type "New Role"

#### **Step 2: Fill Basic Details**

| Field | Description | Example |
|-------|-------------|---------|
| **Role Name** | Unique identifier (required) | `Quality Inspector` |
| **Desk Access** | ☑️ Allow access to Desk (uncheck for portal users) | ✅ Checked |
| **Disabled** | ☐ Disable this role | ❌ Unchecked |
| **Two Factor Auth** | ☑️ Require 2FA for this role | Optional |
| **Restrict to Domain** | Limit role to specific domain | Manufacturing |
| **Is Custom** | Auto-set to 1 for user-created roles | 1 (Auto) |

**Important Naming Conventions:**
- Use descriptive names: ✅ `Branch Accountant` instead of ❌ `BA`
- Use title case: ✅ `Sales Executive` not ❌ `sales executive`
- Avoid special characters except spaces and hyphens

#### **Step 3: Save the Role**
- Click **Save** button
- Role is now created but has NO permissions yet

#### **Step 4: Assign Permissions to Doctypes**

Navigate to: **Role Permission Manager**
```
Home → Settings → Permissions → Role Permission Manager
```

**For each relevant DocType:**

1. **Select the DocType** (e.g., "Sales Order")
2. **Click "Add a New Rule"**
3. **Select your custom role** from dropdown
4. **Set permission checkboxes:**

| Permission | When to Grant |
|------------|---------------|
| **Select** | Almost always (for queries) |
| **Read** | Can view documents |
| **Write** | Can edit existing documents |
| **Create** | Can create new documents |
| **Delete** | Can delete documents |
| **Submit** | Can submit (finalize) documents |
| **Cancel** | Can cancel submitted documents |
| **Amend** | Can amend cancelled documents |
| **Report** | Can access reports |
| **Import** | Can use data import |
| **Export** | Can export data |
| **Print** | Can print documents |
| **Email** | Can email documents |
| **Share** | Can share with other users |

5. **Set additional options:**

| Option | Description |
|--------|-------------|
| **Permission Level** | 0 (default) or 1-9 for field-level restrictions |
| **If Owner** | ✅ Only if user created the document |
| **Apply User Permissions** | ✅ Respect User Permission restrictions |

6. **Click Update** to save

#### **Step 5: Test the Role**

1. Create a test user or assign role to yourself
2. Login with test user (or use "Switch to User" in developer mode)
3. Verify access to expected features
4. Test edge cases (create, submit, cancel, etc.)

---

### **Method 2: Programmatic Creation (For Developers)**

#### **Create Role via Python Script**

```python
# Method 2A: Using Frappe API
import frappe

def create_custom_role():
    """Create a custom role programmatically"""
    
    # Check if role already exists
    if not frappe.db.exists("Role", "Quality Inspector"):
        role = frappe.get_doc({
            "doctype": "Role",
            "role_name": "Quality Inspector",
            "desk_access": 1,
            "disabled": 0,
            "two_factor_auth": 0,
            "restrict_to_domain": "Manufacturing"
        })
        role.insert(ignore_permissions=True)
        frappe.db.commit()
        print(f"✅ Role '{role.role_name}' created successfully")
    else:
        print(f"ℹ️  Role 'Quality Inspector' already exists")

# Run this in bench console
# bench --site your-site console
# >>> from path.to.script import create_custom_role
# >>> create_custom_role()
```

#### **Add Permissions to the Role**

```python
import frappe
from frappe.permissions import add_permission, reset_perms

def setup_quality_inspector_permissions():
    """Setup permissions for Quality Inspector role"""
    
    role = "Quality Inspector"
    
    # Define permissions for each doctype
    permissions_map = {
        "Quality Inspection": {
            "read": 1,
            "write": 1,
            "create": 1,
            "submit": 1,
            "cancel": 1,
            "print": 1,
            "email": 1,
            "report": 1
        },
        "Item": {
            "read": 1,
            "write": 0,  # Read-only
            "report": 1
        },
        "Stock Entry": {
            "read": 1,
            "write": 0,
            "report": 1
        },
        "Purchase Receipt": {
            "read": 1,
            "write": 1,  # Can update inspection status
            "report": 1
        }
    }
    
    # Apply permissions
    for doctype, perms in permissions_map.items():
        # Reset existing permissions for this role on this doctype
        existing_perms = frappe.get_all(
            "Custom DocPerm",
            filters={"parent": doctype, "role": role}
        )
        
        for perm in existing_perms:
            frappe.delete_doc("Custom DocPerm", perm.name)
        
        # Add new permission
        add_permission(
            doctype=doctype,
            role=role,
            perm_type="Custom DocPerm",
            **perms
        )
    
    frappe.db.commit()
    print(f"✅ Permissions set for {role}")

# Execute
setup_quality_inspector_permissions()
```

#### **Complete Role Setup Script with Fixtures**

```python
# save as: custom_app/fixtures/custom_roles.py

import frappe

def setup_custom_roles():
    """
    Complete setup script for custom roles
    Can be run as a patch or during app installation
    """
    
    roles_config = [
        {
            "role_name": "Branch Accountant",
            "desk_access": 1,
            "permissions": {
                "Sales Invoice": ["read", "write", "create", "submit", "print", "email"],
                "Purchase Invoice": ["read", "write", "create", "submit", "print", "email"],
                "Payment Entry": ["read", "create"],  # Cannot submit payments
                "Journal Entry": ["read", "report"],
                "Account": ["read", "report"],
            }
        },
        {
            "role_name": "Warehouse Supervisor",
            "desk_access": 1,
            "permissions": {
                "Stock Entry": ["read", "write", "create", "submit", "print"],
                "Delivery Note": ["read", "write", "submit"],
                "Purchase Receipt": ["read", "write", "submit"],
                "Item": ["read", "report"],
                "Warehouse": ["read"],
                "Stock Reconciliation": ["read", "write", "create", "submit"],
            }
        },
        {
            "role_name": "Quality Inspector",
            "desk_access": 1,
            "restrict_to_domain": "Manufacturing",
            "permissions": {
                "Quality Inspection": ["read", "write", "create", "submit", "cancel", "print", "email", "report"],
                "Item": ["read", "report"],
                "Stock Entry": ["read", "report"],
                "Purchase Receipt": ["read", "write"],
                "Delivery Note": ["read", "write"],
            }
        }
    ]
    
    for role_config in roles_config:
        role_name = role_config["role_name"]
        
        # Create role if doesn't exist
        if not frappe.db.exists("Role", role_name):
            role_doc = frappe.get_doc({
                "doctype": "Role",
                "role_name": role_name,
                "desk_access": role_config.get("desk_access", 1),
                "restrict_to_domain": role_config.get("restrict_to_domain", ""),
            })
            role_doc.insert(ignore_permissions=True)
            print(f"✅ Created role: {role_name}")
        
        # Setup permissions
        for doctype, perm_list in role_config.get("permissions", {}).items():
            setup_doctype_permission(doctype, role_name, perm_list)
    
    frappe.db.commit()
    print("🎉 All custom roles setup completed!")

def setup_doctype_permission(doctype, role, permissions):
    """Helper function to setup permissions for a doctype"""
    
    from frappe.permissions import add_permission
    
    perm_dict = {
        "select": 1,  # Always allow select
        "read": 1 if "read" in permissions else 0,
        "write": 1 if "write" in permissions else 0,
        "create": 1 if "create" in permissions else 0,
        "delete": 1 if "delete" in permissions else 0,
        "submit": 1 if "submit" in permissions else 0,
        "cancel": 1 if "cancel" in permissions else 0,
        "amend": 1 if "amend" in permissions else 0,
        "print": 1 if "print" in permissions else 0,
        "email": 1 if "email" in permissions else 0,
        "report": 1 if "report" in permissions else 0,
        "import": 1 if "import" in permissions else 0,
        "export": 1 if "export" in permissions else 0,
        "share": 1 if "share" in permissions else 0,
    }
    
    try:
        add_permission(doctype, role, **perm_dict)
        print(f"  ✓ Added permissions for {doctype}")
    except Exception as e:
        print(f"  ✗ Error adding permissions for {doctype}: {str(e)}")

# To execute: Run in bench console
# bench --site your-site console
# >>> from your_app.fixtures.custom_roles import setup_custom_roles
# >>> setup_custom_roles()
```

---

## 💼 Real-World Examples

### **Example 1: Quality Inspector Role**

**Business Requirement:**
- Quality inspectors need to create and submit quality inspections
- They should view but not modify items and stock entries
- No access to financial modules

**Implementation:**

```python
# Role Configuration
Role Name: Quality Inspector
Desk Access: Yes
Domain: Manufacturing

# Permissions Matrix
Quality Inspection:     [Read, Write, Create, Submit, Cancel, Print, Email, Report]
Item:                   [Read, Report]
Stock Entry:            [Read, Report]
Purchase Receipt:       [Read, Write]  # To update QA status
Delivery Note:          [Read, Write]  # To update QA status
BOM:                    [Read]
Work Order:             [Read]
```

**User Assignment:**
```python
# Assign to user
frappe.get_doc("User", "inspector@company.com").add_roles("Quality Inspector")
```

---

### **Example 2: Branch Accountant Role**

**Business Requirement:**
- Can create and submit invoices for their branch only
- Can create payment entries but cannot submit (needs approval)
- Cannot access other branches' data
- Cannot modify chart of accounts

**Implementation:**

```python
# Role Configuration
Role Name: Branch Accountant
Desk Access: Yes

# Permissions
Sales Invoice:      [Read, Write, Create, Submit, Cancel, Amend, Print, Email]
Purchase Invoice:   [Read, Write, Create, Submit, Cancel, Amend, Print, Email]
Payment Entry:      [Read, Write, Create, Print]  # NO Submit
Journal Entry:      [Read, Report]
Account:            [Read, Report]  # Read-only
Customer:           [Read, Write, Create]
Supplier:           [Read, Write, Create]

# Additional: Apply User Permission for Branch
# (See next document for User Permissions setup)
```

---

### **Example 3: Customer Portal Manager**

**Business Requirement:**
- Manage customer portal access
- View customer issues and communications
- Cannot access internal sales data
- Can create quotations for customers

**Implementation:**

```python
# Role Configuration
Role Name: Customer Portal Manager
Desk Access: Yes

# Permissions
Customer:           [Read, Write, Create]
Contact:            [Read, Write, Create]
Address:            [Read, Write, Create]
Issue:              [Read, Write, Create, Email]
Communication:      [Read, Write, Create]
Quotation:          [Read, Write, Create, Print, Email]
Sales Order:        [Read]  # View only
Portal Settings:    [Read, Write]

# Special configuration
Apply User Permissions: Yes (restrict to assigned customers)
```

---

### **Example 4: Payroll Processor (Segregation of Duties)**

**Business Requirement:**
- Can process salary slips but cannot approve them
- Can view employee records but not modify sensitive fields
- Cannot access bank accounts or payment entries

**Implementation:**

```python
# Role Configuration
Role Name: Payroll Processor
Desk Access: Yes
Domain: HR

# Permissions
Employee:               [Read]  # Read-only, Level 0 fields only
Salary Structure:       [Read]
Salary Slip:            [Read, Write, Create, Print]  # NO Submit
Attendance:             [Read, Report]
Leave Application:      [Read]
Timesheet:              [Read]

# Field-Level Restrictions (Permission Level)
# Employee - Level 0: Name, Department, Designation (Visible)
# Employee - Level 1: Salary, Bank Details (Hidden from this role)

# Additional Role Needed for Approval
Role Name: Payroll Manager
Salary Slip:            [Read, Write, Submit, Cancel, Email]
Payment Entry:          [Read, Write, Create, Submit]  # For salary payments
```

---

### **Example 5: Warehouse Supervisor**

**Business Requirement:**
- Full control over stock entries in assigned warehouse
- Can receive and deliver goods
- Cannot create new items or warehouses
- Cannot perform stock reconciliation (audit requirement)

**Implementation:**

```python
# Role Configuration
Role Name: Warehouse Supervisor
Desk Access: Yes

# Permissions
Stock Entry:            [Read, Write, Create, Submit, Print, Email]
Delivery Note:          [Read, Write, Create, Submit, Print, Email]
Purchase Receipt:       [Read, Write, Create, Submit, Print, Email]
Item:                   [Read, Report]  # View only
Warehouse:              [Read]  # View only
Batch:                  [Read, Write, Create]
Serial No:              [Read, Write, Create]
Stock Reconciliation:   []  # No access

# User Permission Setup
Warehouse: [Specific Warehouse Name]  # Restricts to one warehouse
```

---

## ⚙️ Advanced Configuration

### **1. Field-Level Permissions (Permission Levels)**

Restrict access to specific fields within a document:

#### **Step 1: Set Field Permission Level**

In the DocType customization:
```
Home → Customization → Customize Form → Select DocType

Find the field (e.g., "Salary" in Employee)
Set "Permission Level" = 1
```

#### **Step 2: Grant Level-Specific Access**

In Role Permission Manager:
```
DocType: Employee
Role: HR Manager
Permission Level: 0 → [All standard permissions]

Add another rule:
DocType: Employee
Role: HR Manager
Permission Level: 1 → [Read, Write]  # Can access Level 1 fields

For "Employee" role:
Permission Level: 0 only → Cannot see Level 1 fields
```

**Example Use Cases:**
- Level 0: Public employee info (name, department)
- Level 1: Salary information (HR Manager only)
- Level 2: Background check data (System Manager only)

---

### **2. Conditional Permissions (Permission Rules)**

Apply dynamic permissions based on conditions:

```python
# Create a Permission Rule
# Home → Settings → Permissions → Permission Rule

# Example: Users can only edit their own department's employees

Permission Rule Name: Own Department Only
Document Type: Employee
Role: HR User

Conditions:
{
    "department": "user.department"
}

Apply Rule: checked
```

**Python Implementation:**
```python
def create_permission_rule():
    if not frappe.db.exists("Permission Rule", "Own Department Only"):
        perm_rule = frappe.get_doc({
            "doctype": "Permission Rule",
            "document_type": "Employee",
            "role": "HR User",
            "apply_user_permission_on": "Department",
            "applicable_for": "",
            "match_field": {
                "department": "user.department"
            }
        })
        perm_rule.insert()
        frappe.db.commit()
```

---

### **3. Role Profiles (Role Bundles)**

Group multiple roles together for easy assignment:

```python
# Create Role Profile
# Home → Users and Permissions → Role Profile

Role Profile Name: Branch Manager Profile

Roles Included:
- Sales User
- Purchase User
- Stock User
- Accounts User
- HR User (optional)

# Assign to user
User: branch.manager@company.com
Role Profile: Branch Manager Profile
```

---

### **4. Custom Scripts for Dynamic Permissions**

Add custom logic using Server Scripts or App code:

```python
# In a custom app or Server Script (DocType: Employee)

def has_permission(doc, ptype, user):
    """
    Custom permission logic
    ptype can be: read, write, create, delete, submit, cancel, etc.
    """
    
    # Employees can only view their own record
    if "Employee" in frappe.get_roles(user):
        employee = frappe.get_value("Employee", {"user_id": user}, "name")
        if doc.name != employee:
            return False
    
    # HR Users can only access their branch employees
    if "HR User" in frappe.get_roles(user) and "HR Manager" not in frappe.get_roles(user):
        user_branch = frappe.get_value("User", user, "branch")
        if doc.branch != user_branch:
            return False
    
    # Default: allow if user has standard permissions
    return True

# Register in hooks.py
permission_query_conditions = {
    "Employee": "your_app.permissions.employee_query_conditions"
}

def employee_query_conditions(user):
    """Filter list view based on user"""
    if "Employee" in frappe.get_roles(user):
        employee = frappe.get_value("Employee", {"user_id": user}, "name")
        return f"`tabEmployee`.name = '{employee}'"
    
    if "HR User" in frappe.get_roles(user) and "HR Manager" not in frappe.get_roles(user):
        user_branch = frappe.get_value("User", user, "branch")
        return f"`tabEmployee`.branch = '{user_branch}'"
    
    return ""  # No restriction
```

---

## ✅ Testing and Validation

### **Testing Checklist**

```
☐ Role created successfully
☐ Permissions applied to all required doctypes
☐ Test user created with only this role
☐ Login as test user works
☐ Can access expected modules/features
☐ Cannot access restricted modules/features
☐ CRUD operations work as expected:
    ☐ Create new documents
    ☐ Read/View documents
    ☐ Update documents
    ☐ Delete documents (if permitted)
    ☐ Submit documents (if permitted)
    ☐ Cancel documents (if permitted)
☐ Reports accessible
☐ Print/Email functions work
☐ User Permissions respected (if applicable)
☐ Permission levels working correctly
☐ No console errors when navigating
☐ Performance acceptable (check slow queries)
```

### **Testing Script**

```python
# Run in bench console
def test_role_permissions(role_name, test_user_email):
    """
    Automated testing of role permissions
    """
    import frappe
    from frappe.permissions import has_permission
    
    # Set user context
    frappe.set_user(test_user_email)
    
    print(f"\n🧪 Testing permissions for role: {role_name}")
    print(f"👤 Test user: {test_user_email}\n")
    
    # Get all roles for user
    user_roles = frappe.get_roles(test_user_email)
    print(f"📋 User roles: {', '.join(user_roles)}\n")
    
    # Find all permissions for this role
    permissions = frappe.get_all(
        "Custom DocPerm",
        filters={"role": role_name},
        fields=["parent", "read", "write", "create", "submit", "cancel", "delete"]
    )
    
    print(f"🔐 Testing {len(permissions)} doctype permissions:\n")
    
    test_results = []
    
    for perm in permissions:
        doctype = perm.parent
        print(f"  Testing {doctype}...")
        
        results = {
            "doctype": doctype,
            "read": has_permission(doctype, "read"),
            "write": has_permission(doctype, "write"),
            "create": has_permission(doctype, "create"),
            "delete": has_permission(doctype, "delete"),
        }
        
        test_results.append(results)
        
        # Visual feedback
        status = "✅" if results["read"] else "❌"
        print(f"    {status} Read: {results['read']}")
    
    # Reset to Administrator
    frappe.set_user("Administrator")
    
    print(f"\n✨ Testing completed for {role_name}")
    return test_results

# Example usage:
# test_role_permissions("Quality Inspector", "inspector@company.com")
```

---

## 📊 Role Documentation Template

When creating custom roles, document them:

```markdown
# Role: [Role Name]

## Purpose
Brief description of why this role exists and who uses it.

## Business Context
- Department: [e.g., Quality Assurance]
- Reports To: [e.g., Production Manager]
- Common Job Titles: [e.g., QA Inspector, Quality Analyst]

## Permissions Summary

### Can Do:
- Create and submit quality inspections
- View item specifications
- Update inspection status on receipts

### Cannot Do:
- Modify item master
- Create stock entries
- Access financial data

## Doctype Permissions

| DocType | Read | Write | Create | Submit | Notes |
|---------|------|-------|--------|--------|-------|
| Quality Inspection | ✅ | ✅ | ✅ | ✅ | Full access |
| Item | ✅ | ❌ | ❌ | ❌ | Read-only |

## User Permissions
- None (or list specific restrictions)

## Dependencies
- Requires: System User (auto-assigned)
- Often paired with: Manufacturing User

## Setup Instructions
[Link to setup script or manual steps]

## Last Updated
[Date] by [Name]
```

---

**Next Document:** User Permissions for Multi-Branch/Multi-Company Setup →
