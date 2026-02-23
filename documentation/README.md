# Juhudi ERPNext Documentation

This folder contains comprehensive guides and scripts for managing and customizing the Juhudi ERPNext V16 instance.

## 📚 Documentation Structure

### **Guides** (`/guides/`)
Comprehensive documentation covering various aspects of ERPNext customization and management.

#### Security & Authentication
- **[2FA SMS-Only Changes](guides/2fa_sms_only_changes.md)** - Documentation of the Two Factor Authentication customization to restrict to SMS only

#### User Management & Permissions
- **[Role Hierarchy Diagram](guides/role_hierarchy_diagram.md)** - Visual diagrams and explanations of role relationships and hierarchies
- **[Custom Roles Guide](guides/custom_roles_guide.md)** - Step-by-step guide for creating and managing custom roles
- **[User Permissions Guide](guides/user_permissions_guide.md)** - Multi-branch and multi-company user permission setup
- **[Workflow Permissions Guide](guides/workflow_permissions_guide.md)** - Understanding how workflows affect document permissions

#### Customization
- **[Login Background Customization](guides/login_background_customization_guide.md)** - Complete guide to customizing the login/landing page background

### **Scripts** (`/scripts/`)
Utility scripts for system management and auditing.

- **[User Permissions Audit Script](scripts/user_permissions_audit_script.py)** - Comprehensive script to audit all user permissions, roles, and access rights

---

## 🚀 Quick Start

### For Administrators
1. Start with the **Role Hierarchy Diagram** to understand the permission structure
2. Use the **Custom Roles Guide** when you need to create department-specific roles
3. Refer to **User Permissions Guide** for multi-branch setups

### For Developers
1. Review the **2FA SMS-Only Changes** to understand the customization approach
2. Use the **Login Background Customization** guide for branding customizations
3. Run the **User Permissions Audit Script** to analyze current permission setup

### For Auditors
1. Run the **User Permissions Audit Script** to generate compliance reports
2. Review the **Workflow Permissions Guide** to understand approval hierarchies

---

## 📊 Guide Details

| Guide | Size | Topics Covered |
|-------|------|----------------|
| Role Hierarchy Diagram | 11KB | Visual role relationships, organizational structure |
| Custom Roles Guide | 22KB | 10+ role templates, permission customization |
| User Permissions Guide | 14KB | Multi-company, branch restrictions, territories |
| Workflow Permissions | 23KB | Approval hierarchies, state-based permissions |
| Login Customization | 22KB | 7 background styles, animations, branding |
| 2FA Changes | 1.5KB | SMS-only authentication setup |

| Script | Size | Purpose |
|--------|------|---------|
| Permissions Audit | 19KB | Full system audit, compliance reports |

---

## 🔧 Usage Examples

### Running the Audit Script
```bash
# From the frappe-bench directory
cd documentation/scripts
python3 user_permissions_audit_script.py

# Output formats available:
# - Console output (default)
# - HTML report
# - JSON export
# - CSV export
```

### Implementing Custom Roles
```bash
# Refer to the Custom Roles Guide for templates
# Navigate to: Setup → Users and Permissions → Role
# Use the templates in custom_roles_guide.md
```

---

## 📝 Document History

| Date | Change | File |
|------|--------|------|
| 2026-02-23 | Initial documentation created | All files |
| 2026-02-23 | 2FA restricted to SMS only | 2fa_sms_only_changes.md |

---

## 🤝 Contributing

When adding new documentation:
1. Place guides in `/guides/` directory
2. Place scripts in `/scripts/` directory
3. Update this README with the new content
4. Use clear, descriptive filenames
5. Include examples and use cases

---

## 📞 Support

For questions about these guides or the Juhudi ERPNext instance:
- Review the relevant guide first
- Check the ERPNext official documentation
- Contact the system administrator

---

**Last Updated:** February 23, 2026  
**ERPNext Version:** 16.x  
**Frappe Version:** 16.x
