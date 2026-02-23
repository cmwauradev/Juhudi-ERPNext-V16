# Complete Guide to Workflow States and Permissions in ERPNext

## 📚 Table of Contents
1. [Understanding Workflows](#understanding-workflows)
2. [How Workflow States Affect Permissions](#how-workflow-states-affect-permissions)
3. [Creating Custom Workflows](#creating-custom-workflows)
4. [State-Based Permission Control](#state-based-permission-control)
5. [Practical Examples](#practical-examples)
6. [Workflow Actions and Transitions](#workflow-actions-and-transitions)
7. [Advanced Workflow Concepts](#advanced-workflow-concepts)
8. [Troubleshooting](#troubleshooting)

---

## 1. Understanding Workflows

**Workflows** in ERPNext allow you to control the lifecycle of documents through predefined states and transitions.

### Key Concepts:

```
Document Lifecycle:
Draft → Pending Review → Approved → Completed
  ↓           ↓             ↓           ↓
Cancel    Reject      Send Back    Archive
```

### Components of a Workflow:

| Component | Description |
|-----------|-------------|
| **Workflow State** | Current status of the document (e.g., "Draft", "Approved") |
| **Workflow Action** | Button that triggers state change (e.g., "Approve", "Reject") |
| **Transition** | Rule defining who can move from State A to State B |
| **Condition** | Optional logic to enable/disable transitions |

---

## 2. How Workflow States Affect Permissions

### The Permission Hierarchy:

```
1. Base Role Permissions (from Role Permission Manager)
   ↓
2. Workflow State Permissions (override base permissions)
   ↓
3. User Permissions (record-level filters)
   ↓
4. Field-level Permissions (restrict specific fields)
```

### Workflow Override Rules:

**When a workflow is active on a DocType:**
- ✅ Workflow states **OVERRIDE** standard role permissions
- ✅ Users can only perform actions allowed in current state
- ✅ State transitions require specific roles
- ⚠️ System Manager can always bypass (unless explicitly restricted)

**Example:**
```
Base Permission: Sales User can "Submit" Sales Orders
Workflow State: When SO is "Pending Approval"
  → Sales User CANNOT submit (only approvers can)
  → Workflow overrides base permission
```

---

## 3. Creating Custom Workflows

### Step-by-Step: Create a Leave Application Workflow

#### **Step 1: Define Workflow States**

Go to: **Setup → Workflow → Workflow State → New**

Create these states:
1. **Draft** (Starting state)
2. **Pending Approval**
3. **Approved**
4. **Rejected**

```python
# Programmatically create states
import frappe

states = ["Draft", "Pending Approval", "Approved", "Rejected"]
for state in states:
    if not frappe.db.exists("Workflow State", state):
        frappe.get_doc({
            "doctype": "Workflow State",
            "workflow_state_name": state
        }).insert()
```

#### **Step 2: Create the Workflow**

Go to: **Setup → Workflow → New**

**Workflow Configuration:**
```
Workflow Name: Leave Approval Process
Document Type: Leave Application
Is Active: ✓
Override Status: ✓
Send Email Alert: ✓
Workflow State Field: workflow_state
```

#### **Step 3: Define States in Workflow**

Add states with permissions:

| State | Doc Status | Allow Edit | Roles Allowed to Edit |
|-------|-----------|------------|---------------------|
| Draft | 0 (Draft) | Employee Self Service | Employee Self Service |
| Pending Approval | 0 (Draft) | Leave Approver | Leave Approver, HR Manager |
| Approved | 1 (Submitted) | - | - |
| Rejected | 2 (Cancelled) | - | - |

**Code to set up:**
```python
workflow = frappe.get_doc({
    "doctype": "Workflow",
    "workflow_name": "Leave Approval Process",
    "document_type": "Leave Application",
    "is_active": 1,
    "override_status": 1,
    "send_email_alert": 1,
    "workflow_state_field": "workflow_state",
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "Employee Self Service"
        },
        {
            "state": "Pending Approval",
            "doc_status": "0",
            "allow_edit": "Leave Approver"
        },
        {
            "state": "Approved",
            "doc_status": "1",
            "allow_edit": ""
        },
        {
            "state": "Rejected",
            "doc_status": "2",
            "allow_edit": ""
        }
    ]
})
workflow.insert()
```

#### **Step 4: Define Transitions**

Add transition rules:

| Current State | Action | Next State | Allowed Roles | Condition |
|--------------|--------|------------|---------------|-----------|
| Draft | Submit for Approval | Pending Approval | Employee Self Service | - |
| Pending Approval | Approve | Approved | Leave Approver | - |
| Pending Approval | Reject | Rejected | Leave Approver | - |
| Pending Approval | Send Back | Draft | Leave Approver | - |

**Add transitions to workflow:**
```python
workflow.extend("transitions", [
    {
        "state": "Draft",
        "action": "Submit for Approval",
        "next_state": "Pending Approval",
        "allowed": "Employee Self Service",
        "allow_self_approval": 0
    },
    {
        "state": "Pending Approval",
        "action": "Approve",
        "next_state": "Approved",
        "allowed": "Leave Approver",
        "allow_self_approval": 0
    },
    {
        "state": "Pending Approval",
        "action": "Reject",
        "next_state": "Rejected",
        "allowed": "Leave Approver",
        "allow_self_approval": 0
    },
    {
        "state": "Pending Approval",
        "action": "Send Back",
        "next_state": "Draft",
        "allowed": "Leave Approver",
        "allow_self_approval": 0
    }
])
workflow.save()
```

---

## 4. State-Based Permission Control

### Scenario: Purchase Order Approval Workflow

**Business Requirement:**
- Junior buyers can create POs up to $10,000
- Manager approval needed for $10,000 - $50,000
- Director approval needed for > $50,000

#### **Workflow States:**

```
Draft → Pending Manager → Pending Director → Approved
  ↓          ↓                 ↓              ↓
Cancel    Reject           Reject        Completed
```

#### **Permission Matrix:**

| State | Purchase User | Purchase Manager | Purchase Director |
|-------|--------------|------------------|------------------|
| **Draft** | ✏️ Create, Edit | 👁️ View | 👁️ View |
| **Pending Manager** | 👁️ View | ✅ Approve/Reject | 👁️ View |
| **Pending Director** | 👁️ View | 👁️ View | ✅ Approve/Reject |
| **Approved** | 👁️ View | 👁️ View | 👁️ View |

#### **Implementation:**

```python
workflow = frappe.get_doc({
    "doctype": "Workflow",
    "workflow_name": "Purchase Order Approval",
    "document_type": "Purchase Order",
    "is_active": 1,
    "workflow_state_field": "workflow_state",
    
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "Purchase User"
        },
        {
            "state": "Pending Manager Approval",
            "doc_status": "0",
            "allow_edit": "Purchase Manager"
        },
        {
            "state": "Pending Director Approval",
            "doc_status": "0",
            "allow_edit": "Purchase Director"
        },
        {
            "state": "Approved",
            "doc_status": "1",
            "allow_edit": ""
        }
    ],
    
    "transitions": [
        {
            "state": "Draft",
            "action": "Submit",
            "next_state": "Pending Manager Approval",
            "allowed": "Purchase User",
            "condition": "doc.grand_total >= 10000"
        },
        {
            "state": "Pending Manager Approval",
            "action": "Approve",
            "next_state": "Pending Director Approval",
            "allowed": "Purchase Manager",
            "condition": "doc.grand_total > 50000"
        },
        {
            "state": "Pending Manager Approval",
            "action": "Approve",
            "next_state": "Approved",
            "allowed": "Purchase Manager",
            "condition": "doc.grand_total <= 50000"
        },
        {
            "state": "Pending Director Approval",
            "action": "Approve",
            "next_state": "Approved",
            "allowed": "Purchase Director"
        }
    ]
})
workflow.insert()
```

---

## 5. Practical Examples

### Example 1: Sales Order Approval

**Requirement:** Sales orders need discount approval if discount > 10%

```python
# Workflow: Sales Order Discount Approval

workflow = frappe.get_doc({
    "doctype": "Workflow",
    "workflow_name": "Sales Order Discount Approval",
    "document_type": "Sales Order",
    "is_active": 1,
    
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "Sales User"
        },
        {
            "state": "Pending Discount Approval",
            "doc_status": "0",
            "allow_edit": "Sales Manager"
        },
        {
            "state": "Approved",
            "doc_status": "1"
        }
    ],
    
    "transitions": [
        {
            "state": "Draft",
            "action": "Submit",
            "next_state": "Approved",
            "allowed": "Sales User",
            "condition": "doc.additional_discount_percentage <= 10"
        },
        {
            "state": "Draft",
            "action": "Submit for Approval",
            "next_state": "Pending Discount Approval",
            "allowed": "Sales User",
            "condition": "doc.additional_discount_percentage > 10"
        },
        {
            "state": "Pending Discount Approval",
            "action": "Approve",
            "next_state": "Approved",
            "allowed": "Sales Manager"
        },
        {
            "state": "Pending Discount Approval",
            "action": "Reject",
            "next_state": "Draft",
            "allowed": "Sales Manager"
        }
    ]
})
workflow.insert()
```

### Example 2: Employee Onboarding Workflow

**Requirement:** Multi-step employee onboarding with different department approvals

```
Draft → HR Review → IT Setup → Finance Setup → Completed
```

```python
workflow = frappe.get_doc({
    "doctype": "Workflow",
    "workflow_name": "Employee Onboarding",
    "document_type": "Employee Onboarding",
    "is_active": 1,
    
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "HR User"
        },
        {
            "state": "HR Review",
            "doc_status": "0",
            "allow_edit": "HR Manager"
        },
        {
            "state": "IT Setup",
            "doc_status": "0",
            "allow_edit": "IT User",
            "update_field": "it_setup_complete",
            "update_value": "1"
        },
        {
            "state": "Finance Setup",
            "doc_status": "0",
            "allow_edit": "Accounts User"
        },
        {
            "state": "Completed",
            "doc_status": "1"
        }
    ],
    
    "transitions": [
        {
            "state": "Draft",
            "action": "Send to HR",
            "next_state": "HR Review",
            "allowed": "HR User"
        },
        {
            "state": "HR Review",
            "action": "HR Approved",
            "next_state": "IT Setup",
            "allowed": "HR Manager"
        },
        {
            "state": "IT Setup",
            "action": "IT Complete",
            "next_state": "Finance Setup",
            "allowed": "IT User"
        },
        {
            "state": "Finance Setup",
            "action": "Complete Onboarding",
            "next_state": "Completed",
            "allowed": "Accounts User"
        }
    ]
})
workflow.insert()
```

### Example 3: Invoice Payment Workflow

**Requirement:** Track payment approval status

```python
workflow = frappe.get_doc({
    "doctype": "Workflow",
    "workflow_name": "Invoice Payment Approval",
    "document_type": "Purchase Invoice",
    "is_active": 1,
    
    "states": [
        {
            "state": "Draft",
            "doc_status": "0",
            "allow_edit": "Accounts User"
        },
        {
            "state": "Pending Payment Approval",
            "doc_status": "1",
            "allow_edit": "Accounts Manager"
        },
        {
            "state": "Payment Approved",
            "doc_status": "1"
        },
        {
            "state": "Paid",
            "doc_status": "1"
        }
    ],
    
    "transitions": [
        {
            "state": "Draft",
            "action": "Submit",
            "next_state": "Pending Payment Approval",
            "allowed": "Accounts User"
        },
        {
            "state": "Pending Payment Approval",
            "action": "Approve Payment",
            "next_state": "Payment Approved",
            "allowed": "Accounts Manager"
        },
        {
            "state": "Payment Approved",
            "action": "Mark as Paid",
            "next_state": "Paid",
            "allowed": "Accounts User",
            "condition": "doc.outstanding_amount == 0"
        }
    ]
})
workflow.insert()
```

---

## 6. Workflow Actions and Transitions

### Action Types:

| Action Type | Description | Example |
|-------------|-------------|---------|
| **Submit** | Move document to next state | Draft → Pending |
| **Approve** | Accept and forward | Pending → Approved |
| **Reject** | Decline document | Pending → Rejected |
| **Send Back** | Return to previous state | Pending → Draft |
| **Cancel** | Terminate workflow | Any → Cancelled |
| **Custom** | Any business-specific action | "Request Revision" |

### Transition Properties:

```python
{
    "state": "Pending Approval",           # Current state
    "action": "Approve",                   # Button label
    "next_state": "Approved",              # Target state
    "allowed": "Leave Approver",           # Role that can perform action
    "allow_self_approval": 0,              # Prevent self-approval
    "condition": "doc.total_leave_days < 5" # Python condition
}
```

### Conditional Transitions:

**Example: Different approval paths based on amount**

```python
transitions = [
    # Small amounts - auto approve
    {
        "state": "Draft",
        "action": "Submit",
        "next_state": "Approved",
        "allowed": "Sales User",
        "condition": "doc.grand_total < 1000"
    },
    # Medium amounts - manager approval
    {
        "state": "Draft",
        "action": "Submit",
        "next_state": "Pending Manager",
        "allowed": "Sales User",
        "condition": "doc.grand_total >= 1000 and doc.grand_total < 10000"
    },
    # Large amounts - director approval
    {
        "state": "Draft",
        "action": "Submit",
        "next_state": "Pending Director",
        "allowed": "Sales User",
        "condition": "doc.grand_total >= 10000"
    }
]
```

---

## 7. Advanced Workflow Concepts

### 1. Email Alerts on State Change

**Automatically send emails when workflow state changes:**

```python
# Create Email Alert
email_alert = frappe.get_doc({
    "doctype": "Email Alert",
    "name": "Leave Application - Pending Approval",
    "document_type": "Leave Application",
    "event": "Value Change",
    "value_changed": "workflow_state",
    "enabled": 1,
    "subject": "New Leave Application for Approval",
    "message": """
        A new leave application is pending your approval.
        
        Employee: {{ doc.employee_name }}
        Leave Type: {{ doc.leave_type }}
        From: {{ doc.from_date }}
        To: {{ doc.to_date }}
        Days: {{ doc.total_leave_days }}
        
        Reason: {{ doc.description }}
    """,
    "recipients": [
        {
            "email_by_document_field": "leave_approver"
        }
    ],
    "condition": "doc.workflow_state == 'Pending Approval'"
})
email_alert.insert()
```

### 2. Auto-Assignment Based on State

**Assign documents to specific users when state changes:**

```python
# In custom script or server script
@frappe.whitelist()
def on_workflow_state_change(doc, method):
    """Auto-assign based on workflow state"""
    
    if doc.workflow_state == "Pending Manager Approval":
        # Assign to purchase manager
        manager = frappe.get_value("Employee", {"department": "Purchase"}, "user_id")
        if manager:
            frappe.share.add(doc.doctype, doc.name, manager, write=1, notify=1)
    
    elif doc.workflow_state == "Pending Director Approval":
        # Assign to director
        director = frappe.get_value("User", {"role_profile_name": "Director"}, "name")
        if director:
            frappe.share.add(doc.doctype, doc.name, director, write=1, notify=1)
```

### 3. Workflow State Badges

**Customize how workflow states appear in lists:**

```javascript
// In custom script for DocType
frappe.listview_settings['Leave Application'] = {
    get_indicator: function(doc) {
        const status_colors = {
            "Draft": "grey",
            "Pending Approval": "orange",
            "Approved": "green",
            "Rejected": "red"
        };
        
        return [doc.workflow_state, status_colors[doc.workflow_state], "workflow_state,=," + doc.workflow_state];
    }
};
```

### 4. Field-Level Permissions in Workflows

**Make specific fields editable only in certain states:**

```python
# Add to Custom Field or Field customization
{
    "fieldname": "discount_percentage",
    "permlevel": 1  # Different permission level
}

# Then in Role Permission Manager, set:
# - Sales User: Can edit permlevel 0 fields only
# - Sales Manager: Can edit permlevel 0 and 1 fields
```

### 5. Parallel Approval Workflows

**Require multiple approvals before proceeding:**

```python
# Custom validation to check multiple approvals
def validate_parallel_approvals(doc):
    """Require both manager and accountant approval"""
    
    if doc.workflow_state == "Pending Dual Approval":
        manager_approved = frappe.db.get_value(
            "Approval Log",
            {"document_name": doc.name, "approver_role": "Manager", "status": "Approved"}
        )
        
        accountant_approved = frappe.db.get_value(
            "Approval Log",
            {"document_name": doc.name, "approver_role": "Accounts Manager", "status": "Approved"}
        )
        
        if manager_approved and accountant_approved:
            doc.workflow_state = "Approved"
        else:
            frappe.throw("Both Manager and Accountant approval required")
```

---

## 8. Troubleshooting

### Common Issues and Solutions

#### Issue 1: Workflow Buttons Not Showing

**Symptoms:**
- User has correct role but can't see workflow action buttons
- Transitions not appearing

**Diagnosis:**
```python
# Check workflow configuration
workflow = frappe.get_doc("Workflow", "Leave Approval Process")
print("Is Active:", workflow.is_active)
print("Current State:", doc.workflow_state)

# Check user roles
user_roles = frappe.get_roles()
print("User Roles:", user_roles)

# Check allowed roles for transitions
for transition in workflow.transitions:
    if transition.state == doc.workflow_state:
        print(f"Action: {transition.action}, Allowed: {transition.allowed}")
```

**Solutions:**
1. Ensure workflow is active
2. Verify user has the role specified in "Allowed" field
3. Check if condition is met (if any)
4. Clear cache: `frappe.clear_cache()`

#### Issue 2: Can't Edit Document in Current State

**Symptoms:**
- Document is in a workflow state but user can't edit

**Solution:**
```python
# Check state configuration
for state in workflow.states:
    if state.state == doc.workflow_state:
        print(f"Allow Edit: {state.allow_edit}")
        print(f"User has role: {state.allow_edit in frappe.get_roles()}")
```

#### Issue 3: Self-Approval Not Being Prevented

**Symptoms:**
- Users can approve their own submissions

**Solution:**
```python
# In workflow transition, set:
{
    "allow_self_approval": 0
}

# Also add custom validation:
def validate_no_self_approval(doc, method):
    if doc.workflow_state == "Pending Approval":
        if doc.owner == frappe.session.user:
            frappe.throw("You cannot approve your own submission")
```

#### Issue 4: Workflow State Not Updating

**Symptoms:**
- State changes but doesn't save

**Solution:**
```python
# Ensure workflow_state field exists in DocType
# Check if field is added correctly:

fields = frappe.get_meta("Leave Application").fields
workflow_field = [f for f in fields if f.fieldname == "workflow_state"]
print("Workflow Field:", workflow_field)

# If missing, add it:
frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Leave Application",
    "fieldname": "workflow_state",
    "fieldtype": "Link",
    "label": "Workflow State",
    "options": "Workflow State",
    "hidden": 1
}).insert()
```

---

## Best Practices

### 1. **Keep Workflows Simple**
- Maximum 5-7 states
- Clear, linear progression when possible
- Avoid complex branching unless necessary

### 2. **Use Descriptive State Names**
❌ Bad: "State 1", "State 2"
✅ Good: "Pending Manager Approval", "Awaiting Finance Review"

### 3. **Document Your Workflows**
```python
# Add workflow description
workflow.description = """
Purpose: Approve leave applications with manager review
Process:
1. Employee submits leave application
2. Manager reviews and approves/rejects
3. If approved, document is submitted
4. HR is notified
"""
```

### 4. **Test State Transitions**
```python
# Test script
def test_workflow_transitions():
    # Create test document
    doc = frappe.get_doc({
        "doctype": "Leave Application",
        "employee": "EMP-001",
        "from_date": "2024-01-01",
        "to_date": "2024-01-05"
    })
    doc.insert()
    
    # Test transition
    doc.workflow_state = "Pending Approval"
    doc.save()
    
    print(f"Current State: {doc.workflow_state}")
    print(f"Available Actions: {get_available_actions(doc)}")
```

### 5. **Monitor Workflow Performance**
```python
# Report: Average approval time
frappe.db.sql("""
    SELECT 
        DATEDIFF(modified, creation) as days_to_approve,
        COUNT(*) as count
    FROM `tabLeave Application`
    WHERE workflow_state = 'Approved'
    GROUP BY DATEDIFF(modified, creation)
""")
```

---

## Quick Reference

### Useful SQL Queries

```sql
-- Find all documents stuck in a state
SELECT name, creation, workflow_state
FROM `tabPurchase Order`
WHERE workflow_state = 'Pending Approval'
AND DATEDIFF(NOW(), creation) > 7;

-- Count documents by workflow state
SELECT workflow_state, COUNT(*) as count
FROM `tabSales Order`
GROUP BY workflow_state;

-- Find workflows on a DocType
SELECT name, is_active
FROM `tabWorkflow`
WHERE document_type = 'Leave Application';
```

### Python Helper Functions

```python
def get_available_actions(doc):
    """Get actions available for current user on document"""
    from frappe.model.workflow import get_transitions
    
    transitions = get_transitions(doc)
    return [t.get("action") for t in transitions]

def force_workflow_state(doctype, docname, new_state):
    """Force change workflow state (use carefully!)"""
    doc = frappe.get_doc(doctype, docname)
    doc.workflow_state = new_state
    doc.flags.ignore_permissions = True
    doc.save()
    frappe.db.commit()
```

---

## Summary

**Workflows provide:**
- ✅ Controlled document lifecycle
- ✅ State-based permissions
- ✅ Approval hierarchies
- ✅ Audit trail
- ✅ Business process automation

**Key Takeaways:**
1. Workflows override standard role permissions
2. Each state defines who can edit
3. Transitions control who can change states
4. Conditions enable dynamic approval paths
5. Always test workflows thoroughly

---

**Resources:**
- ERPNext Workflow Documentation: https://docs.erpnext.com/docs/user/manual/en/setting-up/workflows
- Frappe Framework Workflow: https://frappeframework.com/docs/user/en/desk/workflow
- Community Forum: https://discuss.erpnext.com

---

**End of Workflow Guide**