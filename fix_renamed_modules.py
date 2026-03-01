#!/usr/bin/env python3
"""
Fix renamed module names appearing in submenus
Run: bench --site YOUR_SITE execute fix_renamed_modules.py
"""

import frappe

def fix_renamed_modules():
    print("\n" + "="*70)
    print("  FIXING RENAMED MODULE SUBMENUS")
    print("="*70 + "\n")
    
    # Module name mappings (old -> new)
    module_mappings = {
        'ERPNext Settings': 'Aquasmart Settings',
        'Selling': 'Billing',  # Assuming you renamed Selling to Billing
        'Buying': 'Procurement',
        'Stock': 'Inventory'
    }
    
    fixed_count = 0
    
    # 1. Fix DocTypes module assignment
    print("1️⃣  Fixing DocTypes module assignment...\n")
    
    for old_module, new_module in module_mappings.items():
        doctypes = frappe.get_all('DocType', 
            filters={'module': old_module},
            fields=['name', 'module'])
        
        for doctype in doctypes:
            try:
                doc = frappe.get_doc('DocType', doctype.name)
                doc.module = new_module
                doc.save()
                print(f"   ✅ {doctype.name}: {old_module} → {new_module}")
                fixed_count += 1
            except Exception as e:
                print(f"   ⚠️  {doctype.name}: {str(e)}")
    
    # 2. Fix Module Def (rename the module itself)
    print("\n2️⃣  Updating Module Definitions...\n")
    
    for old_module, new_module in module_mappings.items():
        try:
            # Check if old module exists
            if frappe.db.exists('Module Def', old_module):
                module_doc = frappe.get_doc('Module Def', old_module)
                module_doc.module_name = new_module
                module_doc.save()
                print(f"   ✅ Module renamed: {old_module} → {new_module}")
                fixed_count += 1
        except Exception as e:
            print(f"   ⚠️  {old_module}: {str(e)}")
    
    # 3. Fix Workspaces
    print("\n3️⃣  Fixing Workspace configurations...\n")
    
    workspaces = frappe.get_all('Workspace', fields=['name', 'module'])
    
    for workspace in workspaces:
        try:
            ws = frappe.get_doc('Workspace', workspace.name)
            changed = False
            
            # Update workspace module
            if ws.module in module_mappings:
                old = ws.module
                ws.module = module_mappings[old]
                print(f"   ✅ Workspace '{ws.name}': {old} → {ws.module}")
                changed = True
            
            # Update workspace links
            for link in ws.links:
                if hasattr(link, 'module') and link.module in module_mappings:
                    old = link.module
                    link.module = module_mappings[old]
                    changed = True
            
            if changed:
                ws.save()
                fixed_count += 1
                
        except Exception as e:
            print(f"   ⚠️  {workspace.name}: {str(e)}")
    
    # 4. Fix Desktop Icons
    print("\n4️⃣  Fixing Desktop Icons...\n")
    
    icons = frappe.get_all('Desktop Icon', 
        filters={'module_name': ['in', list(module_mappings.keys())]},
        fields=['name', 'module_name'])
    
    for icon in icons:
        try:
            icon_doc = frappe.get_doc('Desktop Icon', icon.name)
            old = icon_doc.module_name
            icon_doc.module_name = module_mappings[old]
            icon_doc.save()
            print(f"   ✅ Desktop Icon: {old} → {icon_doc.module_name}")
            fixed_count += 1
        except Exception as e:
            print(f"   ⚠️  {icon.name}: {str(e)}")
    
    # 5. Commit and clear cache
    print("\n5️⃣  Finalizing changes...\n")
    
    frappe.db.commit()
    print("   ✅ Changes committed to database")
    
    frappe.clear_cache()
    print("   ✅ Cache cleared")
    
    # Print summary
    print("\n" + "="*70)
    print(f"  ✅ COMPLETE! Fixed {fixed_count} items")
    print("="*70)
    print("\n📝 Next steps:")
    print("   1. Refresh your browser (Ctrl+Shift+R)")
    print("   2. Clear browser cache if issue persists")
    print("   3. Restart bench if needed: bench restart")
    print("\n")

if __name__ == '__main__':
    fix_renamed_modules()
