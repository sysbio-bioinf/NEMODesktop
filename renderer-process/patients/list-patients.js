//The following functions are used to handle the lokijs data.
//----------------------------------------------------------------------------------------------------
const electron = require('electron');
const database = require(path.resolve("./database"));
const { ipcRenderer } = require('electron');
const loki = require("lokijs");

/*window.addEventListener('load', () => {
  var id = setInterval(checkstatus,100);
  document.getElementById("list-patients-section").style.display = "none";
  function checkstatus () {
      var db_status = database.getStatus();
      if (db_status === true) {
          clearInterval(id);
          console.log("db successfully loaded!");
          document.getElementById("db-status-list-patients").value = "db successfully loaded"
          // Fill the list of patients in the corresponding table
          patient_list = database.readAllPatients();
          if (patient_list === null) {
              console.log("No Changes!");
          } else {
              fill_table(patient_list);
          }
          document.getElementById("list-patients-section").style.display = "block";
      }else{
          console.log("db is still loading!");
          document.getElementById("db-status-list-patients").value = "db loading ..."
      }
  }
});

ipcRenderer.on('db-loaded', function () {
  
});*/

var patient_list = null;
const patient_table = document.getElementById("list-of-patients").getElementsByTagName('TBODY')[0];
const list_button = document.getElementById("button-list-patients");
function fill_table(patient_list, specific_table) {
    console.log('status: ' + database.getStatus());
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
                cell.innerHTML = patient_list[i].birthdate;
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

list_button.addEventListener('click', () => {
  var tmp = database.readAllPatients();
  if (tmp != null){
    console.log('number of patients ' + tmp.length);
    //delete the old values and fill in the new ones
    delete_table_values();
    fill_table(tmp, patient_table);
  }
});

function delete_table_values() {
  try {
      if (patient_table !== null) {
          var table_rows_length = patient_table.getElementsByTagName("tr").length;
          console.log("Number of rows in the table: " + table_rows_length);
          r = 0;
          while (table_rows_length != 0) {
              patient_table.deleteRow(r);
              table_rows_length = table_rows_length - 1;
              console.log('remaining table rows: ' + table_rows_length);
          }
      }
  } catch (error) {
      console.log(error.message);
  }
}

//const search_button = document.getElementById("search-patients-button");
const search_bar = document.getElementById("search-patients");
search_bar.addEventListener('keyup', () => {
    console.log('Search clicked');
    var search_text = search_bar.value.toUpperCase();
    var table_rows = patient_table.getElementsByTagName("tr");
    console.log('number of table rows: ' + table_rows.length);
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

patient_table.addEventListener('click', (event) => {
  var target = event.target.closest('td');
  var table_row_index = target.parentNode.rowIndex - 1;
  var pid = patient_table.rows[table_row_index].cells[0].innerHTML;
  var pfname = patient_table.rows[table_row_index].cells[1].innerHTML;
  var plname = patient_table.rows[table_row_index].cells[2].innerHTML;
  var pbdate = patient_table.rows[table_row_index].cells[3].innerHTML;

  var data = {id: pid, fname: pfname, lname: plname, bdate: pbdate};
  ipcRenderer.send('edit-data', data);

  //console.log(pid + ' ' + pfname + ' ' + plname + ' ' + pbdate);


});

//----------------------------------------------------------------------------------------------------


//listPatientsButton.addEventListener('click', () => {
//  console.log('Patients:' + patients);
//});

//The following functions are used to handle the data corresponding to the patients save in JSON files.
//-----------------------------------------------------------------------------------------------------
/*const path2patients = "./patients/patients.json";
const list_button = document.getElementById("listPatientsButton");
function populate_table(){
    var fs = require("fs");
    var data_content = fs.readFileSync(path2patients, 'utf8', function(err, data){
      if (err) {
        throw err;
      }
    });
    var list = JSON.parse(data_content);
    //retrieve the headers of the table to be generated which corresponds to the keys of the JSON file
    var tmp = Object.values(list);
    var list = Object.keys(tmp[0][0]);
    var table = document.getElementById("patients-list");
    //header
    var table_header = table.insertRow(0);
    for (var i = 0; i < list.length; i++){
        var cell = table_header.insertCell(i);
        cell.innerHTML = "<h2>" + list[i] + "</h2>"; 
    }
    //data
    var data_entries = tmp[0];
    for (var i = 0; i < data_entries.length; i++){
      var table_row = table.insertRow(i+1);
      var values = Object.values(data_entries[i]);
      for (var j = 0; j < values.length; j++){
          var cell = table_row.insertCell(j);
          cell.innerHTML = values[j];
      }
    } 
}
list_button.addEventListener('click', () => {
  populate_table();
});

const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const list_table = document.getElementById("patients-list");
list_table.addEventListener('click', (event) => {
  var target = event.target.closest('td');
  var table_row_index = target.parentNode.rowIndex;
  var fname = list_table.rows[table_row_index].cells[0].innerHTML;
  var lname = list_table.rows[table_row_index].cells[1].innerHTML;
  var data = {firstname: fname,
              lastname: lname};
  ipcRenderer.send('edit-data', data);
});*/

//-----------------------------------------------------------------------------------------------------
