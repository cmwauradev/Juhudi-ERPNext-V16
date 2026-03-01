# Complete Guide: Creating Custom Third-Party App Integration in ERPNext

This comprehensive guide walks you through creating a custom Frappe app with REST API endpoints for third-party integration.

---

## Table of Contents

1. [Understanding the Integration Workspace](#1-understanding-the-integration-workspace)
2. [Creating a Custom Frappe App](#2-creating-a-custom-frappe-app)
3. [Creating Custom API Endpoints](#3-creating-custom-api-endpoints)
4. [Authentication & Security](#4-authentication--security)
5. [Testing Your Endpoints](#5-testing-your-endpoints)
6. [Advanced Integration Patterns](#6-advanced-integration-patterns)
7. [Deployment & Best Practices](#7-deployment--best-practices)

---

## 1. Understanding the Integration Workspace

### 1.1 Frappe Bench Structure

Your ERPNext installation follows the Frappe Bench structure:

```
frappe-bench/
├── apps/                    # All Frappe applications
│   ├── frappe/             # Core framework
│   ├── erpnext/            # ERP application
│   ├── hrms/               # HR application
│   └── your_custom_app/    # Your custom app (to be created)
│
├── sites/                   # Site-specific data
│   ├── localhost/          # Your site
│   │   ├── site_config.json
│   │   └── site1.db
│   └── apps.txt            # Apps installed on sites
│
├── config/                  # Configuration files
│   ├── redis_cache.conf
│   └── redis_queue.conf
│
├── logs/                    # Application logs
├── env/                     # Python virtual environment
└── Procfile                 # Process definitions
```

### 1.2 How Integration Works

```
Third-Party App
      ↓
   HTTP Request
      ↓
ERPNext Web Server (bench serve)
      ↓
frappe/handler.py (Request Router)
      ↓
Your Custom Method (@frappe.whitelist)
      ↓
Business Logic
      ↓
Database (MariaDB)
      ↓
JSON Response
      ↓
Third-Party App
```

---

## 2. Creating a Custom Frappe App

### Step 1: Create the App Structure

```bash
# Navigate to your frappe-bench directory
cd /path/to/frappe-bench

# Create a new app
bench new-app custom_integration

# Follow the prompts:
# - App Title: Custom Integration
# - App Description: Custom API endpoints for third-party integration
# - App Publisher: Your Company
# - App Email: developer@yourcompany.com
# - App Icon: 🔌
# - App Color: #3498db
# - App License: MIT
```

This creates:
```
apps/custom_integration/
├── custom_integration/
│   ├── __init__.py
│   ├── hooks.py              # Integration hooks
│   ├── modules.txt
│   └── config/
├── setup.py
├── requirements.txt
├── README.md
└── license.txt
```

### Step 2: Install the App on Your Site

```bash
# Install app on localhost site
bench --site localhost install-app custom_integration

# Verify installation
bench --site localhost list-apps
```

Expected output:
```
frappe
erpnext
hrms
custom_integration
```

---

## 3. Creating Custom API Endpoints

### 3.1 Basic File Structure

Create the API module structure:

```bash
cd apps/custom_integration/custom_integration
mkdir api
touch api/__init__.py
touch api/customer_api.py
touch api/order_api.py
```

### 3.2 Example 1: Simple GET Endpoint

**File:** `apps/custom_integration/custom_integration/api/customer_api.py`

```python
import frappe
from frappe import _

@frappe.whitelist()
def get_customer_details(customer_id):
    """
    Get customer details by ID
    
    Args:
        customer_id (str): Customer ID
    
    Returns:
        dict: Customer details
    """
    try:
        customer = frappe.get_doc("Customer", customer_id)
        
        return {
            "success": True,
            "data": {
                "customer_name": customer.customer_name,
                "customer_type": customer.customer_type,
                "customer_group": customer.customer_group,
                "territory": customer.territory,
                "email": customer.email_id,
                "mobile": customer.mobile_no,
                "outstanding_balance": customer.get("outstanding_balance", 0)
            }
        }
    except frappe.DoesNotExistError:
        frappe.throw(_("Customer {0} not found").format(customer_id))
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Customer Details Error")
        return {
            "success": False,
            "error": str(e)
        }
```

**API Endpoint:**
```
POST http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details
Content-Type: application/json

{
  "customer_id": "CUST-00001"
}
```

### 3.3 Example 2: Create Record Endpoint

```python
@frappe.whitelist()
def create_customer(data):
    """
    Create a new customer
    
    Args:
        data (dict): Customer data
    
    Returns:
        dict: Created customer details
    """
    try:
        # Parse data if it's a JSON string
        if isinstance(data, str):
            import json
            data = json.loads(data)
        
        # Validate required fields
        required_fields = ["customer_name", "customer_type"]
        for field in required_fields:
            if not data.get(field):
                frappe.throw(_(f"Field '{field}' is required"))
        
        # Create customer document
        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": data.get("customer_name"),
            "customer_type": data.get("customer_type", "Company"),
            "customer_group": data.get("customer_group", "Commercial"),
            "territory": data.get("territory", "All Territories"),
            "email_id": data.get("email"),
            "mobile_no": data.get("mobile"),
            "custom_external_id": data.get("external_id")  # Custom field
        })
        
        customer.insert(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Customer created successfully",
            "data": {
                "customer_id": customer.name,
                "customer_name": customer.customer_name
            }
        }
        
    except frappe.ValidationError as e:
        frappe.db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Create Customer Error")
        return {
            "success": False,
            "error": str(e)
        }
```

**API Call:**
```bash
curl -X POST \
  http://localhost:8000/api/method/custom_integration.api.customer_api.create_customer \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "customer_name": "New Customer Ltd",
      "customer_type": "Company",
      "email": "contact@newcustomer.com",
      "mobile": "+1234567890",
      "external_id": "EXT-12345"
    }
  }'
```


### 3.4 Example 3: Update Record Endpoint

```python
@frappe.whitelist()
def update_customer(customer_id, data):
    """
    Update existing customer
    
    Args:
        customer_id (str): Customer ID
        data (dict): Fields to update
    
    Returns:
        dict: Update result
    """
    try:
        if isinstance(data, str):
            import json
            data = json.loads(data)
        
        customer = frappe.get_doc("Customer", customer_id)
        
        # Update allowed fields
        allowed_fields = ["customer_name", "email_id", "mobile_no", "customer_group", "territory"]
        for field in allowed_fields:
            if field in data:
                customer.set(field, data[field])
        
        customer.save(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Customer updated successfully",
            "data": {
                "customer_id": customer.name,
                "customer_name": customer.customer_name
            }
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Update Customer Error")
        return {
            "success": False,
            "error": str(e)
        }
```

### 3.5 Example 4: List/Search Endpoint

```python
@frappe.whitelist()
def search_customers(filters=None, limit=20, offset=0):
    """
    Search customers with filters
    
    Args:
        filters (dict): Search filters
        limit (int): Number of records to return
        offset (int): Pagination offset
    
    Returns:
        dict: List of customers
    """
    try:
        if isinstance(filters, str):
            import json
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Build query
        customers = frappe.get_list(
            "Customer",
            filters=filters,
            fields=["name", "customer_name", "customer_type", "email_id", "mobile_no"],
            limit_start=offset,
            limit_page_length=limit,
            order_by="creation desc"
        )
        
        # Get total count
        total = frappe.db.count("Customer", filters=filters)
        
        return {
            "success": True,
            "data": customers,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Search Customers Error")
        return {
            "success": False,
            "error": str(e)
        }
```

**API Call:**
```
POST http://localhost:8000/api/method/custom_integration.api.customer_api.search_customers
Content-Type: application/json

{
  "filters": {"customer_type": "Company"},
  "limit": 10,
  "offset": 0
}
```


### 3.6 Example 5: Complex Business Logic Endpoint

**File:** `apps/custom_integration/custom_integration/api/order_api.py`

```python
import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist()
def create_sales_order(data):
    """
    Create a sales order with items
    
    Args:
        data (dict): Order data with items
        
    Expected data structure:
    {
        "customer": "CUST-00001",
        "delivery_date": "2024-12-31",
        "items": [
            {
                "item_code": "ITEM-001",
                "qty": 10,
                "rate": 100
            }
        ],
        "external_order_id": "EXT-ORDER-123"
    }
    
    Returns:
        dict: Created order details
    """
    try:
        if isinstance(data, str):
            import json
            data = json.loads(data)
        
        # Validate customer exists
        if not frappe.db.exists("Customer", data.get("customer")):
            frappe.throw(_("Customer {0} does not exist").format(data.get("customer")))
        
        # Get company (assuming first company)
        company = frappe.defaults.get_user_default("Company")
        if not company:
            company = frappe.get_all("Company", limit=1)[0].name
        
        # Create Sales Order
        sales_order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": data.get("customer"),
            "delivery_date": data.get("delivery_date", nowdate()),
            "company": company,
            "custom_external_order_id": data.get("external_order_id")
        })
        
        # Add items
        for item in data.get("items", []):
            sales_order.append("items", {
                "item_code": item.get("item_code"),
                "qty": flt(item.get("qty", 1)),
                "rate": flt(item.get("rate", 0)),
                "delivery_date": data.get("delivery_date", nowdate())
            })
        
        # Insert and submit if required
        sales_order.insert(ignore_permissions=True)
        
        if data.get("submit", False):
            sales_order.submit()
        
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Sales Order created successfully",
            "data": {
                "sales_order": sales_order.name,
                "customer": sales_order.customer,
                "total": sales_order.total,
                "status": sales_order.status
            }
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Create Sales Order Error")
        return {
            "success": False,
            "error": str(e)
        }


@frappe.whitelist()
def get_order_status(sales_order_id):
    """
    Get sales order status and details
    
    Args:
        sales_order_id (str): Sales Order ID
        
    Returns:
        dict: Order status and details
    """
    try:
        order = frappe.get_doc("Sales Order", sales_order_id)
        
        items = []
        for item in order.items:
            items.append({
                "item_code": item.item_code,
                "item_name": item.item_name,
                "qty": item.qty,
                "delivered_qty": item.delivered_qty,
                "rate": item.rate,
                "amount": item.amount
            })
        
        return {
            "success": True,
            "data": {
                "sales_order": order.name,
                "customer": order.customer,
                "customer_name": order.customer_name,
                "status": order.status,
                "total": order.total,
                "delivery_date": str(order.delivery_date),
                "per_delivered": order.per_delivered,
                "items": items,
                "external_order_id": order.get("custom_external_order_id")
            }
        }
        
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "error": f"Sales Order {sales_order_id} not found"
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Order Status Error")
        return {
            "success": False,
            "error": str(e)
        }
```

### 3.7 Example 6: Batch Operations

```python
@frappe.whitelist()
def bulk_update_customers(updates):
    """
    Update multiple customers in one call
    
    Args:
        updates (list): List of customer updates
        
    Expected structure:
    [
        {"customer_id": "CUST-001", "data": {"email_id": "new@email.com"}},
        {"customer_id": "CUST-002", "data": {"mobile_no": "1234567890"}}
    ]
    
    Returns:
        dict: Results of bulk update
    """
    try:
        if isinstance(updates, str):
            import json
            updates = json.loads(updates)
        
        results = []
        errors = []
        
        for update in updates:
            try:
                customer_id = update.get("customer_id")
                data = update.get("data", {})
                
                customer = frappe.get_doc("Customer", customer_id)
                
                for field, value in data.items():
                    customer.set(field, value)
                
                customer.save(ignore_permissions=True)
                
                results.append({
                    "customer_id": customer_id,
                    "success": True
                })
                
            except Exception as e:
                errors.append({
                    "customer_id": customer_id,
                    "success": False,
                    "error": str(e)
                })
        
        frappe.db.commit()
        
        return {
            "success": True,
            "updated": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Bulk Update Error")
        return {
            "success": False,
            "error": str(e)
        }
```


### 3.8 Example 7: File Upload Endpoint

```python
@frappe.whitelist()
def upload_customer_document(customer_id, file_content, filename):
    """
    Upload a document/file for a customer
    
    Args:
        customer_id (str): Customer ID
        file_content (str): Base64 encoded file content
        filename (str): Name of the file
        
    Returns:
        dict: Uploaded file details
    """
    try:
        import base64
        
        # Decode base64 file content
        file_data = base64.b64decode(file_content)
        
        # Create file document
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": filename,
            "attached_to_doctype": "Customer",
            "attached_to_name": customer_id,
            "content": file_data,
            "is_private": 1
        })
        
        file_doc.save(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "data": {
                "file_name": file_doc.file_name,
                "file_url": file_doc.file_url
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Upload File Error")
        return {
            "success": False,
            "error": str(e)
        }
```

### 3.9 Example 8: Public API (No Authentication Required)

```python
@frappe.whitelist(allow_guest=True)
def get_product_catalog(category=None):
    """
    Public API to get product catalog
    No authentication required
    
    Args:
        category (str): Product category filter
        
    Returns:
        dict: Product list
    """
    try:
        filters = {"disabled": 0}
        if category:
            filters["item_group"] = category
        
        items = frappe.get_all(
            "Item",
            filters=filters,
            fields=["item_code", "item_name", "item_group", "standard_rate", "description"],
            limit=100
        )
        
        return {
            "success": True,
            "data": items
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

**Usage:** This endpoint can be accessed without authentication:
```
GET http://localhost:8000/api/method/custom_integration.api.customer_api.get_product_catalog?category=Products
```

---

## 4. Authentication & Security

### 4.1 Generate API Keys

**Method 1: Via UI**
1. Login to ERPNext as Administrator
2. Go to: User → Select a user
3. Click "API Access" section
4. Click "Generate Keys"
5. Copy the API Key and API Secret

**Method 2: Programmatically**

```python
import frappe
from frappe.core.doctype.user.user import generate_keys

# Generate keys for a user
api_key, api_secret = generate_keys("user@example.com")
print(f"API Key: {api_key}")
print(f"API Secret: {api_secret}")
```

### 4.2 Using API Keys in Requests

**Python Example:**

```python
import requests

url = "http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details"
headers = {
    "Authorization": "token YOUR_API_KEY:YOUR_API_SECRET",
    "Content-Type": "application/json"
}
data = {
    "customer_id": "CUST-00001"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

**cURL Example:**

```bash
curl -X POST \
  http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"customer_id": "CUST-00001"}'
```

**JavaScript Example:**

```javascript
const axios = require('axios');

const apiKey = 'YOUR_API_KEY';
const apiSecret = 'YOUR_API_SECRET';

const url = 'http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details';

axios.post(url, {
    customer_id: 'CUST-00001'
}, {
    headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log(response.data);
})
.catch(error => {
    console.error(error);
});
```

### 4.3 Role-Based Access Control

Add permission checks in your API:

```python
@frappe.whitelist()
def delete_customer(customer_id):
    """
    Delete a customer (requires specific role)
    """
    # Check if user has required role
    if not frappe.has_permission("Customer", "delete"):
        frappe.throw(_("You do not have permission to delete customers"), frappe.PermissionError)
    
    try:
        frappe.delete_doc("Customer", customer_id, ignore_permissions=False)
        frappe.db.commit()
        
        return {
            "success": True,
            "message": "Customer deleted successfully"
        }
    except Exception as e:
        frappe.db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
```

### 4.4 Rate Limiting

Implement rate limiting to prevent abuse:

```python
import frappe
from frappe.utils import now_datetime, add_to_date
from datetime import datetime

@frappe.whitelist()
def rate_limited_endpoint():
    """
    Endpoint with rate limiting
    """
    user = frappe.session.user
    cache_key = f"rate_limit:{user}"
    
    # Get request count from cache
    request_data = frappe.cache().get(cache_key) or {"count": 0, "reset_time": str(now_datetime())}
    
    # Check if reset time has passed
    if datetime.fromisoformat(request_data["reset_time"]) < now_datetime():
        request_data = {"count": 0, "reset_time": str(add_to_date(now_datetime(), minutes=1))}
    
    # Check rate limit (100 requests per minute)
    if request_data["count"] >= 100:
        frappe.throw(_("Rate limit exceeded. Try again later."), frappe.RateLimitExceededError)
    
    # Increment counter
    request_data["count"] += 1
    frappe.cache().set(cache_key, request_data, expires_in_sec=60)
    
    return {
        "success": True,
        "message": "Request successful",
        "rate_limit": {
            "remaining": 100 - request_data["count"],
            "reset_time": request_data["reset_time"]
        }
    }
```


---

## 5. Testing Your Endpoints

### 5.1 Using Postman

**Step 1: Create a New Request**
- Method: POST
- URL: `http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details`

**Step 2: Add Authorization**
- Go to "Authorization" tab
- Type: "No Auth" (we'll add manually)
- Go to "Headers" tab
- Add: `Authorization: token YOUR_API_KEY:YOUR_API_SECRET`

**Step 3: Add Request Body**
- Go to "Body" tab
- Select "raw" and "JSON"
- Enter:
```json
{
  "customer_id": "CUST-00001"
}
```

**Step 4: Send Request**

### 5.2 Using Python Requests Library

Create a test script: `test_api.py`

```python
import requests
import json

class ERPNextAPI:
    def __init__(self, base_url, api_key, api_secret):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"token {api_key}:{api_secret}",
            "Content-Type": "application/json"
        }
    
    def get_customer(self, customer_id):
        url = f"{self.base_url}/api/method/custom_integration.api.customer_api.get_customer_details"
        data = {"customer_id": customer_id}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
    
    def create_customer(self, customer_data):
        url = f"{self.base_url}/api/method/custom_integration.api.customer_api.create_customer"
        data = {"data": customer_data}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
    
    def search_customers(self, filters=None, limit=20):
        url = f"{self.base_url}/api/method/custom_integration.api.customer_api.search_customers"
        data = {
            "filters": filters or {},
            "limit": limit,
            "offset": 0
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

# Usage
if __name__ == "__main__":
    api = ERPNextAPI(
        base_url="http://localhost:8000",
        api_key="YOUR_API_KEY",
        api_secret="YOUR_API_SECRET"
    )
    
    # Test 1: Get customer
    print("Test 1: Get Customer")
    result = api.get_customer("CUST-00001")
    print(json.dumps(result, indent=2))
    
    # Test 2: Create customer
    print("\nTest 2: Create Customer")
    new_customer = {
        "customer_name": "Test Customer",
        "customer_type": "Company",
        "email": "test@example.com"
    }
    result = api.create_customer(new_customer)
    print(json.dumps(result, indent=2))
    
    # Test 3: Search customers
    print("\nTest 3: Search Customers")
    result = api.search_customers(filters={"customer_type": "Company"}, limit=5)
    print(json.dumps(result, indent=2))
```

Run the test:
```bash
python test_api.py
```

### 5.3 Using cURL

**Test 1: Get Customer**
```bash
curl -X POST \
  http://localhost:8000/api/method/custom_integration.api.customer_api.get_customer_details \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"customer_id": "CUST-00001"}'
```

**Test 2: Create Customer**
```bash
curl -X POST \
  http://localhost:8000/api/method/custom_integration.api.customer_api.create_customer \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "customer_name": "API Test Customer",
      "customer_type": "Individual",
      "email": "apitest@example.com"
    }
  }'
```

**Test 3: Search Customers**
```bash
curl -X POST \
  http://localhost:8000/api/method/custom_integration.api.customer_api.search_customers \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "filters": {"customer_type": "Company"},
    "limit": 10
  }'
```

### 5.4 Automated Testing with Unit Tests

Create: `apps/custom_integration/custom_integration/tests/test_customer_api.py`

```python
import frappe
import unittest
from custom_integration.api.customer_api import (
    get_customer_details,
    create_customer,
    search_customers
)

class TestCustomerAPI(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        frappe.set_user("Administrator")
        
        # Create test customer
        if not frappe.db.exists("Customer", "TEST-CUST-001"):
            customer = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": "Test Customer",
                "customer_type": "Company"
            })
            customer.insert()
            frappe.db.commit()
    
    def tearDown(self):
        """Clean up test data"""
        # Delete test customers
        frappe.db.delete("Customer", {"name": ["like", "TEST-CUST-%"]})
        frappe.db.commit()
    
    def test_get_customer_details(self):
        """Test getting customer details"""
        result = get_customer_details("TEST-CUST-001")
        self.assertTrue(result.get("success"))
        self.assertEqual(result["data"]["customer_name"], "Test Customer")
    
    def test_create_customer(self):
        """Test creating a customer"""
        data = {
            "customer_name": "New Test Customer",
            "customer_type": "Individual",
            "email": "newtest@example.com"
        }
        result = create_customer(data)
        self.assertTrue(result.get("success"))
        self.assertIn("customer_id", result["data"])
    
    def test_search_customers(self):
        """Test searching customers"""
        result = search_customers(filters={"customer_type": "Company"}, limit=10)
        self.assertTrue(result.get("success"))
        self.assertIsInstance(result["data"], list)
        self.assertGreater(result["total"], 0)

# Run tests
if __name__ == "__main__":
    unittest.main()
```

Run the tests:
```bash
cd apps/custom_integration
python -m unittest custom_integration.tests.test_customer_api
```

Or using bench:
```bash
bench --site localhost run-tests --app custom_integration
```

