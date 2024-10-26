# Copyright (c) 2024, Apeksha Raut and contributors
# For license information, please see license.txt

import json
import re
import frappe
from frappe import _
from frappe.model.document import Document
from werkzeug.wrappers import Response
from datetime import date, datetime

class TravelAllowances(Document):
    def before_save(self):
        # Extract the employee ID from the user field
        self.employee_id = self.user.split('@')[0]
        
        self.first_name= frappe.db.get_value('Employee', self.employee_id, 'first_name')
        self.last_name= frappe.db.get_value('Employee', self.employee_id, 'last_name')
        
        self.emp_branch= frappe.db.get_value('Employee', self.employee_id, 'branch')
        self.region= frappe.db.get_value('Employee', self.employee_id, 'region')
        self.division= frappe.db.get_value('Employee', self.employee_id, 'division')
        
        # Retrieve the designation from the Employee doctype
        self.designation = frappe.db.get_value('Employee', self.employee_id, 'designation')
        
        self.reporting_person_user_id= frappe.db.get_value('Employee', self.employee_id, 'reporting_employee_user_id')
        
        self.higher_reporting_person_user_id= frappe.db.get_value('Employee', self.employee_id, 'higher_reporting_employee_id')

        # Retrieve the branch for the reporting person
        if self.reporting_person_user_id:
            reporting_person_id = self.reporting_person_user_id.split('@')[0]  # Extracting employee ID
            reporting_person_branch = frappe.db.get_value('Employee', reporting_person_id, 'branch')

        # Retrieve the branch for the higher reporting person
        if self.higher_reporting_person_user_id:
            higher_reporting_person_id = self.higher_reporting_person_user_id.split('@')[0]  # Extracting employee ID
            higher_reporting_person_branch = frappe.db.get_value('Employee', higher_reporting_person_id, 'branch')
        
        # Logic to set level_3_user_id based on branch conditions
        # if reporting_person_branch == higher_reporting_person_branch == 'Gondia HO':
        #     self.level_3_user_id = '38@sahayog.com'
        # elif reporting_person_branch != 'Gondia HO' and higher_reporting_person_branch == 'Gondia HO':
        #     self.level_3_user_id = '38@sahayog.com'
        # elif reporting_person_branch == higher_reporting_person_branch != 'Gondia HO':
        #     # Fetch the Branch Officer user ID of the respective employee's branch
        #     branch_officer_user_id = frappe.db.get_value('Employee', {'branch': reporting_person_branch, 'designation':'Branch Officer'}, 'user_id')  # Adjust the field name accordingly
        #     self.level_3_user_id = branch_officer_user_id if branch_officer_user_id else None
            
        # Retrieve the ta_category from the Designation doctype based on the designation
        if self.designation:
                self.ta_category = frappe.db.get_value('Designation', self.designation, 'ta_category')
        

        # Extract month and year from self.from_date
        if self.from_date:
            from_date = datetime.strptime(self.from_date, '%Y-%m-%d')
            self.month = from_date.strftime('%B')  # Full month name, e.g., 'January'
            self.year = from_date.year



@frappe.whitelist()
def get_current_month():
    current_month = datetime.now().strftime("%B")
    return Response(current_month)




@frappe.whitelist()
def get_employee_name(email):
    # user = frappe.session.user  # Get the current logged-in user

    # Fetch employee details linked to the user
    employee = frappe.get_all('Employee', filters={'user_id': email}, fields=['first_name', 'last_name'])

    if employee:
        full_name = f"{employee[0].first_name} {employee[0].last_name}"
        return Response(full_name)

    return Response("Guest User")

# get designation of user
@frappe.whitelist()
def get_employee_designation():
    user_id = frappe.session.user
    try:
        # Fetch employee details linked to the user
        employee = frappe.get_all('Employee', filters={'user_id': user_id}, fields=['designation'])

        if employee and 'designation' in employee[0]:
            designation = employee[0]['designation']
            # Return a proper JSON response
            return {"designation": designation}

        return {"designation": "Not available"}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_employee_designation")
        return {"error": _("Error retrieving designation")}



@frappe.whitelist(allow_guest=True)
def create_record():
    try:
        # Retrieve all form data from the request
        data = frappe.form_dict

        # Extract and validate individual fields
        from_date = data.get("from_date")
        from_location = data.get("from_location")
        from_location_other = data.get("from_location_other")
        from_time = data.get("from_time")
        to_date = data.get("to_date")
        to_location = data.get("to_location")
        to_location_other = data.get("to_location_other")
        to_time = data.get("to_time")
        total_time = data.get("total_time")
        purpose = data.get("purpose")
        travel_mode = data.get("travel_mode")
        total_km = data.get("total_km")
        ticket_amount = data.get("ticket_amount")
        fare_amount = data.get("fare_amount")
        allowance_type = data.get("allowance_type")
        final_da_amount = data.get("final_da_amount")
        lodging_amount = data.get("lodging_amount")
        day_stay_lodge = data.get("day_stay_lodge")
        day_stay_halt = data.get("day_stay_halt")
        final_lodge_amount = data.get("final_lodge_amount")
        final_halt_amount = data.get("final_halt_amount")
        final_local_amount = data.get("final_local_amount")
        total_amount = data.get("total_amount")
        user = frappe.session.user
        status='Draft'

        # Create a new Travel Allowances document
        ta_record = frappe.new_doc("Travel Allowances")

        # Handle file upload for the ticket if present
        if "upload_ticket" in frappe.request.files:
            ticket_file = frappe.request.files["upload_ticket"]
            ticket_filename = ticket_file.filename
            ticket_file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": ticket_filename,
                "content": ticket_file.read(),
                "folder": "Home",
                "is_private": 1
            })
            ticket_file_doc.insert()
            ta_record.upload_ticket = ticket_file_doc.file_url

        # Handle file upload for the lodging bill if present
        if "upload_lodging" in frappe.request.files:
            lodging_file = frappe.request.files["upload_lodging"]
            lodging_filename = lodging_file.filename
            lodging_file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": lodging_filename,
                "content": lodging_file.read(),
                "folder": "Home",
                "is_private": 1
            })
            lodging_file_doc.insert()
            ta_record.upload_lodging = lodging_file_doc.file_url

        # Assign values to the document fields
        ta_record.from_date = from_date
        ta_record.from_time = from_time
        ta_record.from_location = from_location
        ta_record.from_location_other = from_location_other
        ta_record.to_date = to_date
        ta_record.to_time = to_time
        ta_record.to_location = to_location
        ta_record.to_location_other = to_location_other
        ta_record.total_time = total_time
        ta_record.purpose = purpose
        ta_record.travel_mode = travel_mode
        ta_record.total_km = total_km
        ta_record.ticket_amount = ticket_amount
        ta_record.fare_amount = fare_amount
        ta_record.allowance_type = allowance_type
        ta_record.final_da_amount = final_da_amount
        ta_record.lodging_amount = lodging_amount
        ta_record.day_stay_lodge = day_stay_lodge
        ta_record.day_stay_halt = day_stay_halt
        ta_record.final_lodge_amount = final_lodge_amount
        ta_record.final_halt_amount = final_halt_amount
        ta_record.final_local_amount = final_local_amount
        ta_record.total_amount = total_amount
        ta_record.user = user
        ta_record.status = status

        # Process local conveyance data
        local_conveyance_data = frappe.parse_json(data.get('local_conveyance', '[]'))
        if local_conveyance_data:
            for lc in local_conveyance_data:
                ta_record.append("local_conveyance", {
                    "local_date": lc.get("local_date"),
                    "from_local": lc.get("from_local"),
                    "to_local": lc.get("to_local"),
                    "purpose": lc.get("purpose"),
                    "local_travel_mode": lc.get("local_travel_mode"),
                    "local_amt": lc.get("local_amt")
                })


        # Insert the document into the database
        ta_record.insert()

        return {
            "message": f"Travel Allowance created successfully with ID: {ta_record.name}",
            "status": "success",
            "doc_name": ta_record.name
        }

    except ValueError as ve:
        frappe.log_error(f"Validation Error: {ve}")
        return {
            "message": str(ve),
            "status": "error"
        }
    except Exception as e:
        frappe.log_error(f"Error creating Travel Allowance: {e}")
        return {
            "message": "Failed to create Travel Allowance. Please check your inputs and try again.",
            "status": "error"
        }

@frappe.whitelist(allow_guest=True)
def get_child_records(parent_id):
    try:
        # Fetch child records for the given parent ID
        local_conveyance_records = frappe.get_all(
            "Local Conveyance",
            filters={"parent": parent_id},
            fields=["local_date","from_local","to_local","local_travel_mode","purpose","local_amt"]
        )
        return local_conveyance_records

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in get_child_records API")
        return {"error": str(e)}, 500

#fetch reject reason field to show user
@frappe.whitelist(allow_guest=True)
def get_rejection_reason(record):
    try:
        # Fetch the record
        if frappe.db.exists("Travel Allowances", record):
            # Get the rejection reason
            reason = frappe.db.get_value("Travel Allowances", record, "rejection_remark_stage_1")
            return {"status": "success", "reason": reason}
        else:
            return {"status": "error", "message": "Record does not exist"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "get_rejection_reason_error")
        return {"status": "error", "message": str(e)}

from datetime import datetime
# fetch list of ta-records
@frappe.whitelist()
def get_list(month=None):
    try:
        user = frappe.session.user
        
        # Construct the filters dictionary
        filters = {"owner": user}  # Default filter
        
        # Add month filter if provided
        if month:
            filters["month"] = month

        ta_records = frappe.db.get_all(
            "Travel Allowances",
            filters=filters,  # Apply the filters
            fields=[
                "*"
            ],
            order_by="modified desc"
        )

        # Update records with "from_location_other" and "to_location_other" if "from_location" or "to_location" is "Other"
        # Update records with "from_location_other" and "to_location_other" if "from_location" or "to_location" is "Other"
        for record in ta_records:
            # Format date fields to 'dd-mm-yyyy'
             
             # Format date fields to 'dd-mm-yyyy' (directly using strftime since it's a date object)
            if record.get("from_date"):
                record["from_date"] = record["from_date"].strftime("%d-%m-%Y")
            
            if record.get("to_date"):
                record["to_date"] = record["to_date"].strftime("%d-%m-%Y")

            if record.get("from_location") == "Other" and record.get("from_location_other"):
                record["from_location"] = record["from_location_other"]
            
            if record.get("to_location") == "Other" and record.get("to_location_other"):
                record["to_location"] = record["to_location_other"]

            # Remove the 'from_location_other' and 'to_location_other' fields from the result if not needed
            record.pop("from_location_other", None)
            record.pop("to_location_other", None)

            # Fetch child table records (local_conveyance) for each parent record
            local_conveyance_records = frappe.get_all(
                "Local Conveyance",  # Replace with your actual child table doctype
                filters={"parent": record["name"]},
                fields=["*"]
            )
            record["local_conveyance"] = local_conveyance_records

        return ta_records

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in get_list API")
        return {"error": str(e)}, 500


# delete ta record function
@frappe.whitelist()
def delete_records(names):
    try:
        # Log the incoming request body for debugging
        frappe.log_error(f"Received names: {names}", "Delete Records Debug")

        # Ensure names are received as a list
        if isinstance(names, str):
            names = json.loads(names)

        if not isinstance(names, list):
            raise ValueError("Invalid data format: names should be a list.")

        deleted_records = []
        errors = []

        for name in names:
            if frappe.db.exists("Travel Allowances", name):
                try:
                    frappe.delete_doc("Travel Allowances", name)
                    deleted_records.append(name)
                except Exception as e:
                    errors.append(f"Failed to delete {name}: {str(e)}")
            else:
                errors.append(f"Record {name} does not exist")

        frappe.db.commit()

        if errors:
            return {
                "status": "partial",
                "message": f"Deleted records: {deleted_records}. Errors: {errors}"
            }
        else:
            return {
                "status": "success",
                "message": f"Successfully deleted records: {deleted_records}"
            }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Delete Travel Allowances Error")
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }

# Edit TA record function
@frappe.whitelist()
def get_record_details(name):
    try:
        # Fetch the record details based on the name
        record = frappe.get_doc("Travel Allowances", name)
        # Convert the document to a dictionary and return all fields
        return record.as_dict()
    except Exception as e:
        frappe.throw(_("Error fetching record details: {0}").format(str(e)))

 

# for make record status 'pending' on submit
@frappe.whitelist(allow_guest=True)
def update_status(names):
    try:
        # Ensure names is a list
        if not isinstance(names, list):
            names = json.loads(names)
        
        # Update records in batches
        batch_size = 100
        total_records = len(names)
        updated_count = 0
        
        for i in range(0, total_records, batch_size):
            batch = names[i:i + batch_size]
            if batch:
                # Set both the 'status' and 'status_stage_1' fields to 'Pending'
                frappe.db.set_value("Travel Allowances", batch, {
                    "status": "Pending",
                    "status_stage_1": "Pending"
                })                
                updated_count += len(batch)

        return {"status": "success", "updated_count": updated_count}
    
    
    except Exception as e:
        frappe.log_error(message=str(e), title="Error in update_status API")
        return {"status": "error", "message": str(e)}
        
@frappe.whitelist()
def ping():
    return "Pong"

#to create local records
@frappe.whitelist(allow_guest=True)
def create_local_records():
    try:
        # Retrieve all form data from the request
        data = frappe.form_dict
        
        # Create a new document in the "Local Conveyance" doctype
        doc = frappe.new_doc("Local Conveyance")
        
        # Set the document fields using data from the form
        doc.local_date = data.get("local_date")
        doc.from_local = data.get("from_local")
        doc.to_local = data.get("to_local")
        doc.purpose = data.get("purpose")
        doc.local_travel_mode = data.get("local_travel_mode")
        doc.local_amt = data.get("local_amt")
        doc.user = frappe.session.user
        
        # Insert the document into the database
        doc.save()
        
        # Commit the transaction to the database
        frappe.db.commit()
        
        return {
            "message": _("Local Conveyance record created successfully."),
            "status": "success",
            "docname": doc.name
        }
    except Exception as e:
        # Log error and throw a user-friendly message
        frappe.log_error(message=e, title="Local Conveyance Creation Error")
        frappe.throw(_("There was an issue creating the Local Conveyance record. Please try again."))

@frappe.whitelist()
def fetch_travel_and_local_data():
    try:
        # Get the current user
        user = frappe.session.user
        
        # Fetch all Travel Allowances records for the current user
        travel_allowances = frappe.get_all("Travel Allowances", 
                                           filters={"owner": user},
                                           fields=["name", "from_date", "to_date"])
        
        # Fetch all Local Conveyance records for the current user
        local_conveyance = frappe.get_all("Local Conveyance", 
                                          filters={"owner": user},
                                          fields=["local_date", "local_amt"])
        
        return {
            "travel_allowances": travel_allowances,
            "local_conveyance": local_conveyance
        }
    except Exception as e:
        frappe.log_error(message=e, title="Fetch Data Error")
        return {
            "error": _("There was an issue fetching the data. Please try again.")
        }

# Calculate total time
@frappe.whitelist(allow_guest=True)
def calculate_total_duration():
    try:
        # Retrieve data from the request
        data = frappe.local.form_dict
        
        # Extract fields
        from_date = data.get("from_date")
        from_time = data.get("from_time")
        to_date = data.get("to_date")
        to_time = data.get("to_time")
        
        # Check if all required fields are provided
        if not (from_date and from_time and to_date and to_time):
            return {
                "status": "error",
                "message": _("All date and time fields must be provided.")
            }
        
        start_date_time = frappe.utils.get_datetime(f"{from_date} {from_time}")
        end_date_time = frappe.utils.get_datetime(f"{to_date} {to_time}")

        # Check if start date-time is greater than end date-time
        if start_date_time > end_date_time:
            return {
                "status": "error",
                "message": _("Start date-time should not be greater than end date-time.")
            }
        
        # Check if start and end times are the same
        if start_date_time == end_date_time:
            return {
                "status": "error",
                "message": _("Start time and end time should not be the same.")
            }

        # Calculate duration
        duration_ms = (end_date_time - start_date_time).total_seconds() * 1000
        duration_days = duration_ms // (1000 * 60 * 60 * 24)
        duration_hours = (duration_ms % (1000 * 60 * 60 * 24)) // (1000 * 60 * 60)
        
        # Calculate total hours
        total_hours = duration_days * 24 + duration_hours
        
        # Check if total duration is less than 3 hours
        if total_hours < 3:
            return {
                "status": "error",
                "message": _("You are not eligible for DA because your total travel duration is less than 3 hours.")
            }
        
        # Return success with calculated duration and total hours
        return {
            "status": "success",
            "total_hours": total_hours,
            "total_duration": f"{int(duration_days)} days {int(duration_hours)} hours"
        }
    
    except Exception as e:
        frappe.log_error(f"Error calculating total duration: {str(e)}")
        return {
            "status": "error",
            "message": _("An error occurred while calculating the total duration.")
        }

@frappe.whitelist()
def findAllowance(city_class, ta_category):
    allowances = ["DA", "Lodging", "Halting"]
    results = {}

    for allowance_type in allowances:
        result = frappe.db.sql(
            f"""SELECT {city_class}_class_city FROM `tabAllowance Parameters`
            WHERE level = '{ta_category}'
            AND parent = '{allowance_type}';""",
            as_dict=True
        )

        if result:
            results[allowance_type] = result[0][f"{city_class}_class_city"]
        else:
            results[allowance_type] = "No details found"

    return results


@frappe.whitelist(allow_guest=True)
def get_allowances():
    user = frappe.session.user
    employee_id = user.split('@')[0]

    # Retrieve the designation from the Employee doctype
    designation = frappe.db.get_value('Employee', employee_id, 'designation')

    # Retrieve the ta_category from the Designation doctype based on the designation
    ta_category = frappe.db.get_value('Designation', designation, 'ta_category')
    
    # Retrieve the form data
    data = frappe.form_dict
    to_location = data.get("to_location")

    # Determine the city category
    city_class = frappe.db.get_value('City Category', to_location, 'category')
    
    if city_class and ta_category:
        # Call the findAllowance function and get the result
        allowances = findAllowance(city_class, ta_category)
        return allowances if allowances else {"error": "No details found"}
    else:
        return {"error": "Incomplete information"}

# check ta_category is set or not
@frappe.whitelist(allow_guest=True)
def check_ta_category():
    user = frappe.session.user
    employee_id = user.split('@')[0]

    # Retrieve the designation from the Employee doctype
    designation = frappe.db.get_value('Employee', employee_id, 'designation')

    # Retrieve the ta_category from the Designation doctype based on the designation
    ta_category = frappe.db.get_value('Designation', designation, 'ta_category') 
    
    if not ta_category:
        # Handle case where ta_category is null or empty
        return {
            "error": "TA Category is not set for your designation. Please contact your administrator."
        }

    return {
        "success": "TA Category is set.",
        "ta_category":ta_category
    }


@frappe.whitelist()
def calculate_da_amount(total_time, da_amount):
    try:
        # Convert inputs to appropriate types
        total_hours = float(total_time)
        da_amount = float(da_amount)

        # Convert total time to days and hours
        duration_days = total_hours // 24
        duration_hours = total_hours % 24

        if total_hours < 4:
            return {"error": "You are not eligible for DA because your total travel duration is less than 4 hours."}

        # Calculate DA for days
        da_amount_days = duration_days * da_amount

        # Calculate DA for remaining hours
        if duration_hours > 4 and duration_hours < 8:
            da_amount_hours = da_amount / 2
        elif duration_hours >= 8 and duration_hours < 12:
            da_amount_hours = (da_amount * 3) / 4
        elif duration_hours >= 12 and duration_hours <= 24:
            da_amount_hours = da_amount
        else:
            da_amount_hours = 0

        final_da_amount = da_amount_days + da_amount_hours

        return final_da_amount
    
    except Exception as e:
        return {"error": str(e)}
    


@frappe.whitelist()
def calculate_lodging_amount(input_lodging_amount, stay_days, lodging_limit):
   
    try:
        # Convert input parameters to floats
        input_lodging_amount = float(input_lodging_amount)
        stay_days = float(stay_days)
        lodging_limit = float(lodging_limit)

        # Ensure stay_days is not zero or negative to avoid invalid calculations
        if stay_days <= 0:
            return {
                "status": "error",
                "message": "Stay days must be greater than zero."
            }
        
        # Calculate the total lodging amount
        if input_lodging_amount <= lodging_limit:
            # Use the input amount if it is within the lodging limit
            total_lodging_amount = input_lodging_amount * stay_days
           
        else:
            # Use the lodging limit if the input amount exceeds it
            total_lodging_amount = lodging_limit * stay_days

        # return {
        #     "status": "success",
        #     "message": total_lodging_amount
        # }
        
        return total_lodging_amount
    
    except ValueError as e:
        frappe.throw(_("Invalid input for lodging calculation: {0}".format(str(e))))
    except Exception as e:
        frappe.throw(_("An unexpected error occurred during lodging calculation: {0}".format(str(e))))

@frappe.whitelist()
def calculate_halting_amount(total_time, halting_limit):
    try:
        # Attempt to convert input values to float
        # Convert inputs to appropriate types
        total_hours = float(total_time)
        halting_limit = float(halting_limit)

        # Convert total time to days and hours
        duration_days = total_hours // 24
        duration_hours = total_hours % 24

        if total_hours < 4:
            return {"error": "You are not eligible for DA because your total travel duration is less than 4 hours."}

        # Calculate DA for days
        halt_amount_days = duration_days * halting_limit

        # Calculate DA for remaining hours
        if duration_hours > 4 and duration_hours < 8:
            halt_amount_hours = halting_limit / 2
        elif duration_hours >= 8 and duration_hours < 12:
            halt_amount_hours = (halting_limit * 3) / 4
        elif duration_hours >= 12 and duration_hours <= 24:
            halt_amount_hours = halting_limit
        else:
            halt_amount_hours = 0

        final_halt_amount = halt_amount_days + halt_amount_hours

        return final_halt_amount
    
    except Exception as e:
        return {"error": str(e)}
    

    

@frappe.whitelist()
def calculate_total_amount(fare_amount, da_amount, halt_amount, lodge_amount, local_amount):
    try:
        # Convert the string amounts to floats
        fare_amount = float(fare_amount)
        da_amount = float(da_amount)
        halt_amount = float(halt_amount)
        lodge_amount = float(lodge_amount)
        local_amount = float(local_amount)  # Convert local_amount to float

        # Calculate the total amount
        total_amount = fare_amount + da_amount + halt_amount + lodge_amount + local_amount

        # Return the total amount
        return {"total_amount": total_amount}

    except ValueError as e:
        # Handle the case where conversion to float fails
        frappe.log_error(f"ValueError: {str(e)}", "Calculate Total Amount")
        return {"error": "Invalid input. Please ensure all amounts are numbers."}

    except Exception as e:
        # Handle any other exceptions
        frappe.log_error(f"Exception: {str(e)}", "Calculate Total Amount")
        return {"error": "An unexpected error occurred. Please try again later."}

    
#  Reporting person Approve ta record status level 1
@frappe.whitelist()
def bulk_rp_approve(ids,remark):
    try:
        if isinstance(ids, list) and ids:
            # Fetch the current user from the session
            approved_by = frappe.session.user

            for record_name in ids:
                # Approve the record and set the approved_by field
                frappe.db.set_value('Travel Allowances', record_name, {
                    'status_stage_1': 'Approved',
                    'approved_by_stage_1': approved_by,
                    'approved_remark_stage_1': remark,
                    'status_stage_2':'Pending'
                })

            frappe.db.commit()
            return {"status": "success", "message": "Records approved successfully"}
        else:
            return {"status": "error", "message": "Invalid data format or empty list"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "bulk_rp_approve_error")
        return {"status": "error", "message": str(e)}
    
# for Skip level 2 approved ta records 
@frappe.whitelist()
def bulk_skip_approve(ids,remark):
    try:
        if isinstance(ids, list) and ids:
            # Fetch the current user from the session
            approved_by = frappe.session.user

            for record_name in ids:
                # Approve the record and set the approved_by field
                frappe.db.set_value('Travel Allowances', record_name, {
                    'status_stage_2': 'Approved',
                    'approved_by_stage_2': approved_by,
                    'approved_remark_stage_2': remark,
                    'status_stage_3':'Pending'
                })

            frappe.db.commit()
            return {"status": "success", "message": "Records approved successfully"}
        else:
            return {"status": "error", "message": "Invalid data format or empty list"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "bulk_skip_approve_error")
        return {"status": "error", "message": str(e)}
    
# Reposting person Reject ta record
@frappe.whitelist()
def bulk_rp_reject(ids, remark):
    try:
        if isinstance(ids, list) and ids:
            rejected_by = frappe.session.user

            for record_name in ids:
                if frappe.db.exists("Travel Allowances", record_name):
                    # Reject the record, set the rejected_by field, and add the remark
                    frappe.db.set_value('Travel Allowances', record_name, {
                        'status': 'Reject',
                        'status_stage_1': 'Reject',
                        'rejected_by_stage_1': rejected_by,
                        'rejection_remark_stage_1': remark  # Save the remark
                    })
                else:
                    frappe.log_error(f"Record {record_name} does not exist", "bulk_reject_error")

            frappe.db.commit()
            return {"status": "success", "message": "Records rejected successfully"}
        else:
            return {"status": "error", "message": "Invalid data format"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "bulk_rp_reject_error")
        return {"status": "error", "message": str(e)}

#for Skip level 2 reject ta records
@frappe.whitelist()
def bulk_skip_reject(ids,remark):
    try:
        if isinstance(ids, list) and ids:
            rejected_by = frappe.session.user

            for record_name in ids:
                if frappe.db.exists("Travel Allowances", record_name):
                    # Reject the record, set the rejected_by field, and add the remark
                    frappe.db.set_value('Travel Allowances', record_name, {
                        'status': 'Reject',
                        'status_stage_2': 'Reject',
                        'rejected_by_stage_2': rejected_by,
                        'reject_reason_by_stage_2': remark  # Save the remark
                    })
                else:
                    frappe.log_error(f"Record {record_name} does not exist", "bulk_skip_reject_error")

            frappe.db.commit()
            return {"status": "success", "message": "Records rejected successfully"}
        else:
            return {"status": "error", "message": "Invalid data format"}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "bulk_skip_reject_error")
        return {"status": "error", "message": str(e)}
    


#fetch pending count of ta records by reporting person
@frappe.whitelist(allow_guest=True)
def get_pending_count():
    user = frappe.session.user
    try:
        # Use Frappe's get_all method to count records with additional user filter
        count = frappe.get_all(
            "Travel Allowances",
            filters={
                "status": "Pending",
                "status_stage_1": "Pending",
                "reporting_person_user_id": user  # Add user to filter
            },
            fields=["name"]  # You can still specify a field
        )
        
        # Return the count in an array
        return [len(count)]  # Wrap the count in a list

    except Exception as e:
        # Log the error for debugging
        frappe.log_error(message=str(e), title="Error in get_pending_count")
        frappe.response.set_content_type("text/plain")
        return ["Error"]  # Return error as an array

# For Reporting person fetch pending records for approval 
@frappe.whitelist()
def get_ta_records(user_id):
    try:
        # Query for pending travel allowance records
        ta_pending_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE reporting_person_user_id = %s
            AND status = 'Pending' AND status_stage_1 = 'Pending'
            ORDER BY modified desc
        """
        ta_pending_result = frappe.db.sql(ta_pending_query, user_id, as_dict=True)
        
        # Query for approved travel allowance records
        ta_approved_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Approved' 
            AND approved_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_approved_result = frappe.db.sql(ta_approved_query, (user_id, user_id), as_dict=True)

        # Query for rejected travel allowance records
        ta_rejected_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Reject'
            AND rejected_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_rejected_result = frappe.db.sql(ta_rejected_query, (user_id, user_id), as_dict=True)

        # Return all records as a dictionary with separate keys
        return {
            "pending": ta_pending_result,
            "approved": ta_approved_result,
            "rejected": ta_rejected_result
        }

    except Exception as e:
        frappe.log_error(f"Error in get_ta_records: {str(e)}")
        frappe.throw("An error occurred while fetching data.")
        
# For Higher Reporting person fetch pending, approved, rejected records for approval of skip
@frappe.whitelist()
def get_rp_records(user_id):
   
    try:
        # Get employee names
        employee_names = get_employee_names_for_rp(user_id)

        # Query for pending travel allowance records
        ta_pending_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE reporting_person_user_id = %s
            AND status = 'Pending' AND status_stage_1 = 'Pending'
            ORDER BY modified DESC
        """
        ta_pending_result = frappe.db.sql(ta_pending_query, user_id, as_dict=True)

        # Prepare dictionaries to hold counts for each employee
        employee_counts = {
            "pending": {},
            "approved": {},
            "rejected": {}
        }

        # Calculate counts for each employee
        for employee in employee_names:
            employee_id = employee['employee_id']  # Assuming 'employee_id' is in the result
            
            # Count pending records
            pending_count_query = """
                SELECT COUNT(*) AS pending_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status = 'Pending'
                AND status_stage_1 = 'Pending'
            """
            pending_count_result = frappe.db.sql(pending_count_query, employee_id, as_dict=True)
            employee_counts["pending"][employee_id] = pending_count_result[0]['pending_count'] if pending_count_result else 0
            
            # Count approved records
            approved_count_query = """
                SELECT COUNT(*) AS approved_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status_stage_1 = 'Approved'
            """
            approved_count_result = frappe.db.sql(approved_count_query, employee_id, as_dict=True)
            employee_counts["approved"][employee_id] = approved_count_result[0]['approved_count'] if approved_count_result else 0
            
            # Count rejected records
            rejected_count_query = """
                SELECT COUNT(*) AS rejected_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status_stage_1 = 'Reject'
            """
            rejected_count_result = frappe.db.sql(rejected_count_query, employee_id, as_dict=True)
            employee_counts["rejected"][employee_id] = rejected_count_result[0]['rejected_count'] if rejected_count_result else 0

        # Query for approved travel allowance records
        ta_approved_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Approved' 
            AND approved_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_approved_result = frappe.db.sql(ta_approved_query, (user_id, user_id), as_dict=True)

        # Query for rejected travel allowance records
        ta_rejected_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Reject'
            AND rejected_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_rejected_result = frappe.db.sql(ta_rejected_query, (user_id, user_id), as_dict=True)

        # Return all records as a dictionary with separate keys, employee names, and counts
        return {
            "pending": ta_pending_result,
            "approved": ta_approved_result,
            "rejected": ta_rejected_result,
            "employee_names": employee_names,  # Add employee names to the response
            "employee_counts": employee_counts  # Add counts for each employee
        }

    except Exception as e:
        frappe.log_error(f"Error in get_rp_records: {str(e)}")
        frappe.throw("An error occurred while fetching data.")
        
        

        
#For higher Reporting person get reportee(emp) names
@frappe.whitelist()
def get_employee_names_for_rp(user_id):
    
    try:
        # SQL query to get employee names
        employee_query = """
            SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name
            FROM `tabEmployee`
            WHERE reporting_employee_user_id = %s 
            AND status = 'Active'
            ORDER BY full_name ASC
        """

        # Execute the query
        employee_result = frappe.db.sql(employee_query, user_id, as_dict=True)
        
        return employee_result
        
    except Exception as e:
        frappe.log_error(f"Error in get_employee_names: {str(e)}")
        frappe.throw("An error occurred while fetching data.")

# For Higher Reporting person fetch pending, approved, rejected records for approval of skip
@frappe.whitelist()
def get_skip_records(user_id):
    # Split the user_id string at '@' and take the first part
    user_id_number = user_id.split('@')[0]
    
    try:
        # Get employee names
        employee_names = get_employee_names_for_skip(user_id)

        # Query for pending travel allowance records
        ta_pending_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE higher_reporting_person_user_id = %s
            AND status = 'Pending' AND status_stage_2 = 'Pending'
            ORDER BY modified DESC
        """
        ta_pending_result = frappe.db.sql(ta_pending_query, user_id_number, as_dict=True)

        # Prepare dictionaries to hold counts for each employee
        employee_counts = {
            "pending": {},
            "approved": {},
            "rejected": {}
        }

        # Calculate counts for each employee
        for employee in employee_names:
            employee_id = employee['employee_id']  # Assuming 'employee_id' is in the result
            
            # Count pending records
            pending_count_query = """
                SELECT COUNT(*) AS pending_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status = 'Pending'
                AND status_stage_2 = 'Pending'
            """
            pending_count_result = frappe.db.sql(pending_count_query, employee_id, as_dict=True)
            employee_counts["pending"][employee_id] = pending_count_result[0]['pending_count'] if pending_count_result else 0
            
            # Count approved records
            approved_count_query = """
                SELECT COUNT(*) AS approved_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status_stage_2 = 'Approved'
            """
            approved_count_result = frappe.db.sql(approved_count_query, employee_id, as_dict=True)
            employee_counts["approved"][employee_id] = approved_count_result[0]['approved_count'] if approved_count_result else 0
            
            # Count rejected records
            rejected_count_query = """
                SELECT COUNT(*) AS rejected_count
                FROM `tabTravel Allowances`
                WHERE employee_id = %s
                AND status_stage_2 = 'Reject'
            """
            rejected_count_result = frappe.db.sql(rejected_count_query, employee_id, as_dict=True)
            employee_counts["rejected"][employee_id] = rejected_count_result[0]['rejected_count'] if rejected_count_result else 0

        # Query for approved travel allowance records
        ta_approved_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE higher_reporting_person_user_id = %s
            AND status_stage_2 = 'Approved' 
            AND approved_by_stage_2 = %s
            ORDER BY modified DESC
        """
        ta_approved_result = frappe.db.sql(ta_approved_query, (user_id_number, user_id), as_dict=True)

        # Query for rejected travel allowance records
        ta_rejected_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE higher_reporting_person_user_id = %s
            AND status_stage_2 = 'Reject'
            AND rejected_by_stage_2 = %s
            ORDER BY modified DESC
        """
        ta_rejected_result = frappe.db.sql(ta_rejected_query, (user_id_number, user_id), as_dict=True)

        # Return all records as a dictionary with separate keys, employee names, and counts
        return {
            "pending": ta_pending_result,
            "approved": ta_approved_result,
            "rejected": ta_rejected_result,
            "employee_names": employee_names,  # Add employee names to the response
            "employee_counts": employee_counts  # Add counts for each employee
        }

    except Exception as e:
        frappe.log_error(f"Error in get_skip_records: {str(e)}")
        frappe.throw("An error occurred while fetching data.")


@frappe.whitelist()
def get_employee_names(user_id):
    try:
        # SQL query to get employee names
        employee_query = """
            SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name
            FROM `tabEmployee`
            WHERE reporting_employee_user_id = %s 
            AND status = 'Active'
        """

        # Execute the query
        employee_result = frappe.db.sql(employee_query, user_id, as_dict=True)
        
        
        return employee_result
        
    except Exception as e:
        frappe.log_error(f"Error in get_employee_names: {str(e)}")
        frappe.throw("An error occurred while fetching data.")

#For higher Reporting person get reportee(emp) names
@frappe.whitelist()
def get_employee_names_for_skip(user_id):
    user_id_number = user_id.split('@')[0]
    
    try:
        # SQL query to get employee names
        employee_query = """
            SELECT employee_id, CONCAT(first_name, ' ', last_name) AS full_name
            FROM `tabEmployee`
            WHERE higher_reporting_employee_id = %s 
            AND status = 'Active'
            ORDER BY full_name ASC
        """

        # Execute the query
        employee_result = frappe.db.sql(employee_query, user_id_number, as_dict=True)
        
        return employee_result
        
    except Exception as e:
        frappe.log_error(f"Error in get_employee_names: {str(e)}")
        frappe.throw("An error occurred while fetching data.")
        
        
# Get records for Finance department for approval
@frappe.whitelist(allow_guest=True)
def get_taTeam_records():
    # Hardcoded user_id
    user_id = "38@sahayog.com"

    try:
        # Query for pending travel allowance records for the hardcoded user_id
        ta_pending_query = """
            SELECT *
            FROM `tabTravel Allowances` 
            WHERE reporting_person_user_id = %s
            AND status = 'Pending' AND status_stage_1 = 'Pending'
            ORDER BY modified DESC
        """
        ta_pending_result = frappe.db.sql(ta_pending_query, user_id, as_dict=True)

        # Query for approved travel allowance records
        ta_approved_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Approved' 
            AND approved_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_approved_result = frappe.db.sql(ta_approved_query, (user_id, user_id), as_dict=True)

        # Query for rejected travel allowance records
        ta_rejected_query = """
            SELECT *
            FROM `tabTravel Allowances`
            WHERE reporting_person_user_id = %s
            AND status_stage_1 = 'Reject'
            AND rejected_by_stage_1 = %s
            ORDER BY modified DESC
        """
        ta_rejected_result = frappe.db.sql(ta_rejected_query, (user_id, user_id), as_dict=True)

        # Return the records as a dictionary
        return {
            "pending": ta_pending_result,
            "approved": ta_approved_result,
            "rejected": ta_rejected_result
        }

    except Exception as e:
        frappe.log_error(f"Error in get_taTeam_records: {str(e)}")
        frappe.throw("An error occurred while fetching data.")

    


# Get the user type
@frappe.whitelist(allow_guest=True)
def get_user_roles():
    
    # Get the current user ID from the session
    user_id = frappe.session.user
    
    # Extract the part before the '@' symbol for comparison (for non-email based lookups)
    user_id_number = user_id.split('@')[0]
    
    # The finance user email for specific checks
    finance_user_id = '38@sahayog.com'
    
    # Check if the user is a Reporting Person (RP Approval)
    is_reporting_person = frappe.db.sql("""
        SELECT employee_id
        FROM `tabEmployee`
        WHERE reporting_employee_user_id = %s
        AND status = 'Active'
    """, user_id)

    # Check if the user is a Higher Reporting Person (Skip Approval)
    is_higher_reporting_person = frappe.db.sql("""
        SELECT employee_id
        FROM `tabEmployee`
        WHERE higher_reporting_employee_id = %s
        AND status = 'Active'
    """, user_id_number)
    
    # Check if the user is a Finance User (based on a specific finance user email or other criteria)
    is_finance_user = frappe.db.sql("""
        SELECT employee_id
        FROM `tabEmployee`
        WHERE user_id = %s
        AND status = 'Active'
    """, user_id)
    
    # Initialize an empty list for user types
    user_type = []
    
    # Determine the user roles
    if len(is_reporting_person) > 0:
        user_type.append('Reporting Person')
    if len(is_higher_reporting_person) > 0:
        user_type.append('Higher Reporting Person')
    if len(is_finance_user) > 0 and user_id == finance_user_id:
        user_type.append('Finance User')
        
    # If no roles match, classify the user as 'Employee'
    if not user_type:
        user_type.append('employee')

    # Return the result as a dictionary
    return {
        'is_reporting_person': len(is_reporting_person) > 0,  # True if user is a Reporting Person
        'is_higher_reporting_person': len(is_higher_reporting_person) > 0,  # True if user is a Higher Reporting Person
        'is_finance_user': len(is_finance_user) > 0 and user_id == finance_user_id,  # True if user is Finance User
        'user_type': user_type  # List of roles the user has
    }


@frappe.whitelist(allow_guest=True)
def get_user_info():
    user = frappe.session.user
    
    # Fetch detailed user information from Employee doctype
    employee_info = frappe.db.get_value('Employee', 
                                        {'user_id': user}, 
                                        ['department', 'division', 'zone', 'region', 'branch', 'district', 
                                         'employee_name', 'reporting_employee', 'reporting_employee_user_id', 
                                         'reporting_employee_email', 'reporting_person_designation', 
                                         'designation', 'first_name', 'last_name', 'user_id'], 
                                        as_dict=True)

    if employee_info:
        # Optionally, fetch additional details from User doctype if needed
        user_info = frappe.db.get_value('User', 
                                        {'name': user}, 
                                        ['email'], 
                                        as_dict=True)
        
        # Combine both results (if needed)
        if user_info:
            employee_info.update({'email': user_info.get('email')})

        return employee_info
    else:
        frappe.throw("Employee information not found for the current user.")


