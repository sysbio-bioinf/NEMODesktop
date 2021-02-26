
// const PatientService = require("../../main-process/patients/patient-service");

const { ipcRenderer } = require('electron');
const pclear = document.getElementById('pclear');
const psubmit = document.getElementById('psubmit');
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const isWindows = process.platform === "win32";

const { dialog } = require('electron').remote;

function patientId() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return "P-" + s4() + "-" + s4();
}

pclear.addEventListener('click', () => {
  //this specific function cancels the record and no new participant is added to the database
  document.getElementById('fname').value = "";
  document.getElementById('lname').value = "";
  document.getElementById('fname').placeholder = "Text eingeben ...";
  document.getElementById('lname').placeholder = "Text eingeben ...";
  document.getElementById('bdate').value = new Date();
});

psubmit.addEventListener('click', async () => {
  var fname = document.getElementById('fname').value;
  var lname = document.getElementById('lname').value;
  var bdate = document.getElementById('bdate').value;

  try{

    var input_state = 1;

    tmp = document.getElementById('fname');
    //console.log("trim does this " + tmp.value.trim());
    if (!tmp.value.trim()){
      input_state = 0;
      tmp.style.backgroundColor = 'red';
    }else{
      tmp.style.backgroundColor = 'white';
    }

    tmp = document.getElementById('lname');
    if (!tmp.value.trim()){
      input_state = 0;
      tmp.style.backgroundColor = "red";
    }else{
      tmp.style.backgroundColor = 'white';
    }
    
    tmp = document.getElementById('bdate');
    //console.log("trim does this " + tmp.value.trim());
    if (!tmp.value.trim()){
      input_state = 0;
      tmp.style.backgroundColor = "red";
    }else{
      tmp.style.backgroundColor = 'white';
    }

    if (input_state == 1){
      var new_patient = {id:database.generatePatientID(),
        firstname:fname,
        lastname:lname,
        birthdate:bdate};
        
      ipcRenderer.send('addPatientToDb',new_patient);
    }else{
      var options = {
        type: 'warning',
        title: "Information",
        buttons: ["Ok"],
        detail:"Bitte stellen Sie korrekte Eingaben zur Verfügung!",
        message: ''
      };
      dialog.showMessageBox(null,options);
      //alert('Bitte stellen Sie korrekte Eingaben zur Verfügung!');
    }

  }catch (error) {
    var options = {
      type: 'info',
      title: "Information",
      buttons: ["Ok"],
      detail:"Der Patient konnte nicht angelegt werden!",
      message: ''
    };
    dialog.showMessageBox(null,options);
    //alert("Der Patient konnte nicht angelegt werden!");
  }

});


const search_fname = document.getElementById("fname");
const search_lname = document.getElementById("lname");
//const search_bdate = document.getElementById("bdate");
var patient_list = null;
const patient_table = document.getElementById("apatients-table-list").getElementsByTagName('TBODY')[0];



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
              //US Date format from database to German date format 
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

ipcRenderer.on('patientAddedConfirm', function(event,arg) {
  var options = {
    type: 'info',
    title: "Information",
    buttons: ["Ok"],
    detail:"Der Patient wurde erfolgreich angelegt!",
    message: ''
  };
  dialog.showMessageBox(null,options);
  //alert("Der Patient wurde erfolgreich angelegt!");
  tmp = document.getElementById('fname');
  tmp.value = "";
  tmp.placeholder = "Text eingeben ...";
  tmp = document.getElementById('lname');
  tmp.value = "";
  tmp.placeholder = "Text eingeben ...";
  tmp = document.getElementById('bdate');
  tmp.value = "";
  tmp.placeholder = "Text eingeben ...";
  delete_table_values();
  var patient_list = arg;
  fill_table(patient_list, patient_table);
});

ipcRenderer.on('patientAddConfirmEdit', function(event,arg) {
  delete_table_values();
  var patient_list = arg;
  fill_table(patient_list,patient_table);
});

// filter function in table for first/last name fields
[search_fname, search_lname].forEach(function(element) {
  element.addEventListener('keyup', () => {
    //console.log('Search clicked');
    var search_text = element.value.toUpperCase();
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
} );

// addPatient().then(exit);

//add a patient to db table
//var patient = new Patient();
/* function addPatient(patient) {
  patient.set("patient_id", patientId());
  patient.set("name", "Joe");
  patient.set("insurance_card_nr", "dkfjdkfj100");
  patient.set("notice", "Bla bla bla ...");
  patient.set("recorded_on", "29.10.2018");

  patient.save().then(function (u) {
    console.log("patient saved", u.get("name"));
  });
}
*/

window.addEventListener('load', () => {
  /*
    var id = setInterval(checkstatus, 100);
    
    function checkstatus() {
        var db_status = database.getStatus();
        if (db_status === true) {
            clearInterval(id);
            console.log("db successfully loaded!");
            // Fill the list of patients in the corresponding table
            patient_list = database.readAllPatients();
            if (patient_list === null) {
                console.log("No Changes!");
            } else {
                fill_table(patient_list, patient_table);
                next_table = document.getElementById("patients-table-navigation").getElementsByTagName('TBODY')[0];;
                fill_table(patient_list, next_table);
            }
        } else {
            console.log("db is still loading!");
            
        }
    }
  */

    var id = setInterval(checkstatus, 100);
    document.getElementById("add-patient-section").style.display = "none";
    function checkstatus() {
        var db_status = database.getStatus();
        if (db_status === true) {
            clearInterval(id);
            //console.log("DB erfolgreich geladen!");
            document.getElementById("db-status").value = "DB erfolgreich geladen";
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
            document.getElementById("add-patient-section").style.display = "block";
        } else {
            //console.log("db is still loading!");
            document.getElementById("db-status").value = "DB lädt ..."
            //document.getElementById("db-status-list-patients").value = "db loading ..."
            document.getElementById("db-status-visualisation").value = "DB lädt ..."
            //ipcRenderer.send("db_loading");
        }
    }
});
