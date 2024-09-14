# Copyright (c) 2023, Apeksha and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CityCategory(Document):
	pass


#fetch the list of city categories from the 'City Category' doctype
@frappe.whitelist(allow_guest=True)
def get_city_categories():
    try:
        # Fetch and sort data by 'city' field in ascending order
        city_categories = frappe.get_all('City Category', fields=['city', 'category'], order_by='city asc')
        
        # Return success status and the sorted data
        return {'status': 'success', 'message': city_categories}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'City Category API Error')
        return {'status': 'error', 'message': str(e)}