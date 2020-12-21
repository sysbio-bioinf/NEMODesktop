const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const fs = require('fs');
const database = require(path.resolve(__dirname, "../../database"));
const loki = require("lokijs");

var table = document.getElementById("pdf-preset-table");

var global_chart_status = [];
var global_arg = null;

var selectList = document.getElementById("presetSelect");

function fillTable(chart_status,legend_names) {
  var cnt = 0;
  // fill table
  for(var i = 0; i < table.rows.length; i++)
  {
    // cells
    for(var j = 0; j < table.rows[i].cells.length; j++)
    {
        if(cnt < legend_names.length) {
            if(chart_status[cnt]) {
              table.rows[i].cells[j].innerHTML = '<s>' +legend_names[cnt] +'</s>';
            }else {
              table.rows[i].cells[j].innerHTML = legend_names[cnt];
            }
        }
        else {
          table.rows[i].cells[j].innerHTML = "";
        }
        cnt++;
    }
  }
} 

ipcRenderer.on('pdf-data', async (event,arg) => {
        /* var id = document.getElementById("tid");
        id.innerHTML = arg[4];
        var fname = document.getElementById("tfname");
        fname.innerHTML = arg[5];
        var lname = document.getElementById("tlname");
        lname.innerHTML = arg[6];
        var bdate = document.getElementById("tbdate");
        bdate.innerHTML = arg[7];*/

        var pdfPresetsDB = arg[arg.length-1];
        console.log(pdfPresetsDB);

        for (var i = 0; i < pdfPresetsDB.length; i++) {
          var presetName = pdfPresetsDB[i].name;
          var el = document.createElement("option");
          el.textContent = presetName;
          el.value = presetName;
          selectList.appendChild(el);
        }

        var chart_status = arg[arg.length-3]; 
        global_chart_status = chart_status;

        var legend_names = arg[arg.length-2];

        fillTable(chart_status,legend_names);

        //var tmp = database.readEntries(pid);
        var tmp = arg[0];
        //var tmp_visit = database.readVisits(pid);
        var tmp_visit = arg[1];
        //var tmp_medUpdate = database.readMedUpdates(pid);
        var tmp_medUpdate = arg[2];
        var anzeige = arg[3];

        console.log(arg);

        global_arg = arg;     
});

ipcRenderer.on('sendPDFPresets', async (event,arg) => {
  var pdfPresetsDB = arg;
  global_arg[global_arg.length-1] = pdfPresetsDB;

  while(selectList.length > 1) {
    selectList.removeChild(selectList.lastChild);
  }
  
  for (var i = 0; i < pdfPresetsDB.length; i++) {
    var presetName = pdfPresetsDB[i].name;
    var el = document.createElement("option");
    el.textContent = presetName;
    el.value = presetName;
    selectList.appendChild(el);
  }
});

// Opens up new window for new PDF preset when this button is pressed
const new_preset_button = document.getElementById("pdf-preset-new-preset");
new_preset_button.addEventListener('click', async () => {
    ipcRenderer.send('new-pdf-preset-window',global_arg);
});

selectList.addEventListener('change', async() => {
  var arg = global_arg;
  
  if("### Aktuelle Auswahl ###" == selectList.options[selectList.selectedIndex].value){ 
    var chart_status = arg[arg.length-3]; 
    global_chart_status = chart_status;

    var legend_names = arg[arg.length-2];
    fillTable(chart_status,legend_names);
    new_preset_button.style.visibility = "visible";
  }else {
    // fill table with presets from database => PDF Presets from database are in pdfPresetsDB
    var pdfPresetsDB = arg[arg.length-1];
    var pdfPreset = pdfPresetsDB[selectList.selectedIndex-1];
    var chart_status = [pdfPreset.general,pdfPreset.dia,pdfPreset.eat,pdfPreset.pain,pdfPreset.oral,
                        pdfPreset.appetite,pdfPreset.activity,pdfPreset.weightloss_beginning,pdfPreset.pnp,
                        pdfPreset.medication,pdfPreset.visit,pdfPreset.medication_update,pdfPreset.weightloss_last]; //TODO new questions here
    var legend_names = arg[arg.length-2];
    fillTable(chart_status, legend_names);
    new_preset_button.style.visibility = "hidden";
  } 

  console.log(global_arg);
});

const close_window_button = document.getElementById("pdf-preset-close-window");
close_window_button.addEventListener('click', async () => {
    while(selectList.length > 1) {
      selectList.removeChild(selectList.lastChild);
    }
    ipcRenderer.send('hide-pdf-preset-window');
    
});

const pdf_export_button = document.getElementById("pdf-preset-export-pdf");
pdf_export_button.addEventListener('click', async () => {
  ipcRenderer.send("pdf-print-window",[global_arg,selectList.selectedIndex]);
  
});
