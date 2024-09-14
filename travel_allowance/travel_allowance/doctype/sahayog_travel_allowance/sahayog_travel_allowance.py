# Copyright (c) 2024, Apeksha Raut and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SahayogTravelAllowance(Document):
	pass


@frappe.whitelist(allow_guest=True)
def get_server_datetime():
    return frappe.utils.now_datetime()