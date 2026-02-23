# ERPNext Role Hierarchy and Relationships

## 📊 Visual Role Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM MANAGER                            │
│         (Full system access - Installation & Configuration)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼──────────┐  ┌──▼────────────────┐
        │   ADMINISTRATOR      │  │   SYSTEM USER     │
        │  (User Management)   │  │  (All Desk Users) │
        └───────────┬──────────┘  └───────────────────┘
                    │
         ┌──────────┼──────────┬─────────────┬────────────┐
         │          │          │             │            │
    ┌────▼────┐ ┌──▼────┐ ┌───▼────┐  ┌────▼─────┐ ┌───▼──────┐
    │ACCOUNTS │ │  HR   │ │ SALES  │  │PURCHASE  │ │  STOCK   │
    │MANAGER  │ │MANAGER│ │MANAGER │  │ MANAGER  │ │ MANAGER  │
    └────┬────┘ └──┬────┘ └───┬────┘  └────┬─────┘ └───┬──────┘
         │         │          │             │            │
    ┌────▼────┐ ┌──▼────┐ ┌───▼────┐  ┌────▼─────┐ ┌───▼──────┐
    │ACCOUNTS │ │  HR   │ │ SALES  │  │PURCHASE  │ │  STOCK   │
    │  USER   │ │ USER  │ │  USER  │  │   USER   │ │   USER   │
    └─────────┘ └───────┘ └────────┘  └──────────┘ └──────────┘
                    │
              ┌─────▼──────┐
              │  EMPLOYEE  │
              │(Self-Service)│
              └────────────┘
```

## 🔗 Role Relationships and Dependencies

### **Tier 1: Super Admin Roles**
```
System Manager
    ├─→ Complete system access
    ├─→ Install apps, create custom fields
    ├─→ Manage all roles and permissions
    ├─→ Access to all modules
    └─→ Cannot be restricted
```

### **Tier 2: Administrative Roles**
```
Administrator
    ├─→ User management
    ├─→ Role assignment
    ├─→ Cannot access system-level configs
    └─→ Inherited by: All Manager roles (typically)

System User
    ├─→ Base role for all desk users
    ├─→ Can access Desk interface
    ├─→ Can create notes, todos
    └─→ Automatically assigned to all non-guest users
```

### **Tier 3: Module Manager Roles**

#### **HR Manager**
```
HR Manager
    ├─→ Full access to HRMS module
    ├─→ Manage: Employees, Attendance, Leave, Payroll
    ├─→ View: All employee records
    ├─→ Can process: Salary slips, Appraisals
    └─→ Delegates to: HR User
```

#### **Accounts Manager**
```
Accounts Manager
    ├─→ Full access to Accounting module
    ├─→ Manage: Chart of Accounts, Invoices, Payments
    ├─→ Can Submit/Cancel: All financial documents
    ├─→ View: All company financial data
    └─→ Delegates to: Accounts User
```

#### **Sales Manager**
```
Sales Manager
    ├─→ Full access to Sales module
    ├─→ Manage: Customers, Quotations, Sales Orders
    ├─→ View: All sales reports and analytics
    ├─→ Can approve: Discounts, Credit limits
    └─→ Delegates to: Sales User
```

#### **Purchase Manager**
```
Purchase Manager
    ├─→ Full access to Buying module
    ├─→ Manage: Suppliers, RFQs, Purchase Orders
    ├─→ View: All procurement data
    ├─→ Can approve: Purchase requisitions
    └─→ Delegates to: Purchase User
```

#### **Stock Manager**
```
Stock Manager
    ├─→ Full access to Stock module
    ├─→ Manage: Items, Warehouses, Stock Entries
    ├─→ Can perform: Stock reconciliation
    ├─→ View: All inventory reports
    └─→ Delegates to: Stock User
```

### **Tier 4: Module User Roles**

```
[Module] User Roles
    ├─→ Day-to-day operational tasks
    ├─→ Limited to specific operations
    ├─→ Cannot change master settings
    └─→ Require manager approval for certain actions
```

### **Tier 5: Self-Service Roles**

```
Employee (Self-Service)
    ├─→ View own employee record
    ├─→ Apply for leaves
    ├─→ Submit expense claims
    ├─→ View payslips
    └─→ Limited to self-related documents only
```

## 🎯 Permission Inheritance Model

### **Vertical Inheritance (Hierarchical)**
```
Manager Roles
    └─→ Automatically include User role permissions
    └─→ Plus additional approval/management capabilities

Example:
    HR Manager = HR User permissions + Approval powers
```

### **Horizontal Inheritance (Cross-Module)**
```
Some roles need multiple module access:

Project Manager
    ├─→ Projects (full access)
    ├─→ Timesheet (read/write)
    ├─→ Sales (read only - for project costing)
    └─→ Stock (read only - for material requests)
```

## 🔐 Permission Level System

ERPNext uses **Permission Levels (0-9)** for granular control:

```
Level 0 (Default)
    └─→ Standard fields visible to all users with read permission

Level 1-9 (Restricted)
    ├─→ Specific fields can be hidden from certain roles
    ├─→ Example: Salary fields at Level 1 (only HR Manager can see)
    └─→ Must explicitly grant permission for each level
```

### **Example: Employee Doctype**

```
Employee Record
├─── Level 0 (Everyone with read access)
│    ├─ Employee Name
│    ├─ Department
│    ├─ Designation
│    └─ Date of Joining
│
├─── Level 1 (HR Manager only)
│    ├─ Current Salary
│    ├─ Bank Account Details
│    └─ Personal Email
│
└─── Level 2 (System Manager only)
     └─ Sensitive background checks
```

## 🔄 Common Role Combinations

### **For Different User Types:**

#### **1. CEO/Director**
```
Assigned Roles:
    ├─ Sales Manager
    ├─ Accounts Manager
    ├─ HR Manager
    ├─ Purchase Manager
    └─ Stock Manager
    
Access: Complete operational view across all modules
```

#### **2. Branch Manager**
```
Assigned Roles:
    ├─ Sales User
    ├─ Stock User
    ├─ Purchase User
    └─ (+ User Permissions for specific branch)
    
Access: Limited to assigned branch operations
```

#### **3. Accountant**
```
Assigned Roles:
    ├─ Accounts User
    └─ (Optional: Sales User - read only)
    
Access: Financial transactions and reporting
```

#### **4. Sales Executive**
```
Assigned Roles:
    ├─ Sales User
    └─ Stock User (read only)
    
Access: Customer management, quotations, orders
```

#### **5. HR Executive**
```
Assigned Roles:
    ├─ HR User
    └─ (Optional: Accounts User - for expense claims)
    
Access: Employee records, attendance, leave management
```

#### **6. Regular Employee**
```
Assigned Roles:
    ├─ Employee (Self-Service)
    └─ (+ Project User if involved in projects)
    
Access: Self-service portal only
```

## 📊 Permission Matrix - Key Doctypes

### **Employee Doctype Permissions**

| Role | Read | Write | Create | Delete | Submit | Report | User Permission |
|------|------|-------|--------|--------|--------|--------|-----------------|
| System Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR User | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Employee | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Own record only) |

### **Sales Order Doctype Permissions**

| Role | Read | Write | Create | Delete | Submit | Cancel | Amend |
|------|------|-------|--------|--------|--------|--------|-------|
| Sales Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales User | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Accounts User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Stock User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### **Salary Slip Doctype Permissions**

| Role | Read | Write | Create | Delete | Submit | User Permission |
|------|------|-------|--------|--------|--------|-----------------|
| HR Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR User | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (Own slips only) |

## 🎨 Role Color Coding (Visual Reference)

```
🔴 System Manager / Administrator    → Red (Critical/Admin)
🟠 Module Managers                    → Orange (Management)
🟡 Module Users                       → Yellow (Operations)
🟢 Employee / Self-Service            → Green (End-users)
🔵 Custom Business Roles              → Blue (Organization-specific)
⚪ Guest / Website User               → White (Public)
```

## ⚡ Best Practices for Role Assignment

### **✅ DO:**
1. **Follow Principle of Least Privilege**: Assign minimum roles needed
2. **Use Manager + User combinations**: HR Manager can have HR User implicitly
3. **Create custom roles for specific needs**: Better than over-permissioning
4. **Document role purposes**: Maintain a role registry
5. **Regular audits**: Review user roles quarterly

### **❌ DON'T:**
1. **Don't assign System Manager widely**: Reserve for IT admins only
2. **Don't mix incompatible roles**: e.g., Accounts User + Purchase Manager (segregation of duties)
3. **Don't create duplicate roles**: Check existing roles first
4. **Don't forget User Permissions**: Roles alone may not be enough
5. **Don't hardcode role checks**: Use permission framework

## 🔍 Role Troubleshooting Guide

### **User can't see a module?**
```
Check:
1. Role has "Show in Modules" permission
2. Module is installed
3. User Type allows desk access
4. Role is not disabled
```

### **User can create but not submit?**
```
Check:
1. Submit permission explicitly granted
2. Permission Level includes all required fields
3. Workflow state doesn't block submission
4. No missing mandatory field at higher permission level
```

### **User sees some records but not all?**
```
Check:
1. User Permissions (restricts to specific records)
2. Permission rules (custom conditions)
3. Owner-only restrictions
4. If Created By filter is active
```

---

**Next Document:** Custom Role Creation Guide →
