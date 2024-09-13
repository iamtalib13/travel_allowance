# Copyright (c) 2023, Apeksha and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime

from frappe import _

class TravelAllowance(Document):
	pass

             
              
def before_save(self):
    # Helper function to handle None values by replacing them with 0
    def handle_none(value):
        return value if value is not None else 0

    # Calculate total_amount with or without other_expenses_amount
    self.total_amount = (
        handle_none(self.daily_allowance)
        + handle_none(self.fare_amount) if self.fare_amount else 0
        + handle_none(self.other_expenses) if self.other_expenses else 0
        + handle_none(self.halting_amount) if self.halting_amount else 0
        + handle_none(self.lodging_amount) if self.lodging_amount else 0
    )



@frappe.whitelist()
def findAllowance(city_class, category, halt_lodge):
    result = frappe.db.sql(
        f"""SELECT {city_class}_class_city FROM `tabAllowance Parameters`
        WHERE level = '{category}'
        AND parent = '{halt_lodge}';""",
        as_dict=True
    )

    if result:
        return result
    else:
         frappe.msgprint("Cannot Find Details from Server !!")


@frappe.whitelist(allow_guest=True)
def get_server_datetime():
    return frappe.utils.now_datetime()


@frappe.whitelist()
def get_ta_total_amount(self):
    result = frappe.db.sql(
        f"""SELECT
                MIN(CAST(date_and_time_start AS DATE)) as StartDate,
                MONTH(MIN(CAST(date_and_time_start AS DATE))) as Month,
                DATE_FORMAT(MIN(CAST(date_and_time_start AS DATE)), '%b') as MonthName,
                DATE_FORMAT(MAKEDATE(EXTRACT(YEAR FROM MIN(CAST(date_and_time_start AS DATE))), 1), '%d') as FirstDayOfMonth,
                DATE_FORMAT(LAST_DAY(MIN(CAST(date_and_time_start AS DATE))), '%d') AS LastDayOfMonth,
                sum(daily_allowance) as total_daily_allowance,
                sum(halting_amount) as total_halting_amount,
                sum(lodging_amount) as total_lodging_amount,
                sum(local_conveyance_other_expenses_amount) as total_local_conveyance_other_expenses,
                sum(fare_amount) as total_fare_amount,
                sum(total) as total_amount
            FROM `tabTA Chart`
            WHERE parent = '{self}';""",
        as_dict=True
    )

    if result:
        return result[0]
    else:
        frappe.msgprint("Error fetching total amounts")
        return {}



# #Original code 
# @frappe.whitelist()
# def get_child_table_data(parent_docname):
#     # to fetch data from the child table
#     data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total'], order_by='idx DESC')

#     # Format the date in the data before passing it to the template
#     for row in data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")


#     return render_child_table_template(data)



# @frappe.whitelist()
# def get_child_table_data(parent_docname):
#     # Fetch data from the child table including the 'other_location' field
#     data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total', 'other_location'], order_by='idx DESC')

#     # Format the date in the data before passing it to the template
#     for row in data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")
#         if 'to_location' in row and row['to_location'] == 'Other':
#             # Fetch value of 'Other' field if 'to_location' is 'Other'
#             other_location = row.get('other_location')  # Access 'other_location' directly from the row
#             if other_location:
#                 row['to_location'] = other_location

#     return render_child_table_template(data)



@frappe.whitelist()
def get_child_table_data(parent_docname, month=None, year=None):
    # Build filters based on provided month and year
    filters = {'parent': parent_docname}
    if month:
        filters['month'] = month
    if year:
        filters['year'] = year

    # Fetch data from the TA Chart doctype
    data = frappe.get_all('TA Chart', 
                          filters=filters, 
                          fields=[
                              'name',
                              'local_conveyance',
                              'date_and_time_start',
                              'from_location',
                              'date_and_time_end',
                              'to_location',
                              'purpose',
                              'total_visit_hour',
                              'city_class',
                              'mode_of_transport',
                              'kilometer_of_travelling',
                              'fare_amount',
                              'allowance_type',
                              'daily_allowance',
                              'halting_amount',
                              'lodging_amount',
                              'local_conveyance_other_expenses_amount',
                              'total',
                              'month',
                              'year',
                              'uploaded_ticket_image',
                              'uploaded_lodging_bill_image',
                              'day_stay_lodge',
                              'status'
                          ],
                          order_by='idx')
    
  

    # Convert datetime objects to strings
    for row in data:
        row['date_and_time_start'] = row['date_and_time_start'].strftime("%d-%m-%Y %H:%M:%S")
        row['date_and_time_end'] = row['date_and_time_end'].strftime("%d-%m-%Y %H:%M:%S")
        
    return render_child_table_template(data)


# def render_child_table_template(data):
#     # Load the Jinja template
#     template = frappe.get_template("templates/ta_child_table_template.html")

#     # Render the template with the provided data
#     rendered_html = template.render({"data": data})

#     return rendered_html

def render_child_table_template(data):
    # Convert None, empty strings, and whitespace to '-'
    for row in data:
        for key, value in row.items():
            if value is None or (isinstance(value, str) and not value.strip()):
                row[key] = '-'
            elif key == 'uploaded_ticket_image' or key == 'uploaded_lodging_bill_image':
                # Handle image fields to display '-' when not available
                if not value or value == '-':
                    row[key] = '-'

    # Load the Jinja template
    template = frappe.get_template("templates/ta_child_table_template.html")

    # Render the template with the provided data
    rendered_html = template.render({"data": data})

    return rendered_html



    
    
@frappe.whitelist()
def delete_ta_record(record_name):
    try:
        # Check if the record exists
        if frappe.db.exists("TA Chart", record_name):
            # Delete the record
            frappe.delete_doc("TA Chart", record_name)
            frappe.db.commit()
            return "success"
        else:
            return "error: Record does not exist"
    except Exception as e:
        # Handle any errors that occur during deletion
        frappe.log_error(frappe.get_traceback(), "Delete Error")
        return f"error: {str(e)}"



@frappe.whitelist()
def get_recordName(record_name):
    if not record_name:
        frappe.throw("Record name is required")
    
    # Fetch all fields for the specific record in the TA Chart child table
    record = frappe.db.get_all('TA Chart', filters={'name': record_name}, fields='*')
    
    if not record:
        frappe.throw("Record not found")

    return record
    
    
# update the record in the database
@frappe.whitelist()
def update_record(name, data):
    try:
        # Parse the data from JSON format if necessary
        if isinstance(data, str):
            data = frappe.parse_json(data)
        
        # Fetch the existing document
        doc = frappe.get_doc("Travel Allowance", name)
        
        # Update the document with new values
        for field, value in data.items():
            if hasattr(doc, field):
                setattr(doc, field, value)
        
        # Save the updated document
        doc.save()
        
        return "success"
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Travel Allowance Update Error")
        return str(e)

    

@frappe.whitelist()
def get_local_amount(parent_docname):
    # Fetch data from the child table including the 'other_location' field
    data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total', 'other_location'], order_by='idx DESC')
    
    return data



@frappe.whitelist()
def update_record_status(record_name, status):
    try:
        # Fetch the record based on the record_name
        record = frappe.get_doc('TA Chart', record_name)
        
        # Update the status field
        record.status = status
        
        # Save the record
        record.save(ignore_permissions=True)
        
        # Return success message
        return 'Record status updated successfully.'
    
    except frappe.DoesNotExistError:
        frappe.throw(_('Record {0} not found').format(record_name))
    
    except Exception as e:
        frappe.throw(_('Failed to update record status: {0}').format(str(e)))
        
        

@frappe.whitelist()
def update_approved_record_status(record_name, status, approved_by):
    try:
        # Fetch the record based on the record_name
        record = frappe.get_doc('TA Chart', record_name)
        
        # Update the status field
        record.status = status
        record.approved_by = approved_by
        
        # Save the record
        record.save(ignore_permissions=True)
        
        # Return success message
        return 'Record status updated successfully.'
    
    except frappe.DoesNotExistError:
        frappe.throw(_('Record {0} not found').format(record_name))
    
    except Exception as e:
        frappe.throw(_('Failed to update record status: {0}').format(str(e)))