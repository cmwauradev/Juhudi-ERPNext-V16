#!/usr/bin/env python3
"""
ERPNext User Permissions Audit Script
======================================
This script audits and displays comprehensive permission information for users in ERPNext.

Usage:
    # From bench directory
    bench --site [sitename] execute tmp_rovodev_user_permissions_audit_script.audit_all_users
    
    # Or audit specific user
    bench --site [sitename] execute tmp_rovodev_user_permissions_audit_script.audit_user --args "['user@example.com']"
    
    # Or run interactively
    bench --site [sitename] console
    >>> from tmp_rovodev_user_permissions_audit_script import audit_all_users
    >>> audit_all_users()
"""

import frappe
from frappe import _
from frappe.permissions import get_valid_perms
import json
from collections import defaultdict


def audit_user(user_email):
    """
    Comprehensive audit of a single user's permissions
    
    Args:
        user_email (str): Email of the user to audit
    
    Returns:
        dict: Complete permission audit data
    """
    if not frappe.db.exists("User", user_email):
        print(f"❌ User '{user_email}' does not exist!")
        return None
    
    user_doc = frappe.get_doc("User", user_email)
    
    print("\n" + "="*80)
    print(f"🔍 USER PERMISSION AUDIT: {user_email}")
    print("="*80)
    
    # 1. Basic User Information
    print("\n📋 BASIC INFORMATION")
    print("-" * 80)
    print(f"Full Name:        {user_doc.full_name}")
    print(f"User Type:        {user_doc.user_type}")
    print(f"Enabled:          {'✅ Yes' if user_doc.enabled else '❌ No'}")
    print(f"Desk Access:      {'✅ Yes' if user_doc.get('user_type') == 'System User' else '❌ No (Website User)'}")
    print(f"Creation Date:    {user_doc.creation}")
    print(f"Last Login:       {user_doc.last_login or 'Never'}")
    print(f"Last Active:      {user_doc.last_active or 'N/A'}")
    
    # 2. Assigned Roles
    print("\n👤 ASSIGNED ROLES")
    print("-" * 80)
    roles = frappe.get_all(
        "Has Role",
        filters={"parent": user_email, "parenttype": "User"},
        fields=["role"],
        order_by="role"
    )
    
    if roles:
        for idx, role_data in enumerate(roles, 1):
            role_name = role_data.role
            role_doc = frappe.get_doc("Role", role_name)
            
            desk_access = "🖥️  Desk" if role_doc.desk_access else "🌐 Web"
            disabled = " (DISABLED)" if role_doc.disabled else ""
            
            print(f"  {idx:2d}. {role_name:30s} {desk_access}{disabled}")
    else:
        print("  ⚠️  No roles assigned!")
    
    # 3. Role Profile
    print("\n📦 ROLE PROFILE")
    print("-" * 80)
    if user_doc.role_profile_name:
        print(f"  Profile: {user_doc.role_profile_name}")
        profile_roles = frappe.get_all(
            "Has Role",
            filters={"parent": user_doc.role_profile_name, "parenttype": "Role Profile"},
            fields=["role"]
        )
        print(f"  Roles from profile: {', '.join([r.role for r in profile_roles])}")
    else:
        print("  No role profile assigned")
    
    # 4. User Permissions (Record-level restrictions)
    print("\n🔒 USER PERMISSIONS (Record-Level Restrictions)")
    print("-" * 80)
    user_permissions = frappe.get_all(
        "User Permission",
        filters={"user": user_email},
        fields=["allow", "for_value", "applicable_for", "is_default", "apply_to_all_doctypes"],
        order_by="allow"
    )
    
    if user_permissions:
        grouped_perms = defaultdict(list)
        for perm in user_permissions:
            grouped_perms[perm.allow].append(perm)
        
        for doctype, perms in grouped_perms.items():
            print(f"\n  📄 {doctype}:")
            for perm in perms:
                default_flag = " [DEFAULT]" if perm.is_default else ""
                all_flag = " [ALL DOCTYPES]" if perm.apply_to_all_doctypes else ""
                applicable = f" → Applies to: {perm.applicable_for}" if perm.applicable_for else ""
                
                print(f"     ✓ {perm.for_value}{default_flag}{all_flag}{applicable}")
    else:
        print("  ℹ️  No user permissions set (can access all records as per role permissions)")
    
    # 5. Document Type Permissions Summary
    print("\n📝 DOCUMENT TYPE PERMISSIONS SUMMARY")
    print("-" * 80)
    print("  Top 20 DocTypes with permissions:\n")
    
    # Get all doctypes the user has access to
    all_roles = [r.role for r in roles]
    doctype_perms = defaultdict(lambda: {
        'read': False, 'write': False, 'create': False, 
        'delete': False, 'submit': False, 'cancel': False,
        'print': False, 'email': False, 'report': False,
        'import': False, 'export': False, 'share': False
    })
    
    # Query permissions for all roles
    for role_name in all_roles:
        perms = frappe.get_all(
            "Custom DocPerm",
            filters={"role": role_name},
            fields=["parent", "read", "write", "create", "delete", "submit", "cancel", 
                   "print", "email", "report", "import", "export", "share"]
        )
        
        if not perms:
            # Fallback to standard DocPerm
            perms = frappe.get_all(
                "DocPerm",
                filters={"role": role_name},
                fields=["parent", "read", "write", "create", "delete", "submit", "cancel",
                       "print", "email", "report", "import", "export", "share"]
            )
        
        for perm in perms:
            doctype = perm.parent
            for perm_type in ['read', 'write', 'create', 'delete', 'submit', 'cancel', 
                             'print', 'email', 'report', 'import', 'export', 'share']:
                if perm.get(perm_type):
                    doctype_perms[doctype][perm_type] = True
    
    # Display top doctypes
    sorted_doctypes = sorted(doctype_perms.items(), key=lambda x: x[0])[:20]
    
    if sorted_doctypes:
        print(f"  {'DocType':<35} {'R':>3} {'W':>3} {'C':>3} {'D':>3} {'S':>3} {'X':>3} {'P':>3} {'E':>3}")
        print("  " + "-" * 76)
        
        for doctype, perms in sorted_doctypes:
            r = "✓" if perms['read'] else "·"
            w = "✓" if perms['write'] else "·"
            c = "✓" if perms['create'] else "·"
            d = "✓" if perms['delete'] else "·"
            s = "✓" if perms['submit'] else "·"
            x = "✓" if perms['cancel'] else "·"
            p = "✓" if perms['print'] else "·"
            e = "✓" if perms['email'] else "·"
            
            print(f"  {doctype:<35} {r:>3} {w:>3} {c:>3} {d:>3} {s:>3} {x:>3} {p:>3} {e:>3}")
        
        print("\n  Legend: R=Read, W=Write, C=Create, D=Delete, S=Submit, X=Cancel, P=Print, E=Email")
    else:
        print("  ⚠️  No specific document permissions found")
    
    # 6. Module Access
    print("\n🎯 MODULE ACCESS")
    print("-" * 80)
    
    # Get allowed modules based on roles
    modules = set()
    for role_name in all_roles:
        role_perms = frappe.get_all(
            "DocPerm",
            filters={"role": role_name, "read": 1},
            fields=["parent"],
            distinct=True
        )
        
        for perm in role_perms:
            doctype_meta = frappe.get_meta(perm.parent)
            if doctype_meta and doctype_meta.module:
                modules.add(doctype_meta.module)
    
    if modules:
        sorted_modules = sorted(list(modules))
        for idx, module in enumerate(sorted_modules, 1):
            print(f"  {idx:2d}. {module}")
    else:
        print("  No module access found")
    
    # 7. Special Permissions
    print("\n⚡ SPECIAL PERMISSIONS & SETTINGS")
    print("-" * 80)
    
    special_perms = []
    
    # Check various special permissions
    if user_doc.send_me_a_copy:
        special_perms.append("📧 Receives copy of sent emails")
    
    if user_doc.allowed_in_mentions:
        special_perms.append("💬 Can be mentioned in comments")
    
    if user_doc.document_follow_notify:
        special_perms.append("🔔 Receives notifications for followed documents")
    
    if user_doc.simultaneous_sessions:
        special_perms.append(f"🖥️  Simultaneous sessions: {user_doc.simultaneous_sessions}")
    
    if user_doc.bypass_restrict_ip_check_if_2fa_enabled:
        special_perms.append("🔐 Bypass IP restriction if 2FA enabled")
    
    # Check if user is System Manager
    if "System Manager" in all_roles:
        special_perms.append("👑 SYSTEM MANAGER - Full system access")
    
    # Check API access
    if user_doc.api_key:
        special_perms.append("🔑 API Access enabled")
    
    if special_perms:
        for perm in special_perms:
            print(f"  ✓ {perm}")
    else:
        print("  No special permissions configured")
    
    # 8. Security Settings
    print("\n🛡️  SECURITY SETTINGS")
    print("-" * 80)
    
    print(f"  Allow Login:               {'✅ Yes' if not user_doc.enabled == 0 else '❌ No'}")
    print(f"  Require Password Change:   {'✅ Yes' if user_doc.reset_password_key else '❌ No'}")
    print(f"  Login After:               {user_doc.login_after or 'Not set'}")
    print(f"  Login Before:              {user_doc.login_before or 'Not set'}")
    print(f"  Restrict IP:               {user_doc.restrict_ip or 'Not restricted'}")
    print(f"  Last IP:                   {user_doc.last_ip or 'N/A'}")
    print(f"  Last Password Reset:       {user_doc.last_password_reset_date or 'N/A'}")
    
    # 9. Social Logins
    social_logins = frappe.get_all(
        "User Social Login",
        filters={"parent": user_email},
        fields=["provider", "userid"]
    )
    
    if social_logins:
        print("\n🔗 SOCIAL LOGINS")
        print("-" * 80)
        for login in social_logins:
            print(f"  ✓ {login.provider}: {login.userid}")
    
    print("\n" + "="*80 + "\n")
    
    return {
        "user": user_email,
        "roles": [r.role for r in roles],
        "user_permissions": user_permissions,
        "enabled": user_doc.enabled,
        "user_type": user_doc.user_type
    }


def audit_all_users(include_disabled=False, output_file=None):
    """
    Audit all users in the system
    
    Args:
        include_disabled (bool): Include disabled users in the audit
        output_file (str): Optional file path to save JSON output
    """
    filters = {}
    if not include_disabled:
        filters["enabled"] = 1
    
    users = frappe.get_all(
        "User",
        filters=filters,
        fields=["name", "full_name", "user_type", "enabled", "creation"],
        order_by="creation desc"
    )
    
    print("\n" + "="*80)
    print(f"🔍 SYSTEM-WIDE USER PERMISSIONS AUDIT")
    print("="*80)
    print(f"Total users: {len(users)}")
    print(f"Include disabled: {include_disabled}")
    print("="*80 + "\n")
    
    audit_results = []
    
    for idx, user_data in enumerate(users, 1):
        # Skip standard users
        if user_data.name in ["Administrator", "Guest"]:
            continue
        
        print(f"\n[{idx}/{len(users)}] Auditing: {user_data.name}")
        result = audit_user(user_data.name)
        
        if result:
            audit_results.append(result)
    
    # Summary Statistics
    print("\n" + "="*80)
    print("📊 SUMMARY STATISTICS")
    print("="*80)
    
    # Count users by type
    system_users = sum(1 for r in audit_results if r.get('user_type') == 'System User')
    website_users = sum(1 for r in audit_results if r.get('user_type') == 'Website User')
    
    print(f"\n  System Users:  {system_users}")
    print(f"  Website Users: {website_users}")
    
    # Most common roles
    role_counts = defaultdict(int)
    for result in audit_results:
        for role in result.get('roles', []):
            role_counts[role] += 1
    
    print("\n  Most Common Roles:")
    for role, count in sorted(role_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    {role:<30s}: {count:>3} users")
    
    # Users with user permissions
    users_with_restrictions = sum(1 for r in audit_results if r.get('user_permissions'))
    print(f"\n  Users with record-level restrictions: {users_with_restrictions}")
    
    print("\n" + "="*80 + "\n")
    
    # Save to file if requested
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(audit_results, f, indent=2, default=str)
        print(f"✅ Audit results saved to: {output_file}\n")
    
    return audit_results


def audit_role(role_name):
    """
    Audit a specific role - show all users with this role and permissions
    
    Args:
        role_name (str): Name of the role to audit
    """
    if not frappe.db.exists("Role", role_name):
        print(f"❌ Role '{role_name}' does not exist!")
        return None
    
    role_doc = frappe.get_doc("Role", role_name)
    
    print("\n" + "="*80)
    print(f"🎭 ROLE AUDIT: {role_name}")
    print("="*80)
    
    print("\n📋 ROLE INFORMATION")
    print("-" * 80)
    print(f"Desk Access:      {'✅ Yes' if role_doc.desk_access else '❌ No'}")
    print(f"Disabled:         {'❌ Yes' if role_doc.disabled else '✅ No'}")
    print(f"Two Factor Auth:  {'✅ Required' if role_doc.two_factor_auth else '❌ Not Required'}")
    print(f"Is Custom:        {'✅ Yes' if role_doc.is_custom else '❌ No (Standard)'}")
    
    # Users with this role
    print("\n👥 USERS WITH THIS ROLE")
    print("-" * 80)
    
    users_with_role = frappe.get_all(
        "Has Role",
        filters={"role": role_name, "parenttype": "User"},
        fields=["parent"],
        order_by="parent"
    )
    
    if users_with_role:
        for idx, user_data in enumerate(users_with_role, 1):
            user = frappe.get_doc("User", user_data.parent)
            status = "✅" if user.enabled else "❌"
            print(f"  {idx:2d}. {status} {user.name:40s} ({user.full_name})")
        print(f"\n  Total: {len(users_with_role)} users")
    else:
        print("  ⚠️  No users assigned this role")
    
    # Document permissions for this role
    print("\n📝 DOCUMENT PERMISSIONS")
    print("-" * 80)
    
    perms = frappe.get_all(
        "DocPerm",
        filters={"role": role_name},
        fields=["parent", "read", "write", "create", "delete", "submit", "cancel", 
               "print", "email", "report", "import", "export", "share", "if_owner"],
        order_by="parent"
    )
    
    if perms:
        print(f"\n  {'DocType':<35} {'Permissions':<45}")
        print("  " + "-" * 76)
        
        for perm in perms[:50]:  # Limit to 50 for readability
            perm_list = []
            if perm.read: perm_list.append("Read")
            if perm.write: perm_list.append("Write")
            if perm.create: perm_list.append("Create")
            if perm.delete: perm_list.append("Delete")
            if perm.submit: perm_list.append("Submit")
            if perm.cancel: perm_list.append("Cancel")
            if perm.print: perm_list.append("Print")
            if perm.if_owner: perm_list.append("If Owner")
            
            perm_str = ", ".join(perm_list)
            print(f"  {perm.parent:<35} {perm_str:<45}")
        
        if len(perms) > 50:
            print(f"\n  ... and {len(perms) - 50} more doctypes")
        
        print(f"\n  Total: {len(perms)} document types")
    else:
        print("  ⚠️  No document permissions configured")
    
    print("\n" + "="*80 + "\n")
    
    return {
        "role": role_name,
        "users": [u.parent for u in users_with_role],
        "permissions_count": len(perms)
    }


def compare_users(user1_email, user2_email):
    """
    Compare permissions between two users
    
    Args:
        user1_email (str): First user email
        user2_email (str): Second user email
    """
    print("\n" + "="*80)
    print(f"⚖️  USER COMPARISON")
    print("="*80)
    print(f"User 1: {user1_email}")
    print(f"User 2: {user2_email}")
    print("="*80)
    
    # Get roles for both users
    roles1 = set(frappe.get_roles(user1_email))
    roles2 = set(frappe.get_roles(user2_email))
    
    print("\n📊 ROLE COMPARISON")
    print("-" * 80)
    
    common_roles = roles1.intersection(roles2)
    only_user1 = roles1 - roles2
    only_user2 = roles2 - roles1
    
    print(f"\n  Common Roles ({len(common_roles)}):")
    for role in sorted(common_roles):
        print(f"    ✓ {role}")
    
    print(f"\n  Only in {user1_email} ({len(only_user1)}):")
    for role in sorted(only_user1):
        print(f"    → {role}")
    
    print(f"\n  Only in {user2_email} ({len(only_user2)}):")
    for role in sorted(only_user2):
        print(f"    → {role}")
    
    # Get user permissions
    print("\n🔒 USER PERMISSIONS COMPARISON")
    print("-" * 80)
    
    perms1 = frappe.get_all(
        "User Permission",
        filters={"user": user1_email},
        fields=["allow", "for_value"]
    )
    
    perms2 = frappe.get_all(
        "User Permission",
        filters={"user": user2_email},
        fields=["allow", "for_value"]
    )
    
    print(f"\n  User 1 restrictions: {len(perms1)}")
    for perm in perms1[:10]:
        print(f"    {perm.allow}: {perm.for_value}")
    
    print(f"\n  User 2 restrictions: {len(perms2)}")
    for perm in perms2[:10]:
        print(f"    {perm.allow}: {perm.for_value}")
    
    print("\n" + "="*80 + "\n")


def export_permissions_matrix(output_file="permissions_matrix.csv"):
    """
    Export a complete permissions matrix to CSV
    All roles vs all doctypes with permission levels
    
    Args:
        output_file (str): Output CSV file path
    """
    import csv
    
    print("Generating permissions matrix...")
    
    # Get all roles
    all_roles = frappe.get_all("Role", filters={"disabled": 0}, pluck="name", order_by="name")
    
    # Get all doctypes
    all_doctypes = frappe.get_all("DocType", filters={"istable": 0}, pluck="name", order_by="name")
    
    # Build matrix
    matrix = {}
    
    for role in all_roles:
        perms = frappe.get_all(
            "DocPerm",
            filters={"role": role},
            fields=["parent", "read", "write", "create", "delete", "submit", "cancel"]
        )
        
        for perm in perms:
            key = (perm.parent, role)
            perm_str = ""
            if perm.read: perm_str += "R"
            if perm.write: perm_str += "W"
            if perm.create: perm_str += "C"
            if perm.delete: perm_str += "D"
            if perm.submit: perm_str += "S"
            if perm.cancel: perm_str += "X"
            
            matrix[key] = perm_str
    
    # Write to CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow(["DocType"] + all_roles)
        
        # Data rows
        for doctype in all_doctypes:
            row = [doctype]
            for role in all_roles:
                row.append(matrix.get((doctype, role), ""))
            writer.writerow(row)
    
    print(f"✅ Permissions matrix exported to: {output_file}")
    print(f"   Rows: {len(all_doctypes)} doctypes")
    print(f"   Columns: {len(all_roles)} roles")
    print("\n   Legend: R=Read, W=Write, C=Create, D=Delete, S=Submit, X=Cancel\n")


# Quick access functions
def quick_audit(email=None):
    """Quick audit - if no email provided, audits current user"""
    if not email:
        email = frappe.session.user
    return audit_user(email)


if __name__ == "__main__":
    print(__doc__)
