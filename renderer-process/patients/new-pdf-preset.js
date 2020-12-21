const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const fs = require('fs');
const database = require(path.resolve("database"));
const loki = require("lokijs");

var global_chart_status = [];
var global_arg = null;

ipcRenderer.on('new-pdf-preset', async (event,arg) => {
  console.log(arg);
  global_arg = arg;
});

var input_field = document.getElementById('input-preset-name');

ipcRenderer.on('new-pdf-confirmation', async (event,arg) => {
  if(arg == 0) {
    alert("PDF-Preset erfolgreich gespeichert");
    input_field.value = "";
    //neues Send an den ipcRenderer um PDF Presets zu updaten, neue Einträge direkt rein
    ipcRenderer.send('update-pdf-presets');
    ipcRenderer.send('hide-new-pdf-preset-window');
  }else if(arg == 1) {
    alert("Name des PDF-Presets bereits belegt");
  }else if(arg == 2) {
    alert("PDF-Preset mit diesen Einstellungen bereits vorhanden");
  }
});

/* 
ipcRenderer.on('pdf-data', async (event,arg) => {

        var pdfPresetsDB = await database.readPDFPresets();
        console.log(pdfPresetsDB);

        for (var i = 0; i < pdfPresetsDB.length; i++) {
          var presetName = pdfPresetsDB[i].name;
          var el = document.createElement("option");
          el.textContent = presetName;
          el.value = presetName;
          selectList.appendChild(el);
      }

        var chart_status = arg[arg.length-2]; 
        global_chart_status = chart_status;

        var legend_names = arg[arg.length-1];

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
 */
const close_window_button = document.getElementById("new-pdf-preset-close-window");
close_window_button.addEventListener('click', async () => {
    input_field.value = "";
    ipcRenderer.send('hide-new-pdf-preset-window');

});

const new_preset_button = document.getElementById("save-new-pdf-preset");
new_preset_button.addEventListener('click', async () => {
    if(input_field.value === "") {
      alert("PDF-Preset hat keinen Namen");
    }else {
      new_arg = {
        preset_name: input_field.value,
        preset_values: global_arg[global_arg.length-3],
        preset_names: global_arg[global_arg.length-2]
      };
      ipcRenderer.send('new-preset-to-DB',new_arg);  // -> main.js
    }
  
});