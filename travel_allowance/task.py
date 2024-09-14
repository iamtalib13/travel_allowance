import frappe

@frappe.whitelist()
def update_first_name():
    # Fetch all records from the "Travel Allowances" doctype where employee_id is 3130
    ta_records = frappe.get_all('Travel Allowances', filters={'employee_id': '3130'}, fields=['name', 'employee_id'])
    
    for record in ta_records:
        # Update the first_name field to "Apeksha"
        frappe.db.set_value('Travel Allowances', record.name, {
            'first_name': 'Apeksha'
        }, update_modified=False)
        
        frappe.db.set_value('Travel Allowances', record.name, {
            'last_name': 'Raut'
        }, update_modified=False)
        
        print(f"Updated first_name to Apeksha for employee_id {record.employee_id}")

    # Commit the changes to the database
    frappe.db.commit()
    print("All relevant records have been updated successfully.")
