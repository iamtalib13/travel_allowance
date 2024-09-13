# Copyright (c) 2024, Apeksha Raut and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from frappe import _

class TAApproval(Document):
	pass


# @frappe.whitelist()
# def get_employee_ta_records(user_id):
#     try:
#         # Example SQL query
#         sql_query = """
#             SELECT ta.*, tac.*
#             FROM `tabTravel Allowance` ta
#             JOIN `tabTA Chart` tac ON ta.name = tac.parent
#             WHERE ta.reporting_person_user_id = %s
#             AND tac.status = 'Pending for Approval'
#         """

#         # Execute the query
#         result = frappe.db.sql(sql_query, user_id, as_dict=True)

#         # Concatenate first_name and last_name to form employee_name
#         for record in result:
#             record["employee_name"] = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()

#         return result
#     except Exception as e:
#         frappe.log_error(f"Error in populate_employee_ta_status: {str(e)}")
#         frappe.throw("An error occurred while fetching data.")

@frappe.whitelist()
def get_pending_taRecords(user_id):
    try:
       # SQL query to get travel allowance records
       ta_pending_query = """
           SELECT *
           FROM `tabTravel Allowances` 
           WHERE reporting_person_user_id = %s
           AND status = 'Pending'
           ORDER BY modified desc
       """

       # Execute the queries
       ta_pending_result = frappe.db.sql(ta_pending_query, user_id, as_dict=True)
       
       return ta_pending_result
    
    except Exception as e:
       frappe.log_error(f"Error in get_employee_ta_records: {str(e)}")
       frappe.throw("An error occurred while fetching data.")

    

@frappe.whitelist()
def get_employee_ta_records(user_id):
    try:
        # SQL query to get travel allowance records
        ta_pending_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE reporting_person_user_id = %s
            AND status = 'Pending'
            ORDER BY modified desc
        """

        # Execute the queries
        ta_pending_result = frappe.db.sql(ta_pending_query, user_id, as_dict=True)
        
        # SQL query to get travel allowance records with status 'Approved'
        ta_approved_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE reporting_person_user_id = %s
            AND status = 'Approved'
            ORDER BY modified desc
        """
        ta_approved_result = frappe.db.sql(ta_approved_query, user_id, as_dict=True)

        # SQL query to get employee names
        employee_query = """
            SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name
            FROM `tabEmployee`
            WHERE reporting_employee_user_id = %s 
            AND status = 'Active'
        """

        # Execute the query
        employee_result = frappe.db.sql(employee_query, user_id, as_dict=True)

       # Replace null values in TA records with default values
        for record in ta_pending_result:
            record["employee_name"] = f"{record.get('first_name', '')} {record.get('last_name', '')}".strip()

        #     # Replace null or None values with default values
        #     record["total"] = record.get("total") if record.get("total") is not None else 0
        #     record["local_conveyance_other_expenses_amount"] = record.get("local_conveyance_other_expenses_amount") if record.get("local_conveyance_other_expenses_amount") is not None else 0
        #     record["daily_allowance"] = record.get("daily_allowance") if record.get("daily_allowance") is not None else 0
        #     record["halting_amount"] = record.get("halting_amount") if record.get("halting_amount") is not None else 0
        #     record["lodging_amount"] = record.get("lodging_amount") if record.get("lodging_amount") is not None else 0
        #     record["kilometer_of_travelling"] = record.get("kilometer_of_travelling") if record.get("kilometer_of_travelling") is not None else 0
        #     record["fare_amount"] = record.get("fare_amount") if record.get("fare_amount") is not None else 0

        # Replace null values in employee names with empty strings
        for employee in employee_result:
            employee["full_name"] = employee.get("full_name") if employee.get("full_name") is not None else ""

        return {
            "approved_records": ta_approved_result,
            "travel_allowance_records": ta_pending_result,
            "employee_names": employee_result
        }
    except Exception as e:
        frappe.log_error(f"Error in get_employee_ta_records: {str(e)}")
        frappe.throw("An error occurred while fetching data.")


