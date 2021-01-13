const fs = require("fs");
const path = require("path");
const electron = require("electron");
const database = require(path.resolve(__dirname, "../../database"));
const { ipcRenderer } = require('electron');
const loki = require("lokijs");

/*ipcRenderer.on('update-patients-list', (event,arg) => {
    console.log('actual records: ' + arg.records.length);
  });*/

  var oldId = "";

  const id_edit_button = document.getElementById("id-edit-button");
  id_edit_button.addEventListener('click', () => {
      var current_date = new Date();
      var yyyy = current_date.getFullYear();
      var mm = current_date.getMonth() + 1;
      var dd = current_date.getDate();
      if (mm < 10) {
          mm = '0' + mm;
      }
      if (dd < 10) {
          dd = '0' + dd;
      }
      document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
      document.getElementById("ppid").readOnly = false;
      document.getElementById("save-edit-button").disabled = false;
  });

const fname_edit_button = document.getElementById("fname-edit-button");
fname_edit_button.addEventListener('click', () => {
    var current_date = new Date();
    var yyyy = current_date.getFullYear();
    var mm = current_date.getMonth() + 1;
    var dd = current_date.getDate();
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }
    document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
    document.getElementById("pfname").readOnly = false;
    document.getElementById("save-edit-button").disabled = false;
});

const lname_edit_button = document.getElementById("lname-edit-button");
lname_edit_button.addEventListener('click', () => {
    var current_date = new Date();
    var yyyy = current_date.getFullYear();
    var mm = current_date.getMonth() + 1;
    var dd = current_date.getDate();
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }
    document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
    document.getElementById("plname").readOnly = false;
    document.getElementById("save-edit-button").disabled = false;
});

const bdate_edit_button = document.getElementById("bdate-edit-button");
bdate_edit_button.addEventListener('click', () => {
    var current_date = new Date();
    var yyyy = current_date.getFullYear();
    var mm = current_date.getMonth() + 1;
    var dd = current_date.getDate();
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }
    document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
    document.getElementById("pbdate").readOnly = false;
    document.getElementById("save-edit-button").disabled = false;
});

const med_edit_button = document.getElementById("med-edit-button");
med_edit_button.addEventListener('click', () => {
    var current_date = new Date();
    var yyyy = current_date.getFullYear();
    var mm = current_date.getMonth() + 1;
    var dd = current_date.getDate();
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }
    document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
    document.getElementById("pmedicament").readOnly = false;
    document.getElementById("save-edit-button").disabled = false;
});

const notes_edit_button = document.getElementById("notes-edit-button");
notes_edit_button.addEventListener('click', () => {
    var current_date = new Date();
    var yyyy = current_date.getFullYear();
    var mm = current_date.getMonth() + 1;
    var dd = current_date.getDate();
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (dd < 10) {
        dd = '0' + dd;
    }
    document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
    document.getElementById("pcomment").readOnly = false;
    document.getElementById("save-edit-button").disabled = false;
});

var patient_list = null;
const patient_table = document.getElementById("ppatients-table-list").getElementsByTagName('TBODY')[0];
const edit_button = document.getElementById("button-edit-patient");
function fill_table(patient_list, specific_table) {
    //console.log('status: ' + database.getStatus());
    try {
        if (!patient_list) {
            //console.log('The returned list of participants is empty');
            //console.log('updated ' + patient_list.length);
        } else {
            //console.log("Number of patients: " + patient_list.length);
            for (var i = 0; i < patient_list.length; i++) {
                //data
                var table_row = specific_table.insertRow(i);
                var cell = table_row.insertCell(0);
                cell.innerHTML = patient_list[i].id;
                var cell = table_row.insertCell(1);
                cell.innerHTML = patient_list[i].firstname;
                var cell = table_row.insertCell(2);
                cell.innerHTML = patient_list[i].lastname;
                var cell = table_row.insertCell(3);
                var str = patient_list[i].birthdate;
                var dmy = str.split("-");
                cell.innerHTML = dmy[2]+"."+dmy[1]+"."+dmy[0];
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

function init_table_values(specific_table) {
    try {
        if (specific_table !== null) {
            var table_rows_length = specific_table.getElementsByTagName("tr").length;
            //console.log("Number of rows in the table: " + table_rows_length);
            r = 0;
            while (table_rows_length != 0) {
                specific_table.deleteRow(r);
                table_rows_length = table_rows_length - 1;
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

function delete_table_values() {
    try {
        if (patient_table !== null) {
            var table_rows_length = patient_table.getElementsByTagName("tr").length;
            //console.log("Number of rows in the table: " + table_rows_length);
            r = 0;
            while (table_rows_length != 0) {
                patient_table.deleteRow(r);
                table_rows_length = table_rows_length - 1;
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

edit_button.addEventListener('click', () => {
    var tmp = database.readAllPatients();
    if (tmp != null) {
        //console.log('number of patients ' + tmp.length);
        //delete the old values and fill in the new ones
        delete_table_values();
        fill_table(tmp, patient_table);
    }
});

patient_table.addEventListener('click', (event) => {
    var target = event.target.closest('td');
    var table_row_index = target.parentNode.rowIndex - 1;
    var pid = patient_table.rows[table_row_index].cells[0].innerHTML;
    var pfname = patient_table.rows[table_row_index].cells[1].innerHTML;
    var plname = patient_table.rows[table_row_index].cells[2].innerHTML;
    var pbdate = patient_table.rows[table_row_index].cells[3].innerHTML;

    document.getElementById("ppid").value = pid;
    oldId = pid;
    document.getElementById("pfname").value = pfname;
    document.getElementById("plname").value = plname;
    document.getElementById("pbdate").value = pbdate;

    var tmp = database.readMedication(pid, pfname, plname);
    if (tmp === null) {
        //console.log("Empty set of medications");
        var current_date = new Date();
        //console.log("today: " + current_date);
        var yyyy = current_date.getFullYear();
        var mm = current_date.getMonth() + 1;
        var dd = current_date.getDate();
        if (mm < 10) {
            mm = '0' + mm;
        }
        if (dd < 10) {
            dd = '0' + dd;
        }
        //var formated_date = current_date.getFullYear() + "-" + (current_date.getMonth()+1) + "-" + current_date.getDay();
        document.getElementById("pupdate-date").value = yyyy + '-' + mm + '-' + dd;
        document.getElementById("pmedicament").value = "";
        document.getElementById("pcomment").value = "";
        document.getElementById("pmedicament").placeholder = "Text eingeben ...";
        document.getElementById("pcomment").placeholder = "Text eingeben ...";
    } else {
        var mdate = tmp.mdate;
        //console.log('mdate: ' + mdate);
        var medication = tmp.medication;
        var notes = tmp.notes;
        document.getElementById("pupdate-date").value = mdate;
        document.getElementById("pmedicament").value = medication;
        document.getElementById("pcomment").value = notes;
    }
});

const save_edit_button = document.getElementById("save-edit-button");
save_edit_button.addEventListener('click', async () => {
    // if ID is not in correct format, give error to user and abort
    var patientId = document.getElementById("ppid").value;
    if(!(/uku[0-9]/.test(patientId)) || patientId=="uku0") {
        alert("Patienten-ID im ungültigen Format")
        return;
    }
    var tmp_entry = {pid: patientId};
    var res = await database.checkForID(tmp_entry); //avoid duplicate IDs
    if(res && (patientId != oldId)) {
        alert("Patienten-ID bereits vorhanden")
        return;
    };

    var bdate = document.getElementById("pbdate").value;
    var bdateSplit = bdate.split(".");
    var bdateString = bdateSplit[2]+"-"+bdateSplit[1]+"-"+bdateSplit[0];

    database.editPatient(patientId,
        document.getElementById("pfname").value,
        document.getElementById("plname").value,
        bdateString,
        oldId
    );

    if(patientId != oldId) { //patientID was changed -> change all medication updates, visits and entries
        database.updateEntries(oldId,patientId);
        database.updateVisits(oldId,patientId);
        database.updateMedicationUpdates(oldId,patientId);
    }

    var new_med = {
        pid: document.getElementById("ppid").value,
        fname: document.getElementById("pfname").value,
        lname: document.getElementById("plname").value,
        mdate: document.getElementById("pupdate-date").value,
        medication: document.getElementById("pmedicament").value,
        notes: document.getElementById("pcomment").value
    };
    var tmp = database.readMedication(document.getElementById("ppid").value,
        document.getElementById("pfname").value,
        document.getElementById("plname").value);
    if (tmp == null) {
        database.addMedicationToDB(new_med);
    } else {
        tmp.pid = document.getElementById("ppid").value;
        tmp.fname = document.getElementById("pfname").value;
        tmp.lname = document.getElementById("plname").value;
        tmp.mdate = document.getElementById("pupdate-date").value;
        tmp.medication = document.getElementById("pmedicament").value;
        tmp.notes = document.getElementById("pcomment").value;
        database.updateMedication(oldId,
            document.getElementById("pfname").value,
            document.getElementById("plname").value, tmp, oldId);
    }
    document.getElementById("save-edit-button").disabled = true;
    document.getElementById("pmedicament").readOnly = true;
    document.getElementById("pcomment").readOnly = true;
    //------------------Reload the table to actualise the new data-----------------
    var new_data = database.readAllPatients();
    if (new_data != null) {
        //console.log('number of patients ' + new_data.length);
        //delete the old values and fill in the new ones
        delete_table_values();
        fill_table(new_data, patient_table);
    }
    //-----------------------------------------------------------------------------

    // TODO: also actualize table in add-patient
    ipcRenderer.send('patient-data-edited');
});

//const search_button = document.getElementById("search-button");
const search_bar = document.getElementById("psearch-text");

search_bar.addEventListener('keyup', () => {
    //console.log('Search clicked');
    var search_text = search_bar.value.toUpperCase();
    var table_rows = patient_table.getElementsByTagName("tr");
    //console.log('number of table rows: ' + table_rows.length);
    var found = false;
    var counter = 0;
    //Initialising the colors: change this when the css are set.
    for (var i = 0; i < table_rows.length; i++) {
        table_rows[i].style.backgroundColor = "white";
    }
    //Running the search
    if (search_text != "") {
        for (counter = 0; counter < table_rows.length; counter++) {
            var table_data = table_rows[counter].getElementsByTagName("td");
            var txt = '';
            for (var j = 0; j < table_data.length - 1; j++) {
                txt = txt.concat(table_data[j].text_content || table_data[j].innerText, ' ');
                //console.log('TEXT: ' + txt);
            }
            if (txt.toUpperCase().indexOf(search_text) > -1) {
                table_rows[counter].style.backgroundColor = "#E8E8E8";
                found = true;
                table_rows[counter].style.display = "";
                //console.log("cell: " + j + " row: " + counter);
            } else {
                table_rows[counter].style.display = "none";
            }
        }
    } else {
        for (var j = 0; j < table_rows.length; j++) {
            table_rows[j].style.display = "";
            table_rows[j].style.backgroundColor = "white";
        }
    }
});

/*search_button.addEventListener('click', () => {
    console.log('Search clicked');
    var search_text = search_bar.value.toUpperCase();
    var table_rows = patient_table.getElementsByTagName("tr");
    var found = false;
    var counter = 0;
    //Initialising the colors: change this when the css are set.
    for (var i = 1; i < table_rows.length; i++) {
        table_rows[i].style.backgroundColor = "white";
    }
    //Running the search
    if (search_text != "") {
        while (found == false && counter < table_rows.length) {
            var table_data = table_rows[counter].getElementsByTagName("td");
            for (var j = 0; j < table_data.length - 1; j++) {
                var txt = table_data[j].text_content || table_data[j].innerText;
                if (txt.toUpperCase().indexOf(search_text) > -1) {
                    table_rows[counter].style.backgroundColor = "#E8E8E8";
                    found = true;
                    console.log("cell: " + j + " row: " + counter);
                }
            }
            counter = counter + 1;
        }
    }
});*/

window.addEventListener('load', () => {
    var id = setInterval(checkstatus, 100);
    document.getElementById("edit-patient-section").style.display = "none";
    //document.getElementById("list-patients-section").style.display = "none";
    document.getElementById("data-visualisation-section").style.display = "none";
    function checkstatus() {
        var db_status = database.getStatus();
        if (db_status === true) {
            clearInterval(id);
            //console.log("db successfully loaded!");
            document.getElementById("db-status").value = "DB erfolgreich geladen";
            //document.getElementById("db-status-list-patients").value = "db successfully loaded";
            document.getElementById("db-status-visualisation").value = "DB erfolgreich geladen";
            // ipcRenderer.send("db-loaded");
            // Fill the list of patients in the corresponding table
            patient_list = database.readAllPatients();
            if (patient_list === null) {
                //console.log("No Changes!");
            } else {
                fill_table(patient_list, patient_table);
                //var next_table = document.getElementById("list-of-patients").getElementsByTagName('TBODY')[0];
                //fill_table(patient_list, next_table);
                next_table = document.getElementById("patients-table-navigation").getElementsByTagName('TBODY')[0];
                init_table_values(next_table);
                fill_table(patient_list, next_table);
            }
            document.getElementById("edit-patient-section").style.display = "block";
            //document.getElementById("list-patients-section").style.display = "block";
            document.getElementById("data-visualisation-section").style.display = "block";
        } else {
            //console.log("db is still loading!");
            document.getElementById("db-status").value = "DB lädt ..."
            //document.getElementById("db-status-list-patients").value = "db loading ..."
            document.getElementById("db-status-visualisation").value = "DB lädt ..."
            //ipcRenderer.send("db_loading");
        }
    }
});
