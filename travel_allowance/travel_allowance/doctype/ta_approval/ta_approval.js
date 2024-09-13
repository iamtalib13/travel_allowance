// Copyright (c) 2024, Apeksha Raut and contributors
// For license information, please see license.txt

frappe.ui.form.on("TA Approval", {
  refresh: function (frm) {
    $("span.sidebar-toggle-btn").hide();
    $(".col-lg-2.layout-side-section").hide();
    frm.disable_save();
    // Add custom button 'Go To Home'
    frm
      .add_custom_button(__("Go To Back"), function () {
        // Define the action for the button
        // Redirect to home page or any other action
        window.location.href = "/ta"; // Adjust the URL as needed
      })
      .css({
        "background-color": "#2490ef",
        color: "white",
      });

    frm.trigger("populate_employee_ta_status");
  },
  async populate_employee_ta_status(frm) {
    // Get the current logged-in user's ID
    let userId = frappe.session.user;

    console.log("loggin user:", userId);

    frm.call({
      method:
        "travel_allowance.travel_allowance.doctype.ta_approval.ta_approval.get_employee_ta_records",
      args: {
        user_id: userId,
      },
      callback: function (response) {
        // Handle the response as per your application logic
        if (response && response.message) {
          // Process the data returned from the server
          console.log(response.message);

          let data = response.message;
          // Extract travel allowance records and employee names
          //let taApprovedRecords = data.approved_records;
          let taRecords = data.travel_allowance_records;
          let employeeNames = data.employee_names;

          console.log("Travel Allowance Records:", taRecords);
          console.log("Employee Names:", employeeNames);

          // Generate employee record counts
          let employeeRecordCounts = {};
          taRecords.forEach((record) => {
            if (!employeeRecordCounts[record.employee_name]) {
              employeeRecordCounts[record.employee_name] = 0;
            }
            employeeRecordCounts[record.employee_name]++;
          });
          console.log("Employee Record Counts:", employeeRecordCounts);

          // console.log("data:", data);
          // Count of pending records
          let count = taRecords.length;

          //let approvedCount = taApprovedRecords.length;
          // Function to format date as DD-MM-YYYY
          function formatDate(date) {
            let dateObj = new Date(date);

            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
              return date; // Return the original string if it's not a valid date
            }

            // Format date as DD-MM-YYYY
            let day = String(dateObj.getDate()).padStart(2, "0");
            let month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are zero-based
            let year = dateObj.getFullYear();
            return `${day}-${month}-${year}`;
          }

          // Function to format both 'from_date' and 'to_date'
          function formatDates(fromDate, toDate) {
            return {
              formattedFromDate: formatDate(fromDate),
              formattedToDate: formatDate(toDate),
            };
          }
          // Generate detailed HTML content
          let html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
              <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
              <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

              <title> Travel Allowance Records</title>

              <style>

                /* Navbar styles */
                .ta_navbar {
                  display: flex;
                  margin-bottom: 15px;
                  font-size: 16px;
                  position: sticky;
                  top: 0;
                  background-color: #fff; /* Ensure background color covers content behind */
                  z-index: 1000; /* Ensure it stays above other content */
                  justify-content: space-between;
                  align-items: center;
                  flex-wrap: wrap;
                }

                .ta_navbar div{
                  padding: 10px 20px;
                  cursor: pointer;
                }


                .ta_navbar .active {
                  font-weight: bold;
                  border-bottom: 2px solid red;
                }

                .ta-nav-item{
                  list-style:none;
                  margin: 10px 0;
                }
                .ta-nav-link{
                  border: 1px solid transparent;
                  border-top-left-radius: 0.25rem;
                  border-top-right-radius: 0.25rem;
                  padding: 0.5rem 1rem;
                  margin-right: 0.2rem;
                  color: #495057;
                  background-color: #f8f9fa;
                  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
                }
                .ta-nav-link:hover,
                .ta-nav-link:focus{
                  text-decoration:none;
                  font-weight: bold;
                  border-bottom: 2px solid red;
                  outline:none;
                }

                /* Pending count styles */
                .pending-count {
                  color: red;
                  font-weight: bold;
                  margin-left: 5px;
                }

                /* Count span styles */
                .count {
                  font-weight: bold;
                  margin-left: 5px;
                }

                .main-container{
                  border: 1px solid #ddd;
                  border-radius: 10px;
                  
                }
                /* Make the table responsive */
                .table-responsive {
                    overflow-x: auto;
                }

                /* Table styles */
                table#travelAllowancesTable {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 14px;
                    text-align: left;
                }

                table#travelAllowancesTable th, 
                table#travelAllowancesTable td {
                    padding: 12px 15px;
                    border: 1px solid #ddd;
                    white-space: nowrap; /* Prevent line wrapping */
                    text-align: center;
                }

                /* Header styling */
                table#travelAllowancesTable thead th {
                    background-color: #f2f2f2;
                    color: #333;
                    font-weight: bold;
                    text-align: center;
                }

                /* Zebra striping */
                table#travelAllowancesTable tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }

                table#travelAllowancesTable tbody tr:nth-child(odd) {
                    background-color: #fff;
                }

                /* Hover effects */
                table#travelAllowancesTable tbody tr:hover {
                    background-color: #f1f1f1;
                }

                /* Center align specific columns */
                table#travelAllowancesTable td:nth-child(4),
                table#travelAllowancesTable td:nth-child(5),
                table#travelAllowancesTable td:nth-child(6),
                table#travelAllowancesTable td:nth-child(7),
                table#travelAllowancesTable td:nth-child(8),
                table#travelAllowancesTable td:nth-child(9),
                table#travelAllowancesTable td:nth-child(10),
                table#travelAllowancesTable td:nth-child(13),
                table#travelAllowancesTable td:nth-child(14),
                table#travelAllowancesTable td:nth-child(15),
                table#travelAllowancesTable td:nth-child(16),
                table#travelAllowancesTable td:nth-child(17),
                table#travelAllowancesTable td:nth-child(18),
                table#travelAllowancesTable td:nth-child(19) {
                    text-align: center;
                }

                /* Checkbox column */
                table#travelAllowancesTable td:first-child {
                    text-align: center;
                    width: 50px;
                }

                /* Highlighting total column */
                table#travelAllowancesTable td:last-child {
                    font-weight: bold;
                    color: #000;
                    background-color: #e7f3ff;
                }

                /* Table header alignment */
                table#travelAllowancesTable th {
                    text-align: center;
                }

                /* Styling for no records row */
                table#travelAllowancesTable .text-center {
                    text-align: center;
                    font-weight: bold;
                    color: #999;
                }


                .approve-btn {
                  display: none;
                  position: absolute;
                  top: 35px;
                  right: 10px;
                  z-index: 100;
                }
                .no-records {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  text-align: center;
                  margin: auto;
                  font-size: 18px;
                  color: #495057;
                  margin-bottom: 40px;
                }

                .no-records-message {
                  height: 100%;
                  text-align: center;
                  margin: auto;
                  font-size: 18px;
                  justify-content: center;
                  align-items: center;
                  margin-bottom: 40px;
                  display: none; /* Message is hidden by default */
                  font-weight: bold;
                  color: #495057;
                }
                .action_menu {
                  display: flex;
                  text-align: right;
                  justify-content: end;
                }
                .btn_bulk_approve{
                  margin-right:10px;
                  font-size: 15px;
                }
                  .btn_bulk_reject{
                  margin-right:10px;
                  font-size: 15px;
                }

                .btn_select_all{
                  
                  font-size: 15px;
                }
               
                button.swal2-confirm.swal2-styled:focus,
                button.swal2-cancel.swal2-styled:focus {
                  outline: none;
                }

                /* Container for the table */
.table-container {
    overflow-x: auto;
    position: relative;
}

/* Table styling */
table {
    width: 100%;
    border-collapse: collapse;
}

/* Fixed Serial Number Column */
.fixed-serial {
    position: -webkit-sticky;
    position: sticky;
    left: 0;
    background: #fff; /* Adjust based on your design */
    z-index: 2;
}

/* Fixed Total Column */
.fixed-total {
    position: -webkit-sticky;
    position: sticky;
    right: 0;
    background: #fff; /* Adjust based on your design */
    z-index: 2;
}

                .hidden{
                 display:none;
                }
                /* Popup styles */
  .dynamic-popup {
    display: none; /* Hidden by default */
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.5); /* Black background with opacity */
}

.dynamic-popup-content {
    background-color: #fff;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 800px;
    font-size: 14px;
    font-family: inherit;
}

.dynamic-popup-close-btn {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.dynamic-popup-close-btn:hover,
.dynamic-popup-close-btn:focus {
    color: black;
    text-decoration: none;
}

.dynamic-table {
    width: 100%;
    border-collapse: collapse;
}

.dynamic-table th, .dynamic-table td {
    border: 1px solid #ddd;
    padding: 8px;
}

.dynamic-table th {
    background-color: #f2f2f2;
}

.clickable {
    cursor: pointer; /* Change cursor to pointer */
    position: relative; /* Positioning for the indicator */
    padding: 10px; /* Add some padding */
}


/*.clickable::after {
    content: '→';/* Use an info emoji or icon as an indicator */
    position: absolute;
   
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px; /* Adjust the size of the indicator */
    color: #007bff; /* Color of the indicator, adjust as needed */
}

.clickable:hover {
    background-color: #f0f0f0;
}*/

             
              </style>
            </head>
            <body>
              <div class="container">
                <div class="row">
                  <div class="ta_navbar">
                    <div class="active">
                      Pending <span class="pending-count">${count}</span>
                    </div>
                    <!--<div>Approved</div>-->
                  </div>
                </div>
              </div>
              
              <div class="container main-container">
                <div class="row">
                  <ul class="ta_navbar" id="employeeTabs" role="tablist">
                    <li class="ta-nav-item">
                      <button class="ta-nav-link active" id="all-tab" data-employee-name="all" onclick="handleTabClick('all', this)">
                        All <span class="count">${count}</span>
                      </button>
                    </li>
                    ${employeeNames
                      .map(
                        (emp) => `
                        <li class="ta-nav-item">
                          <button class="ta-nav-link" id="${
                            emp.full_name
                          }-tab" data-employee-name="${
                          emp.full_name
                        }" onclick="handleTabClick('${emp.full_name}', this)">
                            ${emp.full_name} <span class="count">${
                          employeeRecordCounts[emp.full_name] || 0
                        }</span>
                          </button>
                        </li>`
                      )
                      .join("")}
                  </ul>
                </div>
           
                <div class="container action_menu" id="action-menu">
                  <button class="btn btn-success btn_bulk_approve" onclick="bulkApprove()"> Approve </button>
                   <button class="btn btn-danger btn_bulk_reject" onclick="bulkReject()"> Reject </button>
                  <!--<button class="btn btn-primary btn_select_all" id="selectAllButton" onclick="toggleSelectAll()">Select All</button>-->
                </div>
                <div class="table-responsive">
                  <table class="table table-bordered" id="travelAllowancesTable">
                    <thead>
                      <tr>
                       <th class="fixed-serial">Sr. No.</th> <!-- Serial Number Column -->
                        <th class="hidden">name</th>
                        <th>Employee Name</th>
                        <th>Status</th>
                        <th>From Location</th>
                        <th>Start Date</th>
                        <th>Start Time</th>
                        <th>To Location</th>
                        <th>End Date</th>
                        <th>End Time</th>
                        <th>Total Time</th>
                        <th>Purpose</th>
                        <th>Mode of Transport</th>
                        <th>Total KM</th>
                        <th>Ticket Amount</th>
                        <th>Uploaded Ticket </th>
                        <th>Fare Amount</th>
                        <th>Allowance Type</th>
                        <th>DA</th>
                        <th>Halting</th>
                        <th>Lodging</th>
                        <th>Uploaded Lodging bill </th>
                        <th>Local Conveyance</th>
                         <th class="fixed-total">Total</th> <!-- Fixed Total Column -->
                      
                      </tr>
                    </thead>
                    <tbody>
                      ${taRecords
                        .map(
                          (record, index) => `
                        <tr>
                         <td class="fixed-serial">${
                           index + 1
                         }</td> <!-- Serial Number Column -->
                          <td class="hidden">
                            ${record.name}
                          </td>
                          <td>${record.employee_name}</td>
                          <td>
                            ${record.status}
                            <!--<span>
                              <img class="action" onclick="get_approve_btn('${
                                record.name
                              }')" src="/files/dots.png" alt="user" width="20">
                            </span>-->
                          </td>
                          <td>${record.from_location}</td>
                          <td>${formatDate(record.from_date)}</td>
                          <td>${record.from_time}</td>
                          <td>${record.to_location}</td>
                          <td>${formatDate(record.to_date)}</td>
                          <td>${record.to_time}</td>
                          <td>${record.total_time}</td>
                          <td>${record.purpose}</td>
                          <td>${record.travel_mode}</td>
                          <td>${record.total_km}</td>
                          <td>${record.ticket_amount}</td>
                          <td>
                            ${
                              record.upload_ticket
                                ? `<a href="${record.upload_ticket}" target="_blank">View Ticket</a>`
                                : "-"
                            }
                          </td>
                          <td>${record.fare_amount}</td>
                          <td>${record.allowance_type}</td>
                          <td>${record.final_da_amount}</td>
                          <td>${record.final_halt_amount}</td>
                          <td>${record.final_lodge_amount}</td>
                          <td>
                            ${
                              record.upload_lodging
                                ? `<a href="${record.upload_lodging}" target="_blank">View Lodging Bill</a>`
                                : "-"
                            }
                          </td>
                          <td class="${
                            record.final_local_amount &&
                            record.final_local_amount.trim() !== "-" &&
                            parseFloat(record.final_local_amount) !== 0
                              ? "clickable"
                              : ""
                          }" 
                            data-record-id="${record.name}"
                            ${
                              record.final_local_amount &&
                              record.final_local_amount.trim() !== "-" &&
                              parseFloat(record.final_local_amount) !== 0
                                ? `title="Click for Local details"`
                                : ""
                            }>
                            ${record.final_local_amount || "-"}
                          </td>

                          <td class="fixed-total">₹${record.total_amount}</td>
                          
                         <!--<td>
                            <button class="btn btn-success approve-btn" id="approve-${
                              record.name
                            }" onclick="approveRecord('${
                            record.name
                          }')">Approve</button>
                          </td>-->
                        </tr>
                        `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>

                  
                <!-- No records message -->
                <div class="no-records-message">No Request found for the selected employee.</div>
              </div>

              <!-- Popup HTML to show local conveyance child table -->
<div id="local-conveyance-popup" class="dynamic-popup">
  <div class="dynamic-popup-content">
      <span class="dynamic-popup-close-btn">&times;</span>
      <h4>Local Conveyance Details</h4>
      <div id="local-conveyance-container"></div>
  </div>
</div>


             
              <!-- jQuery CDN -->
              <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha384-ZvpUoO/+PqeF8UOrRtvNLU7mKxOj7cMwp7o+6g0Pj5tyJf6cFOksdRMtrzmQe1Rj" crossorigin="anonymous"></script>
               <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
                <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
                 <!-- Bootstrap JavaScript -->
                 <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
                           
              <script>

document.addEventListener('click', async function(event) {
    if (event.target.classList.contains('clickable')) {
        const recordId = event.target.getAttribute('data-record-id');
        console.log('Clicked record ID:', recordId); // Debugging line
        
        try {
            // Fetch child records from the server
            const response = await fetch('/api/method/travel_allowance.travel_allowance.doctype.travel_allowances.travel_allowances.get_child_records?parent_id=' + encodeURIComponent(recordId));
            
            // Check if the response is OK
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Parse the JSON data from the response
            const result = await response.json();
            console.log('API response:', result);

            // Extract data from the response
            const records = result.message || result; // Adjust according to your server response structure
            console.log('Fetched child records:', records);

            if(records.length === 0)
            {
              document.getElementById('local-conveyance-popup').style.display = 'none';
              return;
            }
            // Initialize total amount
            let totalAmount = 0;

            // Create HTML content for the table
            let tableContent = 
                '<table class="table table-bordered">' +
                    '<thead>' +
                        '<tr>' +
                            '<th>Date</th>' +
                            '<th>From</th>' +
                            '<th>To</th>' +
                            '<th>Travel Mode</th>' +
                            '<th>Purpose</th>' +
                            '<th>Amount</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>';

            // Ensure records is an array before using forEach
            if (Array.isArray(records) && records.length > 0) {
                records.forEach(record => {
                    const amount = parseFloat(record.local_amt) || 0;
                    totalAmount += amount;

                    tableContent += 
                        '<tr>' +
                            '<td>' + (record.local_date || '-') + '</td>' +
                            '<td>' + (record.from_local || '-') + '</td>' +
                            '<td>' + (record.to_local || '-') + '</td>' +
                            '<td>' + (record.local_travel_mode || '-') + '</td>' +
                            '<td>' + (record.purpose || '-') + '</td>' +
                            '<td>' + (amount.toFixed(2) || '-') + '</td>' +
                        '</tr>';
                });

                // Add total amount as the last row
                tableContent += 
                    '<tr>' +
                        '<td colspan="5"><strong>Total Amount:</strong></td>' +
                        '<td><strong>' + totalAmount.toFixed(2) + '</strong></td>' +
                    '</tr>';
            } else {
                console.error('Invalid records format:', records);
                tableContent += '<tr><td colspan="6">No data available</td></tr>';
            }

            tableContent += 
                '</tbody>' +
            '</table>';

            // Set the content of the popup
            document.querySelector('#local-conveyance-container').innerHTML = tableContent;

            // Show the popup
            document.getElementById('local-conveyance-popup').style.display = 'block';

            // Close the popup when the user clicks on the close button
            document.querySelector('.dynamic-popup-close-btn').onclick = function() {
                document.getElementById('local-conveyance-popup').style.display = 'none';
            };

            // Close the popup when the user clicks outside of the popup
            window.onclick = function(event) {
                if (event.target === document.getElementById('local-conveyance-popup')) {
                    document.getElementById('local-conveyance-popup').style.display = 'none';
                }
            };

        } catch (error) {
            console.error('Error fetching child records:', error);
            // Display an error message in the popup
            document.querySelector('#local-conveyance-container').innerHTML = 
                '<p>An error occurred while fetching the records.</p>';
            document.getElementById('local-conveyance-popup').style.display = 'block';
        }
    }
});

     
              // handle select all button
              /*function toggleSelectAll() {
                // Get the "Select All" button element
                
                const selectAllButton = document.getElementById('selectAllButton');
                // Get all the checkboxes
                const checkboxes = document.querySelectorAll('.approve-checkbox');
                // Check if all checkboxes are currently selected
                const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
                
                // Toggle the checked state of all checkboxes
                checkboxes.forEach(checkbox => {
                  checkbox.checked = !allChecked;
                });
                
                // Update the bulk approve button visibility
                handleCheckboxChange();

                 // Count the number of selected checkboxes
                const selectedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
              
                console.log("Count of selected Records:",selectedCount );
                // Update the "Select All" button text
                if (allChecked) {
                  selectAllButton.textContent = 'Select All';
                } else {
                  selectAllButton.textContent = 'Unselect All';
                }
              }*/
              
              
              // Add event listeners to checkboxes
              /*document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleCheckboxChange);
              }); */

              // Handle checkboxes function for displaying action menu
             /* function handleCheckboxChange() {

                const actionMenu=document.getElementById("action-menu");
                // Check if any checkbox is checked
                const isAnyChecked = Array.from(document.querySelectorAll('.approve-checkbox'))
                  .some(checkbox => checkbox.checked);

                  actionMenu.style.display = isAnyChecked ? 'block' : 'none';
                
                // Log the record name of the checked checkbox
                if (this.checked) {
                  console.log('Checked record name:', this.dataset.recordName);
                }
              }*/
              
              // Handle tab click to filter by employee name
              function handleTabClick(employee, element) {
                  console.log("Selected Employee: ", employee);

                  // Remove 'active' class from all buttons
                  const buttons = document.querySelectorAll(".ta-nav-link");
                  buttons.forEach((button) => {
                      button.classList.remove("active");
                  });

                  // Add 'active' class to the clicked button
                  element.classList.add("active");

                  // Filter the table rows based on the active tab
                  filterTableByEmployee(employee);
              }

              // Handle filtering of table rows based on employee name
               function filterTableByEmployee(employee) {
                const rows = document.querySelectorAll("#travelAllowancesTable tbody tr");
                const table = document.getElementById("travelAllowancesTable");
                const actionMenu = document.getElementById("action-menu");
                let hasVisibleRows = false; // Track if there are any visible rows

                rows.forEach((row) => {
                  const empNameCell = row.querySelector("td:nth-child(2)");
                  const empNameText = empNameCell ? empNameCell.textContent.trim() : '';
                  if (employee === "all" || empNameText === employee) {
                    row.style.display = "";
                    hasVisibleRows = true; // At least one row is visible
                  } else {
                    row.style.display = "none";
                  }
                });

                // Show or hide the no records message and table
                const noRecordsMessage = document.querySelector(".no-records-message");
                if (hasVisibleRows) {
                  noRecordsMessage.style.display = "none";
                  table.style.display = ""; // Show table when there are visible rows
                  //actionMenu.style.display = "block"; // Show action menu when there are visible rows
                } else {
                  noRecordsMessage.style.display = "block";
                  table.style.display = "none"; // Hide table when no rows are visible
                  actionMenu.style.display = "none"; // Hide action menu when no rows are visible
                }
              }
                     
              document.addEventListener("DOMContentLoaded", function () {
                // Initially display all cards
                filterCardsByEmployee("all");
              });

              
             
              // Function to approve all records
              async function bulkApprove() {
    // Gather all record names from the first <td> element in each row
    const recordNames = Array.from(document.querySelectorAll('#travelAllowancesTable tbody tr'))
        .map(row => row.querySelector('td').textContent.trim()) // Extract text content from the first <td> in each row
        .filter(name => name); // Filter out any empty names

    console.log('Record names:', recordNames);

    if (recordNames.length === 0) {
        Swal.fire({
            title: 'No Records Found',
            text: 'No records are available to approve.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Confirm the bulk approval action using SweetAlert2
    const result = await Swal.fire({
        title: 'Are you sure you want to approve all records?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, approve them!',
        cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
        try {
            // Send a request to the server to approve all records
           const response = await fetch('/api/method/travel_allowance.travel_allowance.doctype.travel_allowances.travel_allowances.bulk_approve_records', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ names: recordNames })
});

            // Check for response status
            if (!response.ok) {
                throw new Error('HTTP error! Status: ${response.status}');
            }

            // Log and process the response
            const result = await response.json();
            console.log(result);

            if (result.message === 'Records approved successfully.') {
                Swal.fire({
                    title: 'Approved!',
                    text: 'All records have been processed for approval.',
                    icon: 'success',
                    confirmButtonText: 'OK' // Show the confirm button with 'OK' text
                }).then(() => {
                    Swal.fire({
                        title: 'Please wait',
                        text: 'Refreshing the page...',
                        allowOutsideClick: false, // Prevent users from closing the alert
                        allowEscapeKey: false, // Prevent closing by pressing the escape key
                        didOpen: () => {
                            Swal.showLoading(); // Show loading spinner
                        }
                    });
                    // Set a delay before reloading the page
                    setTimeout(() => {
                        location.reload();
                    }, 2000); // 2 seconds delay
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || 'Failed to approve records. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'Try Again'
                });
            }
        } catch (error) {
            console.error('Error approving records:', error);
            Swal.fire({
                title: 'Error',
                text: 'An unexpected error occurred while approving records. Please try again.',
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    }
}

              
              
              // Function to approve bulk records
              async function bulkReject() {
                  // Get all checked records
                  // Initialize the array to store checked records
                  const checkedRecords = [];
              
                  // Get all checked records and push them to the array
                  document.querySelectorAll(".approve-checkbox:checked").forEach((checkbox) => {
                      checkedRecords.push(checkbox.dataset.recordName);
                  });
              
                  console.log("Bulk Reject records:", checkedRecords);
                  if (checkedRecords.length > 0) {
                      // Confirm the bulk approval action using SweetAlert2
                      const result = await Swal.fire({
                          title: 'Are you sure you want to reject these record(s)?',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonText: 'Yes, Reject them!',
                          cancelButtonText: 'No, cancel',
                      });
              
                      if (result.isConfirmed) {
                          try {
                              // Send a request to the server to approve the records
                              const response = await fetch('/api/method/travel_allowance.travel_allowance.doctype.travel_allowances.travel_allowances.bulk_reject_records', {
                                  method: 'POST',
                                  headers: {
                                      'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ names: checkedRecords }) // Send the array of selected record names wrapped in an object
                              });
              
                              // Check for response status
                              if (!response.ok) {
                                  throw new Error('HTTP error! Status: ${
                                    response.status
                                  }');
                              }
              
                              // Log and process the response
                              const result = await response.json();
                              console.log(result);
              
                              if (result.message.message === 'Records Rejected successfully.') {
                                Swal.fire({
                                    title: 'Rejected!',
                                    text: 'All selected records have been Rejected.',
                                    icon: 'success',
                                    confirmButtonText: 'OK' // Show the confirm button with 'OK' text
                                }).then(() => {
                                    Swal.fire({
                                        title: 'Please wait',
                                        text: 'Refreshing the page...',
                                        allowOutsideClick: false, // Prevent users from closing the alert
                                        allowEscapeKey: false, // Prevent closing by pressing the escape key
                                        didOpen: () => {
                                            Swal.showLoading(); // Show loading spinner
                                        }
                                    });
                                    // Set a delay before reloading the page
                                    setTimeout(() => {
                                        location.reload();
                                    }, 2000); // 2 seconds delay
                                });
                              } else {
                                  Swal.fire({
                                      title: 'Error',
                                      text: result.message || 'Failed to Reject records. Please try again.',
                                      icon: 'error',
                                      confirmButtonText: 'Try Again'
                                  });
                              }
                          } catch (error) {
                              console.error('Error rejecting records:', error);
                              Swal.fire({
                                  title: 'Error',
                                  text: 'An unexpected error occurred while rejecting records. Please try again.',
                                  icon: 'error',
                                  confirmButtonText: 'Try Again'
                              });
                          }
                      }
                  } else {
                      // Inform the user that no records are selected
                      Swal.fire({
                          title: 'No Records Selected',
                          text: 'Please select at least one record to reject.',
                          icon: 'warning',
                          confirmButtonText: 'OK'
                      });
                  }
              }

              document.addEventListener("DOMContentLoaded", function () {
                // Initial setup: hide or show the bulk approve button
                handleCheckboxChange.call(document.querySelector(".approve-checkbox"));
              });


              
            
              </script>

            </body>
          </html>
          `;

          // Set the above `html` as Summary HTML
          frm.set_df_property("ta_approval_status", "options", html);
        } else {
          console.error("Failed to fetch data");
        }
      },
    });
  },
});
