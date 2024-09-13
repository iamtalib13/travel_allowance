// Copyright (c) 2023, Apeksha and contributors
// For license information, please see license.txt

// Declare a global variable
let cityClass;
let globalEmpDesignation;
let globalTaCategory;

let daAllowance;
let halt_lodge_amount; // for halting or lodging amount
let da_amount; // for DA claim amount

frappe.ui.form.on("Travel Allowance", {
  upload_ticket: function (frm) {
    console.log(frm.doc.upload_ticket);
  },
  from_location: function (frm) {
    // Validate the "from_location" field for alphabets and spaces
    var fieldValue = frm.doc.from_location;

    if (fieldValue && !/^[a-zA-Z\s]+$/.test(fieldValue)) {
      frappe.msgprint(
        __("Please enter only alphabet characters and spaces in From Location.")
      );
      frm.set_value("from_location", "");
    }
  },

  to_location: function (frm) {
    var source = frm.doc.from_location
      ? frm.doc.from_location.toLowerCase()
      : null;
    let destination = frm.doc.to_location
      ? frm.doc.to_location.toLowerCase()
      : null;

    if (source && destination && source === destination) {
      frappe.msgprint({
        title: __("Validation Error"),
        message: __("From Location and To Location should be different."),
        indicator: "red",
      });
      frm.set_value("to_location", "");
    }

    // check whether the destination field is Other
    if (destination === "other") {
      console.log(destination);
      frm.toggle_display("other_to_location", true);
      // let otherLocation = frm.doc.other_to_location;
      // frm.set_value("to_location", otherLocation);
      // frm.refresh_field("to_location");
    } else {
      frm.toggle_display("other_to_location", false);
      console.log(destination);
    }

    // on change of destination location
    frm.trigger("select_allowance");
  },

  refresh: function (frm) {
    frm.set_value("total_amount", 0);
    frm.set_value("other_expenses", 0);
    console.log("User Roles:", frappe.user_roles);
    console.log("Is Employee:", frappe.user_roles.includes("Employee"));

    //var isEmp = (frappe.user_roles || []).includes("Employee");
    var isEmp = frappe.user.has_role("Employee");

    frm.trigger("custom_css");

    //remove save button
    if (isEmp) {
      console.log("is employee", isEmp);
      frm.disable_save();
      frm.page.clear_menu();
      frm.page.clear_indicator();
    } else {
      frm.enable_save();
    }

    //check if the form is new, get empID
    if (frm.is_new()) {
      //Setting Employee ID
      let user = frappe.session.user;
      let eid = user.match(/\d+/)[0];
      frm.set_value("employee_id", eid);
      let empid = frm.doc.employee_id;

      frm.trigger("populate_empty_record_html");

      // Getting Employee Designation
      frappe.db
        .get_value("Employee", empid, "designation")
        .then((result) => {
          globalEmpDesignation =
            result.message && result.message.designation
              ? result.message.designation
              : null;
          console.log("Designation:", globalEmpDesignation);

          // Now you can use globalEmpDesignation wherever needed

          // Example: Call a function that depends on the fetched value
          handleDesignation(globalEmpDesignation);
        })
        .catch((err) => {
          console.error("Error fetching designation:", err);
        });

      function handleDesignation(designation) {
        // Perform actions based on the fetched designation value
        console.log("Handling Designation:", designation);

        // Getting Employee Designation Category
        frappe.db
          .get_value("Designation", designation, "ta_category")
          .then((result) => {
            globalTaCategory =
              result.message && result.message.ta_category
                ? result.message.ta_category
                : null;
            console.log("ta_category:", globalTaCategory);
            frm.set_value("category", globalTaCategory); // Setting value of designation category field

            // Now you can use globalEmpDesignation wherever needed

            // Example: Call a function that depends on the fetched value
            //handleDesignation(globalEmpDesignation);
          })
          .catch((err) => {
            console.error("Error fetching designation:", err);
          });
      }

      //Fetching date, month and year
      frm.call({
        method: "get_server_datetime",
        callback: function (r) {
          // Check if the response has a valid message
          if (r.message) {
            // Parse the datetime string into a JavaScript Date object
            var serverDatetime = new Date(r.message);

            // Extract the year
            var year = serverDatetime.getFullYear();
            // Extract the month (returns a zero-based index, so add 1)
            //var month = serverDatetime.getMonth() + 1;

            var monthIndex = serverDatetime.getMonth();

            // Array of month names
            var monthNames = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];

            // Get the month name based on the index
            var monthName = monthNames[monthIndex];
            // Set the value of the "year" field
            frm.set_value("year", year);
            frm.refresh_field("year");
            // Set the value of the "month" field
            frm.set_value("month", monthName);

            frm.refresh_field("month");
          } else {
            console.log("Invalid server datetime response");
          }
        },
      });
    } else if (!frm.is_new()) {
      console.log("Old Form");
      let employee_id = frm.doc.employee_id;
      //adding submit button to submit form
      // frm
      //   .add_custom_button(__("Submit"), function () {
      //     console.log("custom submit button");

      //     // Fetch the reporting person directly from the Employee doctype
      //     frappe.db.get_value(
      //       "Employee",
      //       { name: frm.doc.employee },
      //       "reporting_employee_user_id",
      //       function (r) {
      //         let reporting_person = r.reporting_employee_user_id;
      //         console.log("Reporting Person: ", reporting_person);
      //         frm.set_value("reporting_person_user_id", reporting_person);
      //         frm.refresh_field("reporting_person_user_id");
      //         if (reporting_person) {
      //           // Show confirmation dialog
      //           frappe.confirm(
      //             __(
      //               "Are you sure you want to submit and share this form with "
      //             ) +
      //               reporting_person +
      //               "?",
      //             function () {
      //               // User confirmed, share the form
      //               frappe.call({
      //                 method: "frappe.share.add",
      //                 args: {
      //                   doctype: frm.doc.doctype,
      //                   name: frm.doc.name,
      //                   user: reporting_person,
      //                   read: 1,
      //                   write: 1,
      //                   share: 0,
      //                 },
      //                 callback: function (response) {
      //                   if (response.message) {
      //                     frappe.msgprint(
      //                       __("Form has been shared with: ") + reporting_person
      //                     );
      //                   } else {
      //                     frappe.msgprint(
      //                       __("There was an error sharing the form.")
      //                     );
      //                   }
      //                 },
      //               });
      //             },
      //             function () {
      //               // User declined, do nothing
      //               frappe.msgprint(__("Submission cancelled."));
      //             }
      //           );
      //         } else {
      //           frappe.msgprint(
      //             __("No reporting person found for this employee.")
      //           );
      //         }
      //       }
      //     );
      //   })

      //   .css({
      //     "background-color": "rgb(22 112 165)", // Set green color
      //     color: "#ffffff", // Set font color to white
      //   });

      frm.set_value("total_amount", "");

      frm.trigger("populate_total_amount_html");
      frm.trigger("ta_chart_table_html");
    }

    // Hide the original checkboxes
    // frm.fields_dict["check_yes"].$wrapper.hide();
    // frm.fields_dict["check_no"].$wrapper.hide();

    // Create radio button behavior
    frm.fields_dict["check_yes"].$input.change(function () {
      if (frm.fields_dict["check_yes"].$input.prop("checked")) {
        frm.set_value("check_no", 0); // Uncheck the "No" checkbox
      }
    });

    frm.fields_dict["check_no"].$input.change(function () {
      if (frm.fields_dict["check_no"].$input.prop("checked")) {
        frm.set_value("check_yes", 0); // Uncheck the "Yes" checkbox
      }
    });
    // (TA Add Button) adding CSS to button
    frm.fields_dict.btn_add_ta.$input.css({
      "background-color": "rgb(15 128 131)",
      color: "#fff",
      padding: "10px 25px",
      border: "none",
      "border-radius": "4px",
      cursor: "pointer",
      "font-size": "16px",
      float: "right",
      "margin-bottom": "10px",
    });

    // //Make the entire "ta_chart" child table read-only
    // frm.fields_dict["ta_chart"].df.read_only = 1;

    // Refresh the form to apply the changes
    frm.refresh_fields();

    let empdesignation = frm.doc.designation;
    console.log("emp designation", empdesignation);

    if (
      empdesignation === "Chief Technology Officer" ||
      empdesignation === "General Manager" ||
      empdesignation === "CEO" ||
      empdesignation === "COO" ||
      empdesignation === "CFO"
    ) {
      // Add new options to local_mode_of_travel
      let local_travel_options =
        frm.fields_dict.local_mode_of_travel.df.options || [];

      // Convert the options to an array if they are in a different format
      if (typeof local_travel_options === "string") {
        local_travel_options = local_travel_options.split("\n");
      }

      // Define the new options to add
      let new_local_travel_options = ["Cab", "Car", "Taxi"];

      // Add the new options if they don't already exist
      new_local_travel_options.forEach((option) => {
        if (!local_travel_options.includes(option)) {
          local_travel_options.push(option);
        }
      });

      frm.set_df_property(
        "local_mode_of_travel",
        "options",
        local_travel_options
      );

      // Add "Air in economy class" to ta_mode_of_transport
      let current_options =
        frm.fields_dict.ta_mode_of_transport.df.options || [];

      // Convert the options to an array if they are in a different format
      if (typeof current_options === "string") {
        current_options = current_options.split("\n");
      }

      // Add "Air in economy class" if it doesn't already exist
      if (!current_options.includes("Air in economy class")) {
        current_options.push("Air in economy class");
      }

      frm.set_df_property("ta_mode_of_transport", "options", current_options);
    }
  },

  async populate_empty_record_html(frm) {
    let html = `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    .main-title {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;           
                        border-radius: 8px;                         
                        margin-bottom: 20px;
                    }

                    .title {
                        color: black;
                        font-weight: 700;
                        font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
                      font-size: large;
                    }

                    .btn_create {
                        background-color: rgb(11 104 106);
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 18px;
                        font-weight: bold;
                    }

                    .btn_create:hover {
                        background-color: rgb(11 104 106);
                    }

                    .btn_create:focus {
                        outline: none;
                    }
                </style>
            </head>
            <body>
                <div class="main-title">
                    <span class="title"><p>No records created for the current month. Click the "Create" button to add a new record.</p></span>
                    <span><button id="createBtn" class="btn_create">Create +</button></span>
                </div>
                <script>
                    document.getElementById('createBtn').addEventListener('click', function() {
                        document.getElementById('travel-allowance-travel_allowance_details_section-tab').click();
                    });
                </script>
            </body>
        </html>`;

    // Set the above `html` as Summary HTML
    frm.set_df_property("total_amount_summary", "options", html);
  },

  //  to show the data as html with Fetching the data from the backend
  async populate_total_amount_html(frm) {
    // Fetch the data from the backend

    frm.call({
      method: "get_ta_total_amount",
      args: {
        self: frm.doc.name,
      },
      callback: function (r) {
        if (!r.exc) {
          const data = r.message;
          console.log("Total Amount html:", data);

          // console.log(data.docname);

          if (
            data &&
            (data.total_amount !== null ||
              data.total_daily_allowance !== null ||
              data.total_fare_amount !== null ||
              data.total_halting_amount !== null ||
              data.total_lodging_amount !== null ||
              data.total_local_conveyance_other_expenses !== null)
          ) {
            // Generate HTML
            let html = `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>

              .main-title {
                display: flex;
                justify-content: space-between;
                align-items: center;           
                border-radius: 8px;                         
                margin-bottom: 20px;
              }
        
           .title {
            color: black !important;
            font-weight: 700;
            font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
            font-size: x-large;
            }
            
        
            .btn_create {
              background-color: rgb(11 104 106);
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 18px;
              font-weight: bold;
          
            }
        
            .btn_create:hover {
                background-color: rgb(11 104 106); /* Darken button background on hover */
            }
            .btn_create:focus {
              outline:none;
          }

                .cards {
                  
                  margin: 0 auto;
                  display: grid;
                  gap: 10px;
                  grid-template-columns: repeat(5, minmax(0, 1fr)); /* Changed to divide into 5 equal columns */
                }
          
                .card {
                  background-color: #d9d9d9;
                  color: black;
                  border-radius: 10px;
                  border: none;
                  padding: 16px;
                } 

                .btn_create{
                  float:right;
                }
                .card-title {
                  font-size: 16px;
                }
                p.card-content {
                  font-weight: bold;
                  font-size: 18px;
                }
                .heading_cards p{
                  text-align: right;
                  margin-left: auto;
                  color: black;
                  font-weight: bold;
                  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
                  font-size: medium;
                }
                .heading_cards p span{
                  color: #3E9C35;
                }

                .heading_cards {
                 display:flex;
                 margin: 0 4px;
                }
                .heading_cards h3 {
                  color:black;
                  font-weight: 700;
                  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
                }
        
                /* Add responsive styles */
                @media only screen and (max-width: 600px) {
                  .heading h3 {
                    font-size: small; 
                  }   
               
                .cards {
                  display: grid;
                  row-gap: 10px;
                  grid-template-columns: repeat(2, minmax(0, 1fr)); /* Updated value */
                  padding: 10px;
                }
                p.card-content {
                  font-weight: bold;
                  font-size: 10px;
              }
              .card-title {
                font-size: 10px;
            }
            .card {
              border-radius: 5px;
              padding: 5px 0px 5px 12px;
            }
              }
              </style>
            </head>
            <body>
            <div class="main-title">
              <span class="title"><p>Expense Report for <b>${
                data.MonthName
              }</b></p></span>
              <span> <button id="createBtn" class="btn_create">Create +</button></span>
            </div>
              <div class="heading_cards">
              <h3>${data.MonthName} ${data.FirstDayOfMonth} - ${
              data.MonthName
            } ${data.LastDayOfMonth}</h3>
         
              <p> Total: <span>  ${data.total_amount ?? 0} </span></p>
             </div>
              <div class="cards">
              <div class="card">
                <div class="card-title">Fare Amount</div>
                <p class="card-content">
                   ₹${data.total_fare_amount ?? 0}</p>
              </div>
                <div class="card">
                  <div class="card-title">Daily Allowance</div>
                  <p class="card-content">₹${
                    data.total_daily_allowance ?? 0
                  }</p>
                </div>
                <div class="card">
                  <div class="card-title">Halting</div>
                  <p class="card-content">₹${data.total_halting_amount ?? 0}</p>
                </div>
                <div class="card">
                <div class="card-title">Lodging</div>
                <p class="card-content">₹${data.total_lodging_amount ?? 0}</p>
              </div>
                
               
                <div class="card">
                  <div class="card-title">Local Conveyance</div>
                  <p class="card-content">
                    ₹${data.total_local_conveyance_other_expenses ?? 0}
                  </p>
                </div>

              </div>

              <script>
              document.getElementById('createBtn').addEventListener('click', function() {
                  document.getElementById('travel-allowance-travel_allowance_details_section-tab').click();
              });
          </script>
             

            </body>
          </html> `;

            // Set the above `html` as Summary HTML
            frm.set_df_property("total_amount_summary", "options", html);
          } else {
            // Call populate_empty_record_html if data is null or all relevant fields are null
            frm.trigger("populate_empty_record_html");
          }
        } else {
          frappe.msgprint("Error fetching total amounts");
        }
      },
    });
  },

  // handle the ta_chart table to showing data of travel history
  async ta_chart_table_html(frm) {
    try {
      const childTableData = await frm.call({
        method: "get_child_table_data",
        args: {
          parent_docname: frm.doc.name,
        },
      });

      if (!childTableData.exc) {
        const html = childTableData.message;

        frm.set_df_property("ta_chart_table_summary", "options", html);
      } else {
        frappe.msgprint(
          "Error fetching child table data: " + childTableData.exc
        );
      }
    } catch (error) {
      console.error("Error fetching child table data:", error);
      frappe.msgprint("Error fetching child table data");
    }
  },

  async html_total_allowances_details(frm) {
    let html = `
        <style>
            .allowance {
                margin-bottom: 5px;
            }
            .allowance-name {
                display: inline-block;
                width: 200px; /* Adjust width as needed */
                font-weight: bold;
            }
            .amount {
              display: inline-block;
              font-weight: bold;
              text-align: right;
              width: 100px;
            }
        </style>
        <div>
            <h3>Allowances:</h3>
        </div>
    `;

    // Function to check if value is a number
    function isValidNumber(value) {
      return !isNaN(parseFloat(value)) && isFinite(value) && value !== 0;
    }

    // Function to format number with 2 digits after the decimal point
    function formatNumber(value) {
      return parseFloat(value).toFixed(2);
    }

    // Generate HTML for each allowance if it's a valid number
    if (isValidNumber(frm.doc.daily_allowance)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Daily Allowance:</span>
                <span class="amount">${formatNumber(
                  frm.doc.daily_allowance
                )}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.fare_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Fare Amount:</span>
                <span class="amount">${formatNumber(frm.doc.fare_amount)}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.other_expenses)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Other Expenses Amount:</span>
                <span class="amount">${formatNumber(
                  frm.doc.other_expenses
                )}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.halting_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Halting Amount:</span>
                <span class="amount">${formatNumber(
                  frm.doc.halting_amount
                )}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.lodging_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Lodging Amount:</span>
                <span class="amount">${formatNumber(
                  frm.doc.lodging_amount
                )}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.total_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Total Amount:</span>
                <span class="amount">${formatNumber(
                  frm.doc.total_amount
                )}</span>
            </div>
        `;
    }

    // Set HTML content
    frm.set_df_property("html_total_allowances_details", "options", html);
  },

  custom_css: function (frm) {
    // Apply custom CSS to the form tabs and other elements
    const style = document.createElement("style");
    style.innerHTML = `
        .form-tabs-list {
            position: static !important; /* Override sticky positioning */
            background-color: #90cdcf;
            z-index: 5;
            transition: 0.5s top;
            padding-left: var(--padding-xs);
            border-bottom: 2px solid var(--border-color);
            border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
        }
        .form-tab-content.tab-content {
            background-color: #f0f0f0;
        }
        input.input-with-feedback.form-control, 
        textarea.input-with-feedback.form-control, 
        select.input-with-feedback.form-control.ellipsis {
            border: 1px solid black;
        }
        .form-section .section-head {
            font-size: large !important;
        }
        .form-footer {
            display: none;
        }
    `;
    document.head.appendChild(style);
  },

  clear_all_fields: function (frm) {
    // List of fields to clear
    var fields_to_clear = [
      "journey_type",
      "from_location",
      "date_and_time_from",
      "to_location",
      "other_to_location",
      "date_and_time_to",
      "purpose",
      "ta_mode_of_transport",
      "travel_km",
      "ticket_amount",
      "upload_ticket",
      "fare_amount",
      "do_you_want_apply_allowances",
      "select_allowance",
      "da_claim",
      "daily_allowance",
      "halting_amount",
      "lodging_amount",
      "input_lodging_amt",
      "upload_image_of_lodging",
      "total_amount",
      "class_city",
      "total_visit_time",
      "day_stay_lodge",
      "local_to_location",
      "local_date_and_time_to",
      "local_mode_of_travel",
      "other_expenses",
    ];

    // Clear values of specified fields
    fields_to_clear.forEach(function (fieldname) {
      frm.set_value(fieldname, "");
    });

    // frm.set_value("from_location", "");
    // frm.set_value("date_and_time_from", "");
    // frm.set_value("to_location", "");
    // frm.set_value("other_to_location", "");
    // frm.set_value("date_and_time_to", "");
    // frm.set_value("purpose", "");
    // frm.set_value("ta_mode_of_transport", "");
    // frm.set_value("travel_km", "");
    // frm.set_value("ticket_amount", "");
    // frm.set_value("upload_ticket", "");
    // frm.set_value("fare_amount", "");
    // frm.set_value("do_you_want_apply_allowances", "");
    // frm.set_value("select_allowance", "");
    // frm.set_value("da_claim", "");
    // frm.set_value("daily_allowance", "");
    // frm.set_value("halting_amount", "");
    // frm.set_value("lodging_amount", "");
    // frm.set_value("input_lodging_amt", "");
    // frm.set_value("upload_image_of_lodging", "");
    // frm.set_value("total_amount", "");
    // frm.set_value("class_city", "");
    // frm.set_value("total_visit_time", "");
    // frm.set_value("day_stay_lodge", "");

    // frm.set_value("local_to_location", "");
    // frm.set_value("local_date_and_time_to", "");
    // frm.set_value("local_mode_of_travel", "");
    // frm.set_value("other_expenses", "");

    frm.refresh_fields(); // Refresh the form to reflect cleared values
  },

  check_yes: function (frm) {
    frm.trigger("clear_all_fields");
    // Hide the description of the "date_and_time_to" field
    console.log("check yes", frm.doc.check_yes);
    frm.set_df_property(
      "from_location",
      "description",
      '<span style="color: green; font-size: 14px;"><b>Local Source</b></span>'
    );

    // Hide the "total_time_text" field
    frm.set_df_property("total_time_text", "hidden", 1);

    frm.set_df_property("travel_km", "hidden", 1);
    frm.set_df_property("ticket_amount", "hidden", 1);
    frm.set_df_property("upload_ticket", "hidden", 1);

    // unhidden the "total_time_text" field
    frm.set_df_property("other_expenses", "hidden", 0);

    // Hide the allowances_section field
    frm.set_df_property("allowances_section", "hidden", 1);

    frm.trigger("refresh");
  },

  check_no: function (frm) {
    frm.trigger("clear_all_fields");
    // Hide the description of the "date_and_time_to" field
    console.log("check no", frm.doc.check_no);

    frm.set_df_property(
      "from_location",
      "description",
      '<span style="color: green; font-size: 14px;"><b>Source</b></span>'
    );
    // unhidden the "total_time_text" field
    frm.set_df_property("total_time_text", "hidden", 0);
    // hide the "other_expenses" field
    frm.set_df_property("other_expenses", "hidden", 1);

    // unhidden the allowances_section field
    frm.set_df_property("allowances_section", "hidden", 0);

    frm.trigger("refresh");
    frm.trigger("ta_mode_of_transport");
  },

  journey_type: function (frm) {
    if (frm.doc.journey_type === "Return Journey") {
      frm.set_df_property(
        "date_and_time_to",
        "description",
        '<span style="color: red; font-size: 14px;"><b>Note:</b></span> <span style="color: green; font-size: 14px;"><b>Please Enter the time you reached your destination.</b></span>'
      );
    } else if (frm.doc.journey_type === "Onward Journey") {
      frm.set_df_property(
        "date_and_time_to",
        "description",
        '<span style="color: red; font-size: 14px;"><b>Note:</b></span> <span style="color: green; font-size: 14px;"><b>Enter the time you left the destination, after completing your work there.</b></span>'
      );
    }
  },
  // // handle allowances according to the selected value
  // select_allowance: function (frm) {
  //   let select_allowance = frm.doc.select_allowance;
  //   console.log("selected value of allowances:", select_allowance);

  //   if (select_allowance === "") {
  //     frm.set_value("da_claim", "");
  //     // frm.set_value("da_claim_text_description", "");
  //     frm.set_value("daily_allowance", "");
  //     frm.set_value("halting_amount", "");
  //     frm.set_value("lodging_amount", "");
  //     frm.set_value("input_lodging_amt", "");
  //   } else if (select_allowance === "DA") {
  //     frm.set_value("halting_amount", "");
  //     frm.set_value("lodging_amount", "");
  //     frm.set_value("input_lodging_amt", "");
  //     console.log("DA Select value");
  //     frm.trigger("total_time_travel");
  //     frm.trigger("CalculateAllowances");
  //   } else if (select_allowance === "Halting") {
  //     frm.set_value("da_claim", "");
  //     // frm.set_value("da_claim_text_description", "");
  //     frm.set_value("daily_allowance", "");
  //     frm.set_value("lodging_amount", "");
  //     frm.set_value("input_lodging_amt", "");
  //     console.log("Halting Selected value");
  //     frm.trigger("get_halting");
  //   } else if (select_allowance === "Lodging") {
  //     frm.set_value("da_claim", "");
  //     // frm.set_df_property("da_claim_text_description", "");
  //     frm.set_value("halting_amount", "");
  //     frm.set_value("daily_allowance", "");
  //     console.log("Lodging Selected value");
  //   } else if (select_allowance === "DA with Lodging") {
  //     console.log("DA with Lodging Selected value");
  //     frm.set_value("halting_amount", "");
  //     frm.trigger("total_time_travel");
  //     frm.trigger("CalculateAllowances");
  //   }
  // },

  // handle allowances according to the selected value
  select_allowance: function (frm) {
    const resetFields = (fields) => {
      fields.forEach((field) => frm.set_value(field, ""));
    };

    let select_allowance = frm.doc.select_allowance;
    console.log("Selected value of allowances:", select_allowance);

    const allowanceActions = {
      "": () =>
        resetFields([
          "da_claim",
          "daily_allowance",
          "halting_amount",
          "lodging_amount",
          "input_lodging_amt",
        ]),
      DA: () => {
        resetFields(["halting_amount", "lodging_amount", "input_lodging_amt"]);
        console.log("DA Selected value");
        frm.trigger("total_time_travel");
        frm.trigger("CalculateAllowances");
      },
      Halting: () => {
        resetFields([
          "da_claim",
          "daily_allowance",
          "lodging_amount",
          "input_lodging_amt",
        ]);
        console.log("Halting Selected value");
        frm.trigger("get_halting");
      },
      Lodging: () => {
        resetFields(["da_claim", "halting_amount", "daily_allowance"]);
        console.log("Lodging Selected value");
      },
      "DA with Lodging": () => {
        resetFields(["halting_amount"]);
        console.log("DA with Lodging Selected value");
        frm.trigger("total_time_travel");
        frm.trigger("CalculateAllowances");
      },
    };

    if (allowanceActions[select_allowance]) {
      allowanceActions[select_allowance]();
    }
  },

  // Check that if allowance check box is check or not...
  do_you_want_apply_allowances: function (frm) {
    let checkAllowances = frm.doc.do_you_want_apply_allowances;
    console.log("check_allowances", checkAllowances);
    if (checkAllowances == "0") {
      // Reset field values
      frm.set_value("select_allowance", null);
      frm.set_value("da_claim", "");
      frm.set_value("daily_allowance", 0); // Setting to numeric 0
      frm.set_value("halting_amount", 0); // Setting to numeric 0
      frm.set_value("lodging_amount", 0); // Setting to numeric 0
      frm.set_value("input_lodging_amt", "");

      // Hide the field
      frm.toggle_display("da_claim_text_description", false);

      // Refresh the fields
      frm.refresh_field("select_allowance");
      frm.refresh_field("da_claim");
      frm.refresh_field("daily_allowance");
      frm.refresh_field("halting_amount");
      frm.refresh_field("lodging_amount");
      frm.refresh_field("input_lodging_amt");
      frm.refresh_field("da_claim_text_description");

      // Trigger HTML refresh
      updateTotalAmount(frm);
      frm.trigger("html_total_allowances_details");
    }
  },

  date_and_time_from: function (frm) {
    frm.trigger("total_time_travel");

    // frm.trigger("select_allowance");
  },
  date_and_time_to(frm) {
    //console.log(frm.doc.date_and_time_to);
    frm.trigger("total_time_travel");
    frm.trigger("select_allowance");
    frm.trigger("day_stay_lodge");
  },

  // get_da_claim function fetching DA standard amount
  get_da_claim(frm) {
    if (frm.doc.from_location) {
      let da_category = frm.doc.da_claim; // "Nil", "Half Day", "Three Quarters Day", "Full Day", "Multiple Days"
      let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
      let cityClass = frm.doc.class_city; // Category of city a,b,c

      frm.call({
        method: "findAllowance",
        args: {
          city_class: cityClass,
          category: category,
          halt_lodge: "DA",
        },
        callback: function (r) {
          if (!r.exc) {
            // console.log("Response from findAllowance:", r);
            let da_amount = r.message[0][`${cityClass}_class_city`];
            console.log("DA limit:", da_amount);
            let da_amount_final = 0;
            let temp_amt = 0;

            // Calculate DA amount based on category
            switch (da_category) {
              case "Half Day":
                da_amount_final = da_amount / 2;
                break;
              case "Three Quarters Day":
                da_amount_final = (da_amount * 3) / 4;
                break;
              case "Full Day":
                da_amount_final = da_amount;
                break;
              case "Multiple Days":
                // Calculate DA amount for multiple days
                let totalVisitTime = frm.doc.total_visit_time;
                let timeParts = totalVisitTime.split(":");
                let hours = parseInt(timeParts[0]);
                let days = Math.floor(hours / 24);
                let remainingHours = hours % 24;

                da_amount_final = days * da_amount;

                // Additional amount for remaining hours
                if (remainingHours > 4 && remainingHours < 8) {
                  temp_amt = da_amount / 2;
                } else if (remainingHours >= 8 && remainingHours < 12) {
                  temp_amt = (da_amount * 3) / 4;
                } else if (remainingHours >= 12 && remainingHours <= 24) {
                  temp_amt = da_amount;
                }
                break;
              default:
                da_amount_final = 0;
            }

            // Set daily allowance
            frm.set_value("daily_allowance", da_amount_final + temp_amt);
            frm.refresh_field("daily_allowance");

            // Update total amount
            updateTotalAmount(frm);
          } else {
            console.error("Error while fetching DA amount:", r.exc);
            frappe.msgprint(
              "Error while fetching DA amount. Please try again."
            );
          }
        },
      });
    }
  },

  get_halting: function (frm) {
    //<Taking Parameters to fetch Amount for Halting and Lodging>
    let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; // Category of city a,b,c
    let haltLodge = "Halting"; // selected value for halting
    let no_of_days = frm.doc.no_of_days;

    let days = Math.floor(no_of_days);
    if (frm.doc.from_location) {
      if (haltLodge === "Halting") {
        frm.call({
          method: "findAllowance",
          args: {
            city_class: cityClass,
            category: category,
            halt_lodge: haltLodge,
          },
          callback: function (r) {
            if (!r.exc) {
              let halt_amount = r.message[0][`${cityClass}_class_city`];
              console.log("Halting limit:", halt_amount);
              if (days === 0) {
                frm.set_value("halting_amount", 0);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              } else if (days === 1) {
                frm.set_value("halting_amount", halt_amount);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              } else if (days > 1) {
                halt_amount = halt_amount * days;
                frm.set_value("halting_amount", halt_amount);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              }
            }
          },
        });
      }
    }
  },

  // User's inputted value of lodging
  input_lodging_amt: function (frm) {
    let inputLodge = frm.doc.input_lodging_amt;
    // console.log("inputLodge", inputLodge);
    frm.trigger("get_lodging"); // getting standard Lodging amount
  },

  day_stay_lodge: function (frm) {
    let inputDays = frm.doc.day_stay_lodge;
    let totalTime = frm.doc.no_of_days;
    console.log(totalTime);
    // Convert the totalTime to a number and extract the integer part
    let totalDays = Math.floor(parseFloat(totalTime));
    console.log("Total Days:", totalDays);

    if (inputDays > totalDays) {
      // Display a message to the user
      frappe.msgprint({
        title: __("Invalid Number of Days"),
        message: __(
          "The number of days you entered ({0}) should not exceed the travel duration of {1} days.",
          [inputDays, totalDays]
        ),
        indicator: "red", // Set message indicator color to red
      });

      // Optionally, clear the field if the input is invalid
      frm.set_value("day_stay_lodge", "");

      // Exit the function if validation fails
      return;
    }

    frm.trigger("get_lodging");
  },

  get_lodging: function (frm) {
    //<Taking Parameters to fetch Amount for Halting and Lodging>
    let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; // Category of city a,b,c
    let lodge = "Lodging"; // selected value for halting

    let days = frm.doc.day_stay_lodge;

    if (frm.doc.from_location) {
      if (lodge === "Lodging") {
        frm.call({
          method: "findAllowance",
          args: {
            city_class: cityClass,
            category: category,
            halt_lodge: lodge,
          },
          callback: function (r) {
            if (!r.exc) {
              let lodge_amount = r.message[0][`${cityClass}_class_city`];
              console.log("Standard Lodging Amount:", lodge_amount);

              let inputLodge = frm.doc.input_lodging_amt;

              // console.log("inputLodge", inputLodge);
              if (inputLodge > lodge_amount) {
                console.log(
                  "your inputed lodging amount is greater than standard Lodging Limit."
                );
                frm.set_df_property(
                  "input_lodging_amt",
                  "description",
                  `<span style="color:red;">Your inputted lodging amount is greater than the standard Lodging Limit of ${lodge_amount}.</span>`
                );
                frm.set_value("lodging_amount", lodge_amount * days);
                frm.refresh_field("lodging_amount");
              } else {
                frm.set_df_property("input_lodging_amt", "description", "");
                frm.set_value("lodging_amount", inputLodge * days);
                frm.refresh_field("lodging_amount");
              }

              updateTotalAmount(frm);
            }
          },
        });
      }
    }
  },

  CalculateAllowances(frm) {
    var timeString = frm.doc.total_visit_time;
    var timeParts = timeString.split(":");
    var hours = parseInt(timeParts[0]);

    var descriptionText = ""; // Initialize an empty string to hold the description

    if (hours <= 4) {
      frm.set_value("da_claim", "NA");
      descriptionText =
        "<span style='color:red;'>You are not eligible for Daily Allowance (DA) as the total visit time is less than or equal to 4 hours.</span>";
    } else if (hours > 4 && hours < 8) {
      frm.set_value("da_claim", "Half Day");
      descriptionText =
        "<span style='color:green;'>You are eligible for 50% of Daily Allowance (DA) as the total visit time exceeds 4 hours but is less than 8 hours.</span>";
    } else if (hours > 8 && hours < 12) {
      frm.set_value("da_claim", "Three Quarters Day");
      descriptionText =
        "<span style='color:blue;'>You are eligible for 75% of Daily Allowance (DA) as the total visit time exceeds 8 hours but is less than 12 hours.</span>";
    } else if (hours >= 12 && hours <= 24) {
      frm.set_value("da_claim", "Full Day");
      descriptionText =
        "<span style='color:purple;'>You are eligible for 100% of Daily Allowance (DA) as the total visit time exceeds 12 hours.</span>";
    } else if (hours > 24) {
      frm.set_value("da_claim", "Multiple Days");
      descriptionText =
        "<span style='color:#8b8b07;'>You are eligible for Daily Allowance (DA) for multiple days as the total visit time exceeds 24 hours.</span>";
    }

    // Set the inner HTML content of the HTML field
    frm.set_df_property(
      "da_claim_text_description",
      "options",
      descriptionText
    );
    frm.trigger("get_da_claim"); // Trigger the "get_da_claim" event
    frm.refresh_field("da_claim_text_description"); // Refresh the field to reflect the changes
  },

  total_time_travel: function (frm) {
    var dateAndTimeFrom = new Date(frm.doc.date_and_time_from);
    var dateAndTimeTo = new Date(frm.doc.date_and_time_to);

    // Check if both date and time values are valid
    if (!isNaN(dateAndTimeFrom) && !isNaN(dateAndTimeTo)) {
      // Check if 'date_and_time_from' is earlier than 'date_and_time_to'
      if (dateAndTimeTo >= dateAndTimeFrom) {
        var timeDifference = dateAndTimeTo - dateAndTimeFrom;
        console.log(dateAndTimeFrom, dateAndTimeTo, timeDifference); // Add this line for debugging
        var formattedTime = formatTimeDifference(timeDifference);
        console.log("total time is", formattedTime); // Add this line for debugging
        frm.set_value("total_visit_time", formattedTime);
        // Calculate days and remaining hours
        let timeParts = formattedTime.split(":");
        let hours = parseInt(timeParts[0]);
        let days = Math.floor(hours / 24);
        let remainingHours = hours % 24;

        // Construct the message based on days and remaining hours
        var message = "";
        if (days > 0) {
          message += `${days} day`;
          if (days !== 1) {
            message += "s"; // Add 's' only if days is not equal to 1
          }
          if (remainingHours > 0) {
            message += " and ";
          }
        }
        if (remainingHours > 0) {
          message += `${remainingHours} hour`;
          if (remainingHours !== 1) {
            message += "s"; // Add 's' only if remainingHours is not equal to 1
          }
        }
        message += "."; // Add a period at the end of the sentence

        // Show total visiting time to the user
        var totalVisitTimeText = `<div style="font-weight: bold; color: #007bff;">Your total visiting time is ${message}</div>`;
        // Replace the 'your_div_id' with the ID of the div where you want to display the text
        $(frm.wrapper).find("#total_time_text").html(totalVisitTimeText);

        frm.set_value("no_of_days", days + "." + remainingHours);
      } else {
        // Clear total_visit_time if dates are not in order
        frappe.msgprint(
          __("End date and time should be greater than start date and time.")
        );

        // Clear the div content
        $(frm.wrapper).find("#total_time_text").html("");
        frm.set_value("total_visit_time", "");
        frm.set_value("date_and_time_to", "");
        // frm.set_value("date_and_time_from", "");
      }
    } else {
      // Clear the div if either date or time is invalid
      $(frm.wrapper).find("#total_time_text").html("");
      frm.set_value("total_visit_time", ""); // Clear total_visit_time if either date or time is invalid
    }

    function formatTimeDifference(timeDifference) {
      var totalMinutes = Math.floor(timeDifference / (60 * 1000));
      // var days = Math.floor(totalMinutes / (24 * 60));
      var hours = Math.floor((totalMinutes % (24 * 60 * 24)) / 60);
      var minutes = totalMinutes % 60;
      var seconds = minutes % 60;
      // Format the time as DD:HH:MM
      var formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(
        seconds
      )}`;
      //${padZero(days)}:
      return formattedTime;
    }

    function padZero(num) {
      return num.toString().padStart(2, "0");
    }
  },

  other_expenses_check: function (frm) {
    let checkOtherExpense = frm.doc.other_expenses_check;
    // console.log("check value", checkOtherExpense);
    // Make other fields mandatory (example code)
    if (checkOtherExpense === "1") {
      frm.set_df_property("select_type_expenses", "reqd", true);
      frm.set_df_property("date_other_expense", "reqd", true);
      // Add a trigger when the form is refreshed
    }
  },

  //handle the local conveyance amount
  other_expenses: function (frm) {
    updateTotalAmount(frm);
  },

  // local(other expense) date validation- between the range of from date and to date
  date_other_expense: function (frm) {
    var from_date = frm.doc.date_and_time_from;
    // console.log(from_date);
    var modifiedfromDate = frappe.datetime.add_days(from_date, -1);
    // console.log("Modified date:", modifiedfromDate);
    var to_date = frm.doc.date_and_time_to;
    // console.log(to_date);
    var date_otherexpense = frm.doc.date_other_expense;

    if (date_otherexpense) {
      // Check if inbetween_date is within the range
      if (
        date_otherexpense > modifiedfromDate &&
        date_otherexpense <= to_date
      ) {
        // console.log("from date:", from_date);
        // console.log("to date:", to_date);
        frm.set_value("date_other_expense", date_otherexpense); // Set the valid in-between date
      } else {
        frappe.msgprint(
          __(
            "Your local date should be match with from date or to date or within this dates."
          )
        );
        frm.set_value("date_other_expense", ""); // Clear the invalid in-between date
      }
    }
  },
  // validate: function (frm) {
  //   // Custom validation logic
  //   if (frm.doc.total_amount === 0) {
  //     frappe.throw(
  //       "'Total Amount' should not be zero.",
  //       __("Validation Error"),
  //       function () {
  //         // Optional callback function to execute after the user closes the error dialog
  //         // You can add any additional logic here if needed
  //       }
  //     );
  //     return false; // Return false to prevent the form from saving
  //   }
  // },

  //saving total allowance amount
  before_save(frm) {
    let total_amount = 0;

    total_amount =
      (frm.doc.daily_allowance || 0) +
      (frm.doc.other_expenses || 0) +
      (frm.doc.fare_amount || 0) +
      (frm.doc.halting_amount || 0) +
      (frm.doc.lodging_amount || 0);

    // console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed());
    frm.refresh_field("total_amount");
  },

  ta_mode_of_transport: function (frm) {
    updateFareAmount(frm);
  },

  ticket_amount: function (frm) {
    frm.set_value("fare_amount", frm.doc.ticket_amount);
    updateFareAmount(frm);
    // console.log("Ticket amount:", frm.doc.ticket_amount);
  },

  travel_km: function (frm) {
    updateFareAmount(frm);
  },

  // Saving data into child table TA
  // btn_add_ta: function (frm) {
  //   let taFromLocation = frm.doc.from_location;
  //   let tadateTimeFrom = frm.doc.date_and_time_from;
  //   let taToLocation = frm.doc.to_location;
  //   let localToLocation = frm.doc.local_to_location;
  //   let tadateTimeTo = frm.doc.date_and_time_to;
  //   let localDateTimeTo = frm.doc.local_date_and_time_to;
  //   let taPurpose = frm.doc.purpose;
  //   let taTotalTime = frm.doc.total_visit_time;
  //   let taClassCity = frm.doc.class_city;
  //   let taModeOfTransport = frm.doc.ta_mode_of_transport;
  //   let taTotalKM = frm.doc.travel_km;
  //   let taFareAmt = frm.doc.fare_amount;
  //   let taAllowanceType = frm.doc.select_allowance;
  //   let taDaClaim = frm.doc.da_claim;
  //   let taDaAmount = frm.doc.daily_allowance;
  //   let taHaltingAmt = frm.doc.halting_amount;
  //   let taLodgingAmt = frm.doc.lodging_amount;
  //   let localExpense = frm.doc.other_expenses;
  //   let taTotalAllowance = frm.doc.total_amount;
  //   let localmodeofTravel = frm.doc.local_mode_of_travel;
  //   let isLocalCheckYesNo;
  //   let taMonth = frm.doc.month;
  //   let taYear = frm.doc.year;
  //   let uploadTravelTicket = frm.doc.upload_ticket;
  //   let uploadLodgingTicket = frm.doc.upload_image_of_lodging;
  //   let dayStayLodge = frm.doc.day_stay_lodge;

  //   // Convert city class to uppercase if it is 'a', 'b', or 'c'
  //   if (taClassCity) {
  //     taClassCity = taClassCity.toUpperCase();
  //   }

  //   // if Form entry is Local
  //   if (frm.doc.check_yes == "1") {
  //     isLocalCheckYesNo = "Yes";
  //     if (!taFromLocation) {
  //       frappe.throw("Please fill your Source Location");
  //     } else if (!localToLocation) {
  //       frappe.throw("Please fill your Destination Location");
  //     } else if (!taPurpose) {
  //       frappe.throw("Please fill your Reason of travelling");
  //     } else if (!localmodeofTravel) {
  //       frappe.throw("Please Select Mode of Transport");
  //     } else if (!localExpense) {
  //       frappe.throw("Please Enter the amount");
  //     } else if (!taTotalAllowance || taTotalAllowance == 0) {
  //       frappe.throw(
  //         "Please fill in the details properly. Total allowance amount cannot be zero."
  //       );
  //     } else {
  //       let row = frm.add_child("ta_chart", {
  //         month: taMonth,
  //         year: taYear,
  //         local_conveyance: isLocalCheckYesNo,
  //         from_location: taFromLocation,
  //         date_and_time_start: tadateTimeFrom,
  //         to_location: localToLocation,
  //         date_and_time_end: localDateTimeTo,
  //         purpose: taPurpose,
  //         mode_of_transport: localmodeofTravel,
  //         local_conveyance_other_expenses_amount: localExpense,
  //         total: taTotalAllowance,
  //       });
  //       frm.refresh_field("ta_chart"); // save form after adding ta
  //       frm.save();

  //       // Set null of ta form
  //       frm.set_value("check_yes", 0);
  //       frm.set_value("from_location", null);
  //       frm.set_value("date_and_time_from", null);
  //       frm.set_value("local_to_location", null);
  //       frm.set_value("local_date_and_time_to", null);
  //       frm.set_value("purpose", null);
  //       frm.set_value("local_mode_of_travel", null);
  //       frm.set_value("other_expenses", null);
  //       frm.set_value("total_amount", null);

  //       frm.refresh_fields("Travel Allowance");
  //     }
  //   }
  //   // if Form entries is main entry
  //   else if (frm.doc.check_no == "1") {
  //     isLocalCheckYesNo = "No";

  //     let toLocation;
  //     if (taToLocation === "Other") {
  //       toLocation = frm.doc.other_to_location;
  //     } else {
  //       toLocation = frm.doc.to_location;
  //     }

  //     if (!taFromLocation) {
  //       frappe.throw("Please fill your Source Location");
  //     } else if (!taToLocation) {
  //       frappe.throw("Please fill your Destination Location");
  //     } else if (!taPurpose) {
  //       frappe.throw("Please fill your Reason of travelling");
  //     } else if (!taModeOfTransport) {
  //       frappe.throw("Please Select Mode of travel");
  //     } else if (taModeOfTransport === "Bike" || taModeOfTransport === "Car") {
  //       if (!taTotalKM || taTotalKM == 0) {
  //         frappe.throw("Please Enter Kilometer of travelling");
  //       }
  //     } else if (["Bus", "Train"].includes(taModeOfTransport)) {
  //       if (frm.doc.ticket_amount === 0) {
  //         frappe.throw("Please enter the ticket amount");
  //       }
  //       if (!uploadTravelTicket) {
  //         frappe.throw("Please upload the ticket image");
  //       }
  //     } else if (!taTotalAllowance || taTotalAllowance == 0) {
  //       frappe.throw(
  //         "Please fill in the details properly. Total allowance amount cannot be zero."
  //       );
  //     } else {
  //       let row = frm.add_child("ta_chart", {
  //         month: taMonth,
  //         year: taYear,
  //         local_conveyance: isLocalCheckYesNo,
  //         from_location: taFromLocation,
  //         date_and_time_start: tadateTimeFrom,
  //         to_location: toLocation,
  //         date_and_time_end: tadateTimeTo,
  //         purpose: taPurpose,
  //         total_visit_hour: taTotalTime,
  //         city_class: taClassCity,
  //         mode_of_transport: taModeOfTransport,
  //         kilometer_of_travelling: taTotalKM,
  //         fare_amount: taFareAmt,
  //         allowance_type: taAllowanceType,
  //         da_claim: taDaClaim,
  //         daily_allowance: taDaAmount,
  //         halting_amount: taHaltingAmt,
  //         lodging_amount: taLodgingAmt,
  //         total: taTotalAllowance,
  //         uploaded_ticket_image: uploadTravelTicket,
  //         uploaded_lodging_bill_image: uploadLodgingTicket,
  //         day_stay_lodge: dayStayLodge,
  //       });

  //       frm.refresh_field("ta_chart");
  //       // save form after adding ta
  //       frm.save();

  //       // Set null of ta form
  //       frm.set_value("check_no", 0);
  //       frm.set_value("from_location", null);
  //       frm.set_value("date_and_time_from", null);
  //       frm.set_value("to_location", null);
  //       frm.set_value("other_to_location", null);
  //       frm.set_value("date_and_time_to", null);
  //       frm.set_value("purpose", null);
  //       frm.set_value("ta_mode_of_transport", null);
  //       frm.set_value("travel_km", 0);
  //       frm.set_value("ticket_amount", 0);
  //       frm.set_value("upload_ticket", null);
  //       frm.set_value("fare_amount", 0);
  //       frm.set_value("do_you_want_apply_allowances", 0);
  //       frm.set_value("select_allowance", null);
  //       frm.set_value("da_claim", null);
  //       frm.set_value("daily_allowance", 0);
  //       frm.set_value("halting_amount", 0);
  //       frm.set_value("lodging_amount", 0);
  //       frm.set_value("input_lodging_amt", 0);
  //       frm.set_value("upload_image_of_lodging", null);
  //       frm.set_value("total_amount", 0);
  //       frm.set_value("class_city", null);
  //       frm.set_value("total_visit_time", null);
  //       frm.set_value("day_stay_lodge", null);

  //       frm.refresh_fields("Travel Allowance");
  //     }
  //   }
  // },

  // Saving data into child table TA
  btn_add_ta: function (frm) {
    let taFromLocation = frm.doc.from_location;
    let tadateTimeFrom = frm.doc.date_and_time_from;
    let taToLocation = frm.doc.to_location;
    let localToLocation = frm.doc.local_to_location;
    let tadateTimeTo = frm.doc.date_and_time_to;
    let localDateTimeTo = frm.doc.local_date_and_time_to;
    let taPurpose = frm.doc.purpose;
    let taTotalTime = frm.doc.total_visit_time;
    let taClassCity = frm.doc.class_city;
    let taModeOfTransport = frm.doc.ta_mode_of_transport;
    let taTotalKM = frm.doc.travel_km;
    let taFareAmt = frm.doc.fare_amount;
    let taAllowanceType = frm.doc.select_allowance;
    let taDaClaim = frm.doc.da_claim;
    let taDaAmount = frm.doc.daily_allowance;
    let taHaltingAmt = frm.doc.halting_amount;
    let taLodgingAmt = frm.doc.lodging_amount;
    let localExpense = frm.doc.other_expenses;
    let taTotalAllowance = frm.doc.total_amount;
    let localmodeofTravel = frm.doc.local_mode_of_travel;
    let isLocalCheckYesNo;
    let taMonth = frm.doc.month;
    let taYear = frm.doc.year;
    let uploadTravelTicket = frm.doc.upload_ticket;
    let uploadLodgingTicket = frm.doc.upload_image_of_lodging;
    let dayStayLodge = frm.doc.day_stay_lodge;
    let tastatus = "Not Set";

    // Convert city class to uppercase if it is 'a', 'b', or 'c'
    if (taClassCity) {
      taClassCity = taClassCity.toUpperCase();
    }

    if (taModeOfTransport) {
      if (taModeOfTransport === "Bike" || taModeOfTransport === "Car") {
        if (!taTotalKM || taTotalKM == 0) {
          frappe.throw("Please Enter Kilometer of travelling");
        }
      } else if (["Bus", "Train"].includes(taModeOfTransport)) {
        if (frm.doc.ticket_amount === 0) {
          frappe.throw("Please enter the ticket amount");
        }
        if (!uploadTravelTicket) {
          frappe.throw("Please upload the ticket image");
        }
      } else if (!taTotalAllowance || taTotalAllowance == 0) {
        frappe.throw(
          "Please fill in the details properly. Total allowance amount cannot be zero."
        );
      }
    }

    if (frm.doc.do_you_want_apply_allowances === 1) {
      if (!taAllowanceType) {
        frappe.throw(
          "Allowance type must be selected if you want to apply allowances."
        );
      } else if (
        taAllowanceType === "Lodging" ||
        taAllowanceType === "DA with Lodging"
      ) {
        if (!frm.doc.input_lodging_amt || frm.doc.input_lodging_amt == 0) {
          frappe.throw("Please input your lodging amount.");
        }
        if (!dayStayLodge || dayStayLodge == 0) {
          frappe.throw("Please input your number of days stay in Lodge.");
        }
        if (!uploadLodgingTicket) {
          frappe.throw("Please upload the lodging bill image.");
        }
      }
    }
    // if Form entry is Local
    if (frm.doc.check_yes == "1") {
      isLocalCheckYesNo = "Yes";
      if (!taFromLocation) {
        frappe.throw("Please fill your Source Location");
      } else if (!localToLocation) {
        frappe.throw("Please fill your Destination Location");
      } else if (!taPurpose) {
        frappe.throw("Please fill your Reason of travelling");
      } else if (!localmodeofTravel) {
        frappe.throw("Please Select Mode of Transport");
      } else if (!localExpense) {
        frappe.throw("Please Enter the amount");
      } else {
        let row = frm.add_child("ta_chart", {
          month: taMonth,
          year: taYear,
          local_conveyance: isLocalCheckYesNo,
          from_location: taFromLocation,
          date_and_time_start: tadateTimeFrom,
          to_location: localToLocation,
          date_and_time_end: localDateTimeTo,
          purpose: taPurpose,
          mode_of_transport: localmodeofTravel,
          local_conveyance_other_expenses_amount: localExpense,
          total: taTotalAllowance,
          status: tastatus,
        });
        frm.refresh_field("ta_chart"); // save form after adding ta
        frm.save();

        // Set null of ta form
        frm.set_value("check_yes", 0);
        frm.set_value("from_location", null);
        frm.set_value("date_and_time_from", null);
        frm.set_value("local_to_location", null);
        frm.set_value("local_date_and_time_to", null);
        frm.set_value("purpose", null);
        frm.set_value("local_mode_of_travel", null);
        frm.set_value("other_expenses", null);
        frm.set_value("total_amount", null);

        frm.refresh_fields("Travel Allowance");
      }
    }
    // if Form entries is main entry
    else if (frm.doc.check_no == "1") {
      isLocalCheckYesNo = "No";

      let toLocation;
      if (taToLocation === "Other") {
        toLocation = frm.doc.other_to_location;
      } else {
        toLocation = frm.doc.to_location;
      }

      if (!taFromLocation) {
        frappe.throw("Please fill your Source Location");
      } else if (!taToLocation) {
        frappe.throw("Please fill your Destination Location");
      } else if (!taPurpose) {
        frappe.throw("Please fill your Reason of travelling");
      } else if (!taModeOfTransport) {
        frappe.throw("Please Select Mode of travel");
        // } else if (!taTotalAllowance || taTotalAllowance == 0) {
        //   frappe.throw(
        //     "Please fill in the details properly. Total allowance amount cannot be zero."
        //   );
      } else {
        let row = frm.add_child("ta_chart", {
          month: taMonth,
          year: taYear,
          local_conveyance: isLocalCheckYesNo,
          from_location: taFromLocation,
          date_and_time_start: tadateTimeFrom,
          to_location: toLocation,
          date_and_time_end: tadateTimeTo,
          purpose: taPurpose,
          total_visit_hour: taTotalTime,
          city_class: taClassCity,
          mode_of_transport: taModeOfTransport,
          kilometer_of_travelling: taTotalKM,
          fare_amount: taFareAmt,
          allowance_type: taAllowanceType,
          da_claim: taDaClaim,
          daily_allowance: taDaAmount,
          halting_amount: taHaltingAmt,
          lodging_amount: taLodgingAmt,
          total: taTotalAllowance,
          uploaded_ticket_image: uploadTravelTicket,
          uploaded_lodging_bill_image: uploadLodgingTicket,
          day_stay_lodge: dayStayLodge,
          status: tastatus,
        });

        frm.refresh_field("ta_chart");
        // save form after adding ta
        frm.save();

        // Set null of ta form
        frm.set_value("check_no", 0);
        frm.set_value("from_location", null);
        frm.set_value("date_and_time_from", null);
        frm.set_value("to_location", null);
        frm.set_value("other_to_location", null);
        frm.set_value("date_and_time_to", null);
        frm.set_value("purpose", null);
        frm.set_value("ta_mode_of_transport", null);
        frm.set_value("travel_km", 0);
        frm.set_value("ticket_amount", 0);
        frm.set_value("upload_ticket", null);
        frm.set_value("fare_amount", 0);
        frm.set_value("do_you_want_apply_allowances", 0);
        frm.set_value("select_allowance", null);
        frm.set_value("da_claim", null);
        frm.set_value("daily_allowance", 0);
        frm.set_value("halting_amount", 0);
        frm.set_value("lodging_amount", 0);
        frm.set_value("input_lodging_amt", 0);
        frm.set_value("upload_image_of_lodging", null);
        frm.set_value("total_amount", 0);
        frm.set_value("class_city", null);
        frm.set_value("total_visit_time", null);
        frm.set_value("day_stay_lodge", null);

        frm.refresh_fields("Travel Allowance");
      }
    }
  },
  after_save: function (frm) {
    // Trigger the click event on the "TA History" tab link
    // document.getElementById("travel-allowance-ta_tab-tab").click();

    // Refresh the screen after 3 seconds (adjust the delay as needed)
    setTimeout(function () {
      window.location.reload();
    }, 1000); // 2000 milliseconds = 2 seconds
  },
});

function updateFareAmount(frm) {
  let fareAmount = 0;
  let modeValue = frm.doc.ta_mode_of_transport;
  let travelKM = frm.doc.travel_km;

  if (
    modeValue === "Bus" ||
    modeValue === "Train" ||
    modeValue === "Air in economy class"
  ) {
    frm.set_value("travel_km", 0);
    frm.set_df_property("ticket_amount", "hidden", 0);
    frm.set_df_property("upload_ticket", "hidden", 0);
    fareAmount = frm.doc.ticket_amount;
    console.log("fare Amount on select Bus And Train is:", fareAmount);
  } else if (modeValue === "Bike") {
    frm.set_value("ticket_amount", 0);
    frm.set_df_property("travel_km", "hidden", 0);
    fareAmount = 4 * travelKM;
  } else if (modeValue === "Car") {
    frm.set_value("ticket_amount", 0);
    frm.set_df_property("travel_km", "hidden", 0);
    fareAmount = 10 * travelKM;
  }

  // console.log("Mode of transport:", modeValue);
  // console.log("Fare amount:", fareAmount);

  frm.set_value("fare_amount", fareAmount);
  frm.refresh_field("fare_amount");

  updateTotalAmount(frm);
}

function updateTotalAmount(frm) {
  let total_amount =
    parseFloat(frm.doc.daily_allowance || 0) +
    parseFloat(frm.doc.other_expenses || 0) +
    parseFloat(frm.doc.fare_amount || 0) +
    parseFloat(frm.doc.halting_amount || 0) +
    parseFloat(frm.doc.lodging_amount || 0);

  console.log("Total Allowance:", total_amount);
  frm.set_value("total_amount", total_amount);
  frm.refresh_field("total_amount");

  frm.trigger("html_total_allowances_details");
}
