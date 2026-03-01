# ERPNext Third-Party Integration Points

## Overview
ERPNext, built on the Frappe Framework, provides multiple integration points for third-party applications. This guide outlines all available methods for integrating external systems with ERPNext.

---

## 1. REST API Integration

### 1.1 Standard REST API (v1)
The primary method for third-party integration. All DocTypes are automatically exposed via RESTful endpoints.

**Base URL Pattern:** `http://your-site.com/api/resource/{doctype}`

**Available Endpoints:**
- `GET /api/resource/{doctype}` - List records
- `POST /api/resource/{doctype}` - Create a new record
- `GET /api/resource/{doctype}/{name}` - Get a specific record
- `PUT /api/resource/{doctype}/{name}` - Update a record
- `DELETE /api/resource/{doctype}/{name}` - Delete a record
- `POST /api/resource/{doctype}/{name}` - Execute a document method

**Example:**
```bash
# Get list of customers
GET http://localhost:8000/api/resource/Customer

# Create a new customer
POST http://localhost:8000/api/resource/Customer
Content-Type: application/json
{
  "customer_name": "New Customer",
  "customer_type": "Company"
}

# Get specific customer
GET http://localhost:8000/api/resource/Customer/CUST-001

# Update customer
PUT http://localhost:8000/api/resource/Customer/CUST-001
Content-Type: application/json
{
  "customer_name": "Updated Customer Name"
}
```

**Implementation:** `apps/frappe/frappe/api/v1.py`

---

### 1.2 REST API v2
Enhanced API with improved performance and features.

**Base URL Pattern:** `http://your-site.com/api/v2/document/{doctype}`

**Implementation:** `apps/frappe/frappe/api/v2.py`

---

### 1.3 RPC/Method Calls
Execute whitelisted Python methods via HTTP.

**Endpoint:** `POST /api/method/{app}.{module}.{function}`

**Example:**
```bash
POST http://localhost:8000/api/method/erpnext.stock.get_item_details.get_item_details
Content-Type: application/json
{
  "item_code": "ITEM-001",
  "company": "My Company"
}
```

**Implementation:** `apps/frappe/frappe/handler.py`

---

## 2. Authentication Methods

### 2.1 API Key/Secret (Token-Based)
Best for server-to-server integration.

**Setup:**
1. Navigate to: User → API Access → Generate Keys
2. Use the `api_key` and `api_secret` in requests

**Usage:**
```bash
curl -X GET \
  -H "Authorization: token {api_key}:{api_secret}" \
  http://localhost:8000/api/resource/Customer
```

---

### 2.2 OAuth 2.0
Industry-standard authorization framework for third-party applications.

**Features:**
- Authorization Server (issue tokens to clients)
- Resource Server (protect ERPNext resources)
- Client (connect to other OAuth providers)

**Key DocTypes:**
- **OAuth Client** - Register third-party applications
- **OAuth Bearer Token** - Manage access tokens
- **OAuth Authorization Code** - Track authorization codes
- **OAuth Settings** - Configure OAuth features

**Endpoints:**
- Authorization: `/api/method/frappe.integrations.oauth2.authorize`
- Token: `/api/method/frappe.integrations.oauth2.get_token`
- Revoke: `/api/method/frappe.integrations.oauth2.revoke_token`
- Introspection: `/api/method/frappe.integrations.oauth2.introspect_token`
- UserInfo: `/api/method/frappe.integrations.oauth2.openid_profile`

**Additional Features:**
- Dynamic Client Registration (RFC7591)
- Authorization Server Metadata Discovery (RFC8414)
- Resource Server Metadata Discovery (RFC9728)

**Implementation:** `apps/frappe/frappe/integrations/oauth2.py`
**Documentation:** `apps/frappe/frappe/integrations/README.md`

---

### 2.3 Social Login Integration
Allow users to login via third-party providers (Google, Facebook, GitHub, etc.)

**DocType:** Social Login Key

**Implementation:** `apps/frappe/frappe/integrations/doctype/social_login_key/`

---

## 3. Webhooks (Outbound Integration)

Push real-time data to external systems when specific events occur in ERPNext.

### 3.1 Webhook Configuration
**DocType:** Webhook

**Features:**
- Trigger on DocType events: `after_insert`, `on_update`, `on_submit`, `on_cancel`, `on_trash`, `on_change`
- Conditional triggers using Python expressions
- Custom headers support
- HMAC signature for security
- Request methods: POST, PUT, DELETE
- Request formats: JSON, Form URL-Encoded
- Dynamic URL support with Jinja templates
- Retry mechanism (3 attempts)
- Request logging

**Example Configuration:**
```python
{
  "webhook_doctype": "Sales Order",
  "webhook_docevent": "after_insert",
  "request_url": "https://external-system.com/api/orders",
  "request_method": "POST",
  "request_structure": "JSON",
  "condition": "doc.status == 'Submitted'",
  "enable_security": 1,
  "webhook_secret": "your-secret-key"
}
```

**Security Header:**
- Header: `X-Frappe-Webhook-Signature`
- Method: HMAC-SHA256

**Implementation:** `apps/frappe/frappe/integrations/doctype/webhook/webhook.py`

---

## 4. Document Event Hooks

Extend ERPNext behavior by subscribing to document lifecycle events.

### 4.1 App-Level Hooks
Define in `hooks.py` of your custom app.

**Available Events:**
- `before_insert`
- `after_insert`
- `before_validate`
- `validate`
- `on_update`
- `on_submit`
- `on_cancel`
- `on_trash`
- `on_update_after_submit`
- `before_save`
- `after_delete`
- `on_change`

**Example (from ERPNext hooks.py):**
```python
doc_events = {
    "*": {
        "validate": [
            "erpnext.support.doctype.service_level_agreement.service_level_agreement.apply"
        ]
    },
    "Sales Invoice": {
        "on_submit": [
            "erpnext.regional.italy.utils.sales_invoice_on_submit"
        ],
        "on_cancel": [
            "erpnext.regional.italy.utils.sales_invoice_on_cancel"
        ]
    },
    "User": {
        "after_insert": "frappe.contacts.doctype.contact.contact.update_contact",
        "validate": "erpnext.setup.doctype.employee.employee.validate_employee_role"
    }
}
```

**Implementation:** `apps/erpnext/erpnext/hooks.py` (lines 335-400)

---

### 4.2 Override Whitelisted Methods
Replace default framework methods with custom implementations.

**Example:**
```python
override_whitelisted_methods = {
    "frappe.www.contact.send_message": "erpnext.templates.utils.send_message"
}
```

---

## 5. Connected Apps

Integrate ERPNext as a client to external OAuth providers.

**DocType:** Connected App

**Use Cases:**
- Access user's Google Drive
- Sync with external calendars
- Connect to third-party services

**Related DocTypes:**
- **Token Cache** - Store access tokens from external services

**Implementation:** `apps/frappe/frappe/integrations/doctype/connected_app/`

---

## 6. Custom API Endpoints

Create custom whitelisted methods accessible via HTTP.

### 6.1 Using @frappe.whitelist() Decorator

**Example:**
```python
# In your_app/api.py
import frappe

@frappe.whitelist()
def get_customer_balance(customer):
    """Custom API to get customer balance"""
    return frappe.get_value("Customer", customer, "outstanding_balance")

@frappe.whitelist(allow_guest=True)
def public_api():
    """Publicly accessible API"""
    return {"message": "Hello World"}
```

**Access:**
```bash
POST http://localhost:8000/api/method/your_app.api.get_customer_balance
Content-Type: application/json
{
  "customer": "CUST-001"
}
```

---

## 7. Integration Request Logging

Track all integration requests and responses.

**DocType:** Integration Request

**Features:**
- Log all incoming/outgoing requests
- Track status, errors, and responses
- Useful for debugging integrations

**Implementation:** `apps/frappe/frappe/integrations/doctype/integration_request/`

---

## 8. Webhook Request Logging

Monitor webhook delivery status and debug issues.

**DocType:** Webhook Request Log

**Features:**
- Log URL, headers, data sent
- Response from external system
- Error tracking
- Retry history

**Implementation:** `apps/frappe/frappe/integrations/doctype/webhook_request_log/`

---

## 9. Real-time Communication (Socket.IO)

Bidirectional communication for real-time features.

**Endpoint:** `ws://localhost:9000`

**Use Cases:**
- Real-time notifications
- Live updates
- Chat/messaging
- Collaborative editing

**Implementation:** `apps/frappe/socketio.js`, `apps/frappe/realtime/`

---

## 10. Custom App Development

Create a complete Frappe app to extend ERPNext.

### 10.1 App Structure
```
your_app/
├── hooks.py          # Integration points
├── api.py            # Custom API methods
├── your_app/
│   ├── __init__.py
│   ├── hooks.py
│   └── doctype/      # Custom DocTypes
```

### 10.2 Key Integration Points in hooks.py
```python
# Custom API endpoints
app_include_js = "your_app.bundle.js"

# Boot session data
boot_session = "your_app.boot.boot_session"

# Document events
doc_events = {
    "Sales Order": {
        "on_submit": "your_app.api.process_order"
    }
}

# Scheduled tasks
scheduler_events = {
    "hourly": [
        "your_app.tasks.sync_data"
    ]
}

# Override methods
override_whitelisted_methods = {
    "frappe.some_method": "your_app.custom_method"
}
```

---

## 11. Scheduled Tasks/Jobs

Run periodic background tasks for data synchronization.

**Configuration in hooks.py:**
```python
scheduler_events = {
    "all": [
        "your_app.tasks.all"
    ],
    "daily": [
        "your_app.tasks.daily"
    ],
    "hourly": [
        "your_app.tasks.hourly"
    ],
    "weekly": [
        "your_app.tasks.weekly"
    ],
    "monthly": [
        "your_app.tasks.monthly"
    ],
    "cron": {
        "0 */6 * * *": [
            "your_app.tasks.every_six_hours"
        ]
    }
}
```

---

## 12. Payment Gateway Integration

Integrate third-party payment providers.

**Examples in ERPNext:**
- Plaid Settings (Banking)
- Payment Gateway integrations

**DocType:** Plaid Settings (example)
**Implementation:** `apps/erpnext/erpnext/erpnext_integrations/doctype/plaid_settings/`

---

## 13. LDAP/Active Directory Integration

Integrate with enterprise directory services.

**DocType:** LDAP Settings

**Features:**
- User authentication via LDAP
- Group mapping
- Automatic user provisioning

**Implementation:** `apps/frappe/frappe/integrations/doctype/ldap_settings/`

---

## 14. Push Notifications

Send push notifications to mobile/web apps.

**DocType:** Push Notification Settings

**Implementation:** `apps/frappe/frappe/integrations/doctype/push_notification_settings/`

---

## 15. Email Integration

### 15.1 Incoming Email
Process incoming emails and create documents.

**DocType:** Email Account

---

### 15.2 Outgoing Webhooks
Send notifications via Slack, Microsoft Teams, etc.

**DocType:** Slack Webhook URL

**Implementation:** `apps/frappe/frappe/integrations/doctype/slack_webhook_url/`

---

## 16. EDI (Electronic Data Interchange)

For B2B integrations requiring standardized data formats.

**Location:** `apps/erpnext/erpnext/edi/`

**Features:**
- Code List management
- Import/Export utilities

---

## Best Practices

### Security
1. **Always use HTTPS** in production
2. **Enable webhook signatures** for outbound webhooks
3. **Use OAuth 2.0** for third-party integrations
4. **Rotate API keys** regularly
5. **Implement rate limiting** on custom endpoints
6. **Validate all input** in custom methods

### Performance
1. **Use background jobs** for heavy processing
2. **Implement caching** where appropriate
3. **Use batch operations** for bulk data sync
4. **Monitor webhook retry limits**

### Error Handling
1. **Log all integration attempts**
2. **Implement proper error responses**
3. **Use Integration Request Log** for tracking
4. **Set up alerts** for failed integrations

### Testing
1. **Test with sandbox environments** first
2. **Validate webhook signatures**
3. **Test error scenarios**
4. **Monitor request logs**

---

## Common Integration Patterns

### Pattern 1: Real-time Data Sync (Push)
```
ERPNext → Webhook → External System
```
Use when: External system needs immediate updates

### Pattern 2: Scheduled Data Sync (Pull)
```
External System → REST API → ERPNext (via scheduled job)
```
Use when: Batch updates are acceptable

### Pattern 3: Bidirectional Sync
```
ERPNext ↔ Webhooks + REST API ↔ External System
```
Use when: Both systems need to stay in sync

### Pattern 4: OAuth Integration
```
User → ERPNext (OAuth Client) → External OAuth Provider → Resources
```
Use when: Accessing user resources on external platforms

---

## Troubleshooting

### Enable Debug Logs
```python
# In site_config.json
{
  "developer_mode": 1,
  "logging": 2
}
```

### Check Webhook Logs
Navigate to: **Webhook Request Log** DocType

### Check Integration Logs
Navigate to: **Integration Request** DocType

### Monitor Background Jobs
```bash
bench worker --queue default
```

### Check Error Logs
```bash
tail -f logs/worker.error.log
tail -f logs/web.error.log
```

---

## Key Files Reference

| Component | File Path |
|-----------|-----------|
| REST API v1 | `apps/frappe/frappe/api/v1.py` |
| REST API v2 | `apps/frappe/frappe/api/v2.py` |
| OAuth 2.0 | `apps/frappe/frappe/integrations/oauth2.py` |
| Webhooks | `apps/frappe/frappe/integrations/doctype/webhook/webhook.py` |
| Request Handler | `apps/frappe/frappe/handler.py` |
| Client API | `apps/frappe/frappe/client.py` |
| ERPNext Hooks | `apps/erpnext/erpnext/hooks.py` |
| Socket.IO | `apps/frappe/socketio.js` |
| Integrations README | `apps/frappe/frappe/integrations/README.md` |

---

## External Documentation

1. [Frappe OAuth Setup Guide](https://docs.frappe.io/framework/user/en/guides/integration/how_to_set_up_oauth)
2. [Token-Based Authentication](https://docs.frappe.io/framework/user/en/guides/integration/rest_api/token_based_authentication)
3. [REST API Documentation](https://docs.frappe.io/framework/user/en/guides/integration/rest_api)
4. [Connected Apps](https://docs.frappe.io/framework/user/en/guides/app-development/connected-app)

---

## Summary

ERPNext provides **16 major integration points** for third-party applications:

1. ✅ REST API (v1 & v2)
2. ✅ RPC/Method Calls
3. ✅ OAuth 2.0
4. ✅ Webhooks (Outbound)
5. ✅ Document Event Hooks
6. ✅ Connected Apps
7. ✅ Custom API Endpoints
8. ✅ Socket.IO (Real-time)
9. ✅ Scheduled Tasks
10. ✅ Payment Gateways
11. ✅ LDAP/AD Integration
12. ✅ Push Notifications
13. ✅ Email Integration
14. ✅ Slack/Teams Webhooks
15. ✅ EDI Integration
16. ✅ Custom App Development

Choose the appropriate method based on your integration requirements, security needs, and real-time vs. batch processing preferences.
