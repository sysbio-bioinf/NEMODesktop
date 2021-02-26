const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const fs = require('fs');
const database = require(path.resolve(__dirname, "../../database"));

var deviceID = "";
var chosen_table_id = 0;
var something_chosen = 0;
var patient_list = null;

ipcRenderer.on('deviceID-send', (event,arg) => {
    deviceID = arg[0];
    patient_list = arg[1];
    if (patient_list === null) {
        console.log("No Changes!");
    } else {
        fill_table(patient_list, patient_table);
        //var next_table = document.getElementById("list-of-patients").getElementsByTagName('TBODY')[0];
        //fill_table(patient_list, next_table);
        next_table = document.getElementById("apatients-table-list-device").getElementsByTagName('TBODY')[0];
        init_table_values(next_table);
        fill_table(patient_list, next_table);
    }
});

/*
ipcRenderer.on('response-to-devices', async (event,arg) => {
    patient_list = arg;
    if (patient_list === null) {
        console.log("No Changes!");
    } else {
        patient_list = arg;
        fill_table(patient_list, patient_table);
        //var next_table = document.getElementById("list-of-patients").getElementsByTagName('TBODY')[0];
        //fill_table(patient_list, next_table);
        next_table = document.getElementById("apatients-table-list-device").getElementsByTagName('TBODY')[0];
        init_table_values(next_table);
        fill_table(patient_list, next_table);
    }
});*/

const close_window_button = document.getElementById("device-list-close-window");
close_window_button.addEventListener('click', async () => {
    closeWindow();
    ipcRenderer.send('hide-device-window');
});

const save_device_button = document.getElementById("save-device");
save_device_button.addEventListener('click', async () => {
    const patient_name_device = document.getElementById("patient-name-device");
    if(patient_name_device.innerHTML == "Patient: ...") {
        alert("Bitte Patienten auswählen!"); 
    }else {
        console.log("deviceID: "+deviceID);
        console.log("pid: "+patient_list[chosen_table_id].id);
        var device = {
            uuid:deviceID,
            pid:patient_list[chosen_table_id].id
        };
        //database.addDevice(device);
        ipcRenderer.send('save-device',device);
        alert("UUID zum Patienten "+ patient_list[chosen_table_id].id + " gespeichert! \n"+
            "Bitte QR-Code erneut einlesen!");
        closeWindow();
        ipcRenderer.send('hide-device-window');
    }
});
/*
const new_patient_button = document.getElementById("new-patient-device");
new_patient_button.addEventListener('click', async () => {
    //closeWindow();
    ipcRenderer.send('show-new-patient-device',deviceID);
});
*/
const patient_table = document.getElementById("apatients-table-list-device").getElementsByTagName('TBODY')[0];

function fill_table(patient_list, specific_table) {
  try {
      if (!patient_list) {
          console.log('The returned list of participants is empty');
          console.log('updated ' + patient_list.length);
      } else {
          console.log("Number of patients: " + patient_list.length);
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
            console.log("Number of rows in the table: " + table_rows_length);
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
          console.log("Number of rows in the table: " + table_rows_length);
          r = 0;
          while (table_rows_length != 0) {
              patient_table.deleteRow(r);
              table_rows_length = table_rows_length - 1;
          }
      }
  } catch (error) {
      console.log(error.message);
  }
};

patient_table.addEventListener('click', async (event) => {
    chosen_table_id = event.target.closest('td').parentNode.rowIndex - 1;
    const patient_name_device = document.getElementById("patient-name-device");
    patient_name_device.innerHTML = 'Patient '+ patient_list[chosen_table_id].id +': '+ patient_list[chosen_table_id].firstname 
                                    +' ' +patient_list[chosen_table_id].lastname;
    something_chosen = 1;
});

const search_bar = document.getElementById("patients-search-bar-device");
search_bar.addEventListener('keyup', () => {
    var search_text = search_bar.value.toUpperCase();
    var table_rows = patient_table.getElementsByTagName("tr");
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

/*
window.addEventListener('load', () => {
    var id = setInterval(checkstatus, 100);
    function checkstatus() {
          var db_status = database.getStatus();
          if (db_status === true) {
              patient_list = database.readAllPatients();
              clearInterval(id);
              console.log("DB erfolgreich geladen!");
              // Fill the list of patients in the corresponding table
              if (patient_list === null) {
                console.log("No Changes!");
            } else {
                fill_table(patient_list, patient_table);
                //var next_table = document.getElementById("list-of-patients").getElementsByTagName('TBODY')[0];
                //fill_table(patient_list, next_table);
                next_table = document.getElementById("apatients-table-list-device").getElementsByTagName('TBODY')[0];
                init_table_values(next_table);
                fill_table(patient_list, next_table);
            }
              //ipcRenderer.send('get-patient-list-to-devices');
          } else {
              console.log("db is still loading!");
              
          }
      }
});*/

function closeWindow() {
    deviceID = "";
    chosen_table_id = 0;
    something_chosen = 0;
}