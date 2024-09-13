// Copyright (c) 2024, Apeksha Raut and contributors
// For license information, please see license.txt

frappe.ui.form.on("Sahayog Travel Allowance", {
  refresh: function (frm) {
    //check if the form is new, get empID
    if (frm.is_new()) {
      //Setting Employee ID
      let user = frappe.session.user;
      let eid = user.match(/\d+/)[0];
      console.log("emp ID: ", eid);
      frm.set_value("employee_id", eid);
      let empid = frm.doc.employee_id;

      // Getting Employee Designation
      frappe.db
        .get_value("Employee", empid, "designation")
        .then((result) => {
          let EmpDesignation =
            result.message && result.message.designation
              ? result.message.designation
              : null;
          console.log("Designation:", EmpDesignation);

          // Now you can use globalEmpDesignation wherever needed

          // Example: Call a function that depends on the fetched value
          handleDesignation(EmpDesignation);
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
            let TaCategory =
              result.message && result.message.ta_category
                ? result.message.ta_category
                : null;
            console.log("ta_category:", TaCategory);
            frm.set_value("ta_category", TaCategory); // Setting value of designation category field

            // Now you can use globalEmpDesignation wherever needed

            // Example: Call a function that depends on the fetched value
            //handleDesignation(globalEmpDesignation);
          })
          .catch((err) => {
            console.error("Error fetching designation:", err);
          });
      }

      //Fetching date, month and year
      // frm.call({
      //   method: "get_server_datetime",
      //   callback: function (r) {
      //     // Check if the response has a valid message
      //     if (r.message) {
      //       // Parse the datetime string into a JavaScript Date object
      //       var serverDatetime = new Date(r.message);

      //       // Extract the year
      //       var year = serverDatetime.getFullYear();
      //       // Extract the month (returns a zero-based index, so add 1)
      //       //var month = serverDatetime.getMonth() + 1;

      //       var monthIndex = serverDatetime.getMonth();

      //       // Array of month names
      //       var monthNames = [
      //         "January",
      //         "February",
      //         "March",
      //         "April",
      //         "May",
      //         "June",
      //         "July",
      //         "August",
      //         "September",
      //         "October",
      //         "November",
      //         "December",
      //       ];

      //       // Get the month name based on the index
      //       var monthName = monthNames[monthIndex];
      //       // Set the value of the "year" field
      //       frm.set_value("year", year);
      //       frm.refresh_field("year");
      //       // Set the value of the "month" field
      //       frm.set_value("month", monthName);

      //       frm.refresh_field("month");
      //     } else {
      //       console.log("Invalid server datetime response");
      //     }
      //   },
      // });
    } else if (!frm.is_new()) {
      console.log("Old Form");

      frm.trigger("populate_total_amount_html");
      frm.trigger("ta_chart_table_html");
    }

    //(TA Add Button)adding css to button
    frm.fields_dict.add_btn.$input.css({
      "background-color": "rgb(18 147 70)",
      color: "#fff",
      border: "none",
      padding: "8px 22px",
      cursor: "pointer",
      width: "100%",
      "border-radius": "20px",
    });
  },
  date_and_time_to: function (frm) {
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
      } else {
        // Clear total_visit_time if dates are not in order
        frappe.msgprint(
          __("End date and time should be greater than start date and time.")
        );
        frm.set_value("total_visit_time", "");
        frm.set_value("date_and_time_to", "");
        // frm.set_value("date_and_time_from", "");
      }
    } else {
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
});
