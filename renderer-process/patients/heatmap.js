//The following functions are used to handle the data corresponding to the patients save in JSON files.
//-----------------------------------------------------------------------------------------------------
const electron = require('electron');
const path = require('path');
const fs = require('fs');
const chartjs = require('chart.js');
const database = require(path.resolve(__dirname,"../../database"));
const loki = require("lokijs");
const chartjszoom = require('chartjs-plugin-zoom');
const vizRenderer = require('electron').ipcRenderer

var test = null;

var patient_list = null;
const patient_table_nav = document.getElementById("patients-table-navigationHeat").getElementsByTagName('TBODY')[0];
const list_button_nav = document.getElementById("open-heatmap-view");

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
                var str = patient_list[i].birthdate;
                var dmy = str.split("-");
                cell.innerHTML = dmy[2]+"."+dmy[1]+"."+dmy[0];
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

list_button_nav.addEventListener('click', () => {
    console.log("updating...");
    //database.databaseInit();
    var tmp = database.readAllPatients();
    if (tmp != null) {
        console.log('number of patients ' + tmp.length);
        //delete the old values and fill in the new ones
        delete_table_values();
        console.log("data for navifation panel length " + tmp.length);
        fill_table(tmp, patient_table_nav);
	
    }
});

function delete_table_values() {
    try {
        if (patient_table_nav !== null) {
            var table_rows_length = patient_table_nav.getElementsByTagName("tr").length;
            console.log("Number of rows in the table: " + table_rows_length);
            r = 0;
            while (table_rows_length != 0) {
                patient_table_nav.deleteRow(r);
                table_rows_length = table_rows_length - 1;
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

function comment_splitter(comment, line_length) {
    var comment_splitted = ["Kommentar: "];
    while (comment.length > line_length) {
        var tmp = comment.substring(0, line_length).lastIndexOf(' ');
        if (tmp < 0) {
            tmp = line_length;
        }
        comment_splitted.push(comment.substring(0, tmp));
        comment = comment.substring(tmp + 1);
    }
    comment_splitted.push(comment);
    return comment_splitted;
}

//const search_button = document.getElementById("search-button");
const search_bar = document.getElementById("patients-search-barHeat");

search_bar.addEventListener('keyup', () => {
    console.log('Search clicked');
    var search_text = search_bar.value.toUpperCase();
    var table_rows = patient_table_nav.getElementsByTagName("tr");
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

//-define a variable saving the last row clicked in the table in order to update the chart when the checkbox is clicked-
// var actual_event = null;
//----------------------------------------------------------------------------------------------------------------------

patient_table_nav.addEventListener('click', async (event) => {
    //fill_chart(event.target.closest('td').parentNode.rowIndex - 1);
    table_row_index = event.target.closest('td').parentNode.rowIndex - 1;
    // actual_event = event;
    //sessionStorage.setItem('ActualRow', table_row_index.toString());
    var pid = patient_table_nav.rows[table_row_index].cells[0].innerHTML;
    var pfname = patient_table_nav.rows[table_row_index].cells[1].innerHTML;
    var plname = patient_table_nav.rows[table_row_index].cells[2].innerHTML;
    document.getElementById("patient-nameHeat").innerHTML = 'Patient ' + pid + ': ' + pfname + ' ' + plname;

    var ent = await database.readPidEntries(pid);
    var vis = await database.readPidVisits(pid);
    var medup = await database.readPidMedUpdates(pid);

    // Create heatmap
    //console.log(ent[0]); console.log(vis[0]); console.log(medup[0]);
    var diary_data = {
        entry: ent,
        visit: vis,
        medupdate: medup
    };
    var heatmap_data = build_heatmap_data(diary_data);
    var heatmap_html = build_heatmap_html(heatmap_data, "full");
    console.log(heatmap_html);
    heatmap_html = build_heatmap_html(heatmap_data, "last");
    document.getElementById("heatmapTable").innerHTML = heatmap_html;
    console.log(heatmap_html);

});

var anzeige = document.getElementById("data_display");
anzeige.addEventListener('click', () => {
    var actual_row = parseInt(sessionStorage.getItem('ActualRow'));
    if (!isNaN(actual_row)) {
        fill_chart(actual_row);
    }
})

var hide_data = document.getElementById("hide_data");
hide_data.addEventListener('click', () => {
    //Daten ausblenden
    Chart.helpers.each(Chart.instances, function (instance) {
        var ci = instance.chart
        for (var i = 0; i < chart_status.length; i++) {
            var meta = ci.getDatasetMeta(i);
            ci.data.datasets[i].hidden = true;
            meta.hidden = ci.data.datasets[i].hidden;
            chart_status[i] = true;
            //alert('Current Status: ' + ci.data.datasets[i].hidden);
        }
        ci.update();
    });
})

var show_data = document.getElementById("show_data");
show_data.addEventListener('click', () => {
    //Daten einblenden
    Chart.helpers.each(Chart.instances, function (instance) {
        var ci = instance.chart
        for (var i = 0; i < chart_status.length; i++) {
            var meta = ci.getDatasetMeta(i);
            ci.data.datasets[i].hidden = false;
            meta.hidden = null;
            chart_status[i] = false;
            //alert('Current Status: ' + ci.data.datasets[i].hidden);
        }
        ci.update();
    });
})


// Build heatmap data
function build_heatmap_data(diary_data) {
    var heatmap_data = {};
    if (diary_data) {
        const data_types = Object.keys(diary_data);
        for (var i = 0; i < data_types.length; i++) {
            const data_type = data_types[i];
            console.log("DEBUG: parsing diary data of type " + data_type);
            const type_data = diary_data[data_type];
            for (var j = 0; j < type_data.length; j++) {
                const data = type_data[j];
                var timestamp = new Date();
                if (data_type == "visit") {
                    timestamp = new Date(data["visit_date"]);
                } else {
                    timestamp = new Date(data["idate"]);
                }
                data.data_type = data_type;
                data.timestamp = timestamp;
                const day = timestamp.getDate();
                const month = 1 + timestamp.getMonth();
                const year = timestamp.getFullYear();
                const hours = timestamp.getHours();
                const minutes = timestamp.getMinutes();
                const seconds = timestamp.getSeconds();
                const time = ((timestamp.getHours() >= 10) ? timestamp.getHours() : "0" + timestamp.getHours()) + ":" +
                ((timestamp.getMinutes() >= 10) ? timestamp.getMinutes() : "0" + timestamp.getMinutes()) + ":" +
                ((timestamp.getSeconds() >= 10) ? timestamp.getSeconds() : "0" + timestamp.getSeconds());
                if (!heatmap_data[year]) {
                    heatmap_data[year] = {};
                }
                if (!heatmap_data[year][month]) {
                    heatmap_data[year][month] = {};
                }
                if (!heatmap_data[year][month][day]) {
                    heatmap_data[year][month][day] = {};
                }
                if (heatmap_data[year][month][day][time]) {
                    console.log("WARNING: duplicate timestamp '" + timestamp + "' at entry number " + j + " of type " + data_type + " - keeping only last one");
                }
                heatmap_data[year][month][day][time] = data;
                //if (j==0) { console.log(timestamp); console.log(day,month,year,time); }
            }
        }
        //console.log(heatmap_data);

        var entries_by_timestamp = [];
        var index = 0;
        const years = Object.keys(heatmap_data).sort(function(a, b) { return parseInt(a) - parseInt(b) });
        for (var i = 0; i < years.length; i++) {
            const year = years[i];
            console.log("DEBUG: processing year " + year + "...");
            const months = Object.keys(heatmap_data[year]).sort(function(a, b) { return parseInt(a) - parseInt(b) });
            for (var j = 0; j < months.length; j++) {
                const month = months[j];
                console.log("DEBUG:   processing month " + month + "...");
                const days = Object.keys(heatmap_data[year][month]).sort(function(a, b) { return parseInt(a) - parseInt(b) });
                for (var k = 0; k < days.length; k++) {
                    const day = days[k];
                    console.log("DEBUG:     processing day " + day + "...");
                    const times = Object.keys(heatmap_data[year][month][day]).sort();
            
                    for (var l = 0; l < times.length; l++) {
                        const time = times[l];
                        const entry = heatmap_data[year][month][day][time];
                        entries_by_timestamp.push(entry);
                    }
                }
            }
       }
    
       var first_weight = 0;
       var last_weight  = 0;
       var last_visit_weight = 0;
       var first_entry = true;
       for (var i=0; i<entries_by_timestamp.length; i++) {
           var entry = entries_by_timestamp[i];
           if (entry.data_type == "entry") {
               if (first_entry) { 
                  first_weight = parseFloat(entry.weight);
                  last_visit_weight = first_weight;
                  first_entry = false;
               }
               last_weight = entry.weight;

               // weight difference related to first visit
               var weight_diff = parseFloat(entry.weight) - first_weight;
               diff_percent = 100;
               if (first_weight != 0) {
                   diff_percent = (Math.abs(weight_diff) / first_weight) * 100;
               }
               //console.log("DEBUG: i=" + i + "  weight=" + entry.weight + "  first=" + first_weight + "  diff=" + weight_diff);
               if (weight_diff <= 0) {
                   //Weight Loss
                   if (diff_percent >= 5 && diff_percent < 10) {
                       entry.weight_first = 1;
                   } else if (diff_percent >= 10 && diff_percent < 20) {
                       entry.weight_first= 2;
                   } else if (diff_percent >= 20) {
                       entry.weight_first = 3;
                   } else if (diff_percent < 5) {
                       entry.weight_first = 0;
                   }
               } else {
                   //Weight Gain
                   entry.weight_first = 0;
               }
             
               // weight difference related to last visit
               weight_diff = parseFloat(entry.weight) - last_visit_weight;
               var diff_percent = 100;
               if (last_visit_weight != 0) {
                   diff_percent = (Math.abs(weight_diff) / last_visit_weight) * 100;
               }
               if (weight_diff <= 0) {
                   //Weight Loss
                   if (diff_percent >= 5 && diff_percent < 10) {
                       entry.weight_last = 1;
                   } else if (diff_percent >= 10 && diff_percent < 20) {
                       entry.weight_last= 2;
                   } else if (diff_percent >= 20) {
                       entry.weight_last = 3;
                   } else if (diff_percent < 5) {
                       entry.weight_last = 0;
                   }
               } else {
                   //Weight Gain
                   entry.weight_last = 0;
               }
           } else if (entry.data_type == "visit") {
               last_visit_weight = last_weight;
           }
       }

       console.log(heatmap_data);

        return heatmap_data;
    }
}

function toggle_value(value) {
    var new_value = "odd";
    if (value == "odd") {
        new_value = "even";
    }
    return new_value
}

function check_previous_day(year, month, day, last_year, last_month, last_day) {
    const current_timestamp = new Date(year, month - 1, day, 12, 0, 0);
    const last_timestamp = new Date(last_year, last_month - 1, last_day, 12, 0, 0);

    const current_epoch = current_timestamp.getTime();
    const last_epoch = last_timestamp.getTime();
    const prev_epoch = current_epoch - 86400000;   // current minus milliseconds per day: 24 * 60 * 60 * 1000
  
    var status = "no_gap";
    if (prev_epoch != last_epoch) {
      status = "gap";
    }
    //console.log("DEBUG: cur=" + current_timestamp + "  last=" + last_timestamp + "  last_epoch=" + last_epoch + "  prev_epoch=" + prev_epoch + "  status=" + status);
  
    return status;
  }
  

// Build heatmap HTML code
function build_heatmap_html(heatmap_data, heatmap_mode) {
    //var row_keys = ["general", "dia", "eat", "pain", "oral", "appetite", "pnp", "activity", "medication"];
    var row_keys = ["general", "dia", "eat", "pain", "oral", "appetite", "pnp", "fatigue", "weight_first", "weight_last", "activity", "medication", "hypertension", "eczema", "liver", "vision", "muscle", "joint", "breath", "exercise", "raceheart", "weight"];

    var monthNames = {
        '1': "Januar",
        '2': "Februar",
        '3': "März",
        '4': "April",
        '5': "Mai",
        '6': "Juni",
        '7': "Juli",
        '8': "August",
        '9': "September",
        '10': "Oktober",
        '11': "November",
        '12': "Dezember"
    };


    var info = {
        'dia': {
            'name': "Diarrhö",
            'type': "grade"
        },
        'activity': {
            'name': "Bewegung",
            'type': "gradeA"
        },
        'pnp': {
            'name': "PNP",
            'type': "grade"
        },
        'eat': {
            'name': "Erbrechen",
            'type': "grade"
        },
        'appetite': {
            'name': "Nahrungsaufnahme",
            'type': "grade"
        },
        'medication': {
            'name': "Bedarfsmedikation",
            'type': "gradeM"
        },
        'pain': {
            'name': "Schmerzen",
            'type': "grade"
        },
        'oral': {
            'name': "Mukositis Oral",
            'type': "grade"
        },
        'general': {
            'name': "Allgemeinbefinden",
            'type': "grade"
        },
        'fatigue': {
            'name': "Müdigkeit",
            'type': "grade"
        },
        'hypertension': {
            'name': "Bluthochdruck",
            'type': "grade"
        },
        'eczema': {
            'name': "Hautausschlag",
            'type': "grade"
        },
        'liver': {
            'name': "Gelbfärbung der Augen",
            'type': "grade"
        },
        'vision': {
            'name': "Sehstörungen",
            'type': "grade"
        },
        'raceheart': {
            'name': "Puls",
            'type': "cl"
        },
        'weight': {
            'name': "Gewicht",
            'type': "cl"
        },
        'weight_first': {
            'name': "Gewichtsverlust bzgl. erstem Arzttermin",
            'type': "grade"
        },
        'weight_last': {
            'name': "Gewichtsverlust bzgl. letztem Arzttermin",
            'type': "grade"
        },
        'muscle': {
            'name': "Muskelschmerzen",
            'type': "grade"
        },
        'joint': {
            'name': "Gelenkschmerzen",
            'type': "grade"
        },
        'breath': {
            'name': "Atemnot",
            'type': "grade"
        },
        'exercise': {
            'name': "Körperliche Belastbarkeit",
            'type': "grade"
        },
        'visit': {
            'name': "Arzttermin"
        },
        'medupdate': {
            'name': "Änderung der Medikation"
        }
    };

    const table_start = '<table class="heatmap">\n';
    //const header_table_start = '<table class="heatmap" style="position: fixed; top: 8em; left: 0.5em;">\n';
    const table_end = '</table>\n';
    const row_start = '<tr>\n';
    const row_end = '</tr>\n';

    const rows = {
        'time': [row_start, '<th class="empty"></th>'],
        'day': [row_start, '<th class="empty"></th>'],
        'month': [row_start, '<th class="empty"></th>'],
        'year': [row_start, '<th class="empty"></th>']
    };

    const header_rows = {};
    for (var i = 0; i < row_keys.length; i++) {
        const row_key = row_keys[i];
        //console.log("DEBUG: row_key=" + row_key);
        rows[row_key] = [row_start, '<th>' + info[row_key]['name'] + '</th>'];
        header_rows[row_key] = [row_start, '<th>' + info[row_key]['name'] + '</th>'];
    }

    var cell = "";
    const colspans = {};
    const bg_class = {
        'year': "odd",
        'month': "odd",
        'time': "odd"
    };

    var first_entry = true;
    var last_day = "";
    var last_month = "";
    var last_year = "";

    const years = Object.keys(heatmap_data).sort(function(a, b) { return parseInt(a) - parseInt(b) });
    for (var i = 0; i < years.length; i++) {
        const year = years[i];
        console.log("DEBUG: processing year " + year + "...");
        colspans['year'] = 0;
        const months = Object.keys(heatmap_data[year]).sort(function(a, b) { return parseInt(a) - parseInt(b) });
        for (var j = 0; j < months.length; j++) {
            const month = months[j];
            console.log("DEBUG:   processing month " + month + "...");
            colspans['month'] = 0;
            const days = Object.keys(heatmap_data[year][month]).sort(function(a, b) { return parseInt(a) - parseInt(b) });
            for (var k = 0; k < days.length; k++) {
                const day = days[k];
                console.log("DEBUG:     processing day " + day + "...");
                const all_times = Object.keys(heatmap_data[year][month][day]).sort();
                var times = all_times;

                if (heatmap_mode == "last") {   // include only last entry per day, visits and medupdates
                    var indexes = [];
                    var lastEntryIndex = -1;
                    times = [];
                    for (var l = 0; l < all_times.length; l++) {
                        const time = all_times[l];
                        const entry = heatmap_data[year][month][day][time];
                        console.log("DEBUG: month=" + month + "  day=" + day + "  time=" + time + "  l=" + l + "  type=" + entry.data_type);
                        if (entry.data_type == "entry") {
                            lastEntryIndex = l;
                        } else {
                            indexes.push(l);
                        }
                    }
                    if (lastEntryIndex >= 0) {
                        console.log("DEBUG:   adding lastIndex " + lastEntryIndex);
                        indexes.push(lastEntryIndex);
                    }
                    const indexesSorted = indexes.sort(function(a, b) { return parseInt(a) - parseInt(b) });
                    for (var l = 0; l < indexesSorted.length; l++) {
                        console.log("DEBUG:   adding time " + all_times[indexesSorted[l]]);
                        times.push(all_times[indexesSorted[l]]);
                    }
                }
                colspans['day'] = times.length;
                colspans['month'] += colspans['day'];

                var day_class = "day";
                if (!first_entry) {
                    if (check_previous_day(year, month, day, last_year, last_month, last_day) == "gap") {
                        day_class = "gapday";
                        colspans['day'] += 1;
                        colspans['month'] += 1;
                        for (var l = 0; l < row_keys.length; l++) {
                            const row_key = row_keys[l];
                            var cell_class = "gap";
                            cell = '<td class="' + cell_class + '"></td>';
                            rows[row_key].push(cell);
                        }
                        var title = "";
                        cell = '<td class="gap" title="' + title + '"></td>';
                        rows['time'].push(cell);
                    }
                } else {
                    first_entry = false;
                }
                last_year = year;
                last_month = month;
                last_day = day;

                for (var l = 0; l < times.length; l++) {
                    const time = times[l];
                    const entry = heatmap_data[year][month][day][time];

                    for (var m = 0; m < row_keys.length; m++) {
                        const row_key = row_keys[m];
                        var cell_class = info[row_key]['type'] + entry[row_key];
                        var title = entry[row_key];
                        if (entry.data_type != "entry") {
                            cell_class = entry.data_type;
                            title = info[entry.data_type]['name'];
                        } else {
                            if (row_key == "raceheart" || row_key == "weight") {
                                var interval = parseInt(entry[row_key] / 5);
                                if (interval > 60) {
                                    interval = 60;
                                } else if (interval < 0) {
                                    interval = 0;
                                }
                                cell_class = "cl" + interval;
                                if (!interval) {
                                    cell_class = "gradeundefined";
                                    //console.log("DEBUG:    class undefined");
                                }
                                //console.log("DEBUG: val=" + entry[row_key] + "  interval=" + interval + "  class=" + cell_class);
                            }
                        }
                        cell = '<td class="' + cell_class + '" title="' + title + '"></td>';
                        rows[row_key].push(cell);
                    }
                    var title = entry['timestamp'] + "\n" + entry['comments'];
                    cell = '<td class="time ' + bg_class['time'] + '" title="' + title + '"><div class="time">' + time.substr(0,5) + '</div></td>';
                    rows['time'].push(cell);
                }
                cell = '<td class="' + day_class + ' ' + bg_class['time'] + '" colspan="' + colspans['day'] + '">' + day + '</td>';
                rows['day'].push(cell);
                bg_class['time'] = toggle_value(bg_class['time']);
            }
            colspans['year'] += colspans['month'];
            cell = '<td class="month ' + bg_class['month'] + '" style="" colspan="' + colspans['month'] + '" title="' + monthNames[month] + '">' + monthNames[month] + '</td>';
            rows['month'].push(cell);
            bg_class['month'] = toggle_value(bg_class['month']);
        }
        cell = '<td colspan="' + colspans['year'] + '" title="' + year + '">' + year + '</td>';
        rows['year'].push(cell);
        bg_class['year'] = toggle_value(bg_class['year']);
    }

    var legend = '<table class="heatmap">\n\
   <tr>\n\
     <td class="grade0">Grad 0</td>\n\
     <td class="grade1">Grad 1</td>\n\
     <td class="grade2">Grad 2</td>\n\
     <td class="grade3" style="color: white;">Grad 3</td>\n\
     <td class="gradeA0">Keine Bewegung</td>\n\
     <td class="gradeA1">Bewegung</td>\n\
     <td class="gradeM0">Keine Bedarfs-Medikation</td>\n\
     <td class="gradeM1" style="color: white;">Bedarfs-Medikation</td>\n\
     <td class="visit" style="color: white;">Arzttermin</td>\n\
     <td class="medupdate" style="color: white;">Änderung der Medikation</td>\n\
     <td class="gradeundefined">Undefiniert</td>\n\
   </tr>\n\
</table>\n\
';
  //console.log(legend);

  var legend2 = '<table class="heatmap">\n\
  <tr>\n\
  <th style="background-color: white;">Zahlenwerte 0-300 (Puls, Gewicht): </th>\n\
  <td class="cl0" title="0-4"> </td>\n\
  <td class="cl1" title="5-9"> </td>\n\
  <td class="cl2" title="10-14"> </td>\n\
  <td class="cl3" title="15-19"> </td>\n\
  <td class="cl4" title="20-24"> </td>\n\
  <td class="cl5" title="25-29"> </td>\n\
  <td class="cl6" title="30-34"> </td>\n\
  <td class="cl7" title="35-39"> </td>\n\
  <td class="cl8" title="40-44"> </td>\n\
  <td class="cl9" title="45-49"> </td>\n\
  <td class="cl10" title="50-54"> </td>\n\
  <td class="cl11" title="55-59"> </td>\n\
  <td class="cl12" title="60-64"> </td>\n\
  <td class="cl13" title="65-69"> </td>\n\
  <td class="cl14" title="70-74"> </td>\n\
  <td class="cl15" title="75-79"> </td>\n\
  <td class="cl16" title="80-84"> </td>\n\
  <td class="cl17" title="85-89"> </td>\n\
  <td class="cl18" title="90-94"> </td>\n\
  <td class="cl19" title="95-99"> </td>\n\
  <td class="cl20" title="100-104"> </td>\n\
  <td class="cl21" title="105-109"> </td>\n\
  <td class="cl22" title="110-114"> </td>\n\
  <td class="cl23" title="115-119"> </td>\n\
  <td class="cl24" title="120-124"> </td>\n\
  <td class="cl25" title="125-129"> </td>\n\
  <td class="cl26" title="130-134"> </td>\n\
  <td class="cl27" title="135-139"> </td>\n\
  <td class="cl28" title="140-144"> </td>\n\
  <td class="cl29" title="145-149"> </td>\n\
  <td class="cl30" title="150-154"> </td>\n\
  <td class="cl31" title="155-159"> </td>\n\
  <td class="cl32" title="160-164"> </td>\n\
  <td class="cl33" title="165-169"> </td>\n\
  <td class="cl34" title="170-174"> </td>\n\
  <td class="cl35" title="175-179"> </td>\n\
  <td class="cl36" title="180-184"> </td>\n\
  <td class="cl37" title="185-189"> </td>\n\
  <td class="cl38" title="190-194"> </td>\n\
  <td class="cl39" title="195-199"> </td>\n\
  <td class="cl40" title="200-204"> </td>\n\
  <td class="cl41" title="205-209"> </td>\n\
  <td class="cl42" title="210-214"> </td>\n\
  <td class="cl43" title="215-219"> </td>\n\
  <td class="cl44" title="220-224"> </td>\n\
  <td class="cl45" title="225-229"> </td>\n\
  <td class="cl46" title="230-234"> </td>\n\
  <td class="cl47" title="235-239"> </td>\n\
  <td class="cl48" title="240-244"> </td>\n\
  <td class="cl49" title="245-249"> </td>\n\
  <td class="cl50" title="250-254"> </td>\n\
  <td class="cl51" title="255-259"> </td>\n\
  <td class="cl52" title="260-264"> </td>\n\
  <td class="cl53" title="265-269"> </td>\n\
  <td class="cl54" title="270-274"> </td>\n\
  <td class="cl55" title="275-279"> </td>\n\
  <td class="cl56" title="280-284"> </td>\n\
  <td class="cl57" title="285-289"> </td>\n\
  <td class="cl58" title="290-294"> </td>\n\
  <td class="cl59" title="295-299"> </td>\n\
  <td class="cl60" title="300"> </td>\n\
</tr>\n\
  </table>\n\
  <p style="margin: 0.5em;">Zeiträume ohne Tagebuch-Einträge sind durch einen vergrösserten Spalten-Abstand markiert und der auf die Lücke folgende Tag ist durch rote Schriftfarbe markiert.</p>\n\
  ';
  
    var page_start = '<!DOCTYPE html>\n\
    <html>\n\
      <head>\n\
        <title>Heatmap</title>\n\
        <meta charset="UTF-8"/>\n\
        <style>\n\
          table.heatmap {\n\
            text-align: center;\n\
            background-color: rgb(240,240,240);\n\
            border-color: black;\n\
            border: 0px solid rgb(128,128,128);\n\
            border-radius: 5px;\n\
            border-spacing: 0px;\n\
            border-collapse: collapse;\n\
            margin-top: 2em;\n\
            margin-bottom: 2em;\n\
            margin-left: 0.5em;\n\
            margin-right: 1.5em;\n\
	    width: auto;\n\
	    table-layout: auto;\n\
          }\n\
	  table.heatmap tbody {\n\
	    table-layout: auto;\n\
	  }\n\
	  table.heatmap tr {\n\
	    width: auto;\n\
	    table-layout: auto;\n\
	    display: table-row;\n\
	  }\n\
          table.heatmap td {\n\
	    border: 1px solid rgb(255,255,255);\n\
	    font-size: 12pt;\n\
	    width: auto;\n\
	  }\n\
          table.heatmap th {\n\
	    border: 1px solid rgb(255,255,255);\n\
	    padding-left: 5px;\n\
	    padding-right: 5px;\n\
	    white-space: nowrap;\n\
	    font-size: 12pt;\n\
	    width: auto;\n\
	  }\n\
          td.grade0 { background-color: rgb(169,255,76); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.grade1 { background-color: rgb(255,255,0); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.grade2 { background-color: rgb(255,165,0); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.grade3 { background-color: rgb(255,0,0); padding: 5px; border: 0px solid rgb(255,255,255);}\n\
          td.gradeA1 { background-color: rgb(147,210,79); padding: 5px; border: 0px solid rgb(255,255,255);}\n\
          td.gradeA0 { background-color: rgb(232,213,123); padding: 5px; border: 0px solid rgb(255,255,255);}\n\
          td.gradeM0 { background-color: rgb(160,215,255); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.gradeM1 { background-color: rgb(85,83,255); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.gradeundefined,td.gradenull { background-color: rgb(180,180,180); padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.visit { background-color: rgb(80,80,80); padding: 5px; border: 0px solid rgb(255,255,255);}\n\
          td.medupdate { background-color: rgb(128,72,184); padding: 5px; border: 0px solid rgb(255,255,255);}\n\
          td.time { padding-left: 0px; padding-right: 0px; padding-top: 15px; padding-bottom: 15px; font-size: 80%; }\n\
          td.even { background-color: rgb(240,240,240); }\n\
          td.odd { background-color: rgb(220,220,220); }\n\
          td.day { padding: 2px; padding-top: 4px; }\n\
          td.month { padding: 2px; padding-top: 4px; }\n\
          td.gap { min-width: 2px; background-color: rgb(255,255,255); }\n\
          td.gapday { padding: 2px; padding-top: 4px; color: red; font-weight: bold; }\n\
          td.cl0 { background-color: #F7EFFA; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl1 { background-color: #F6EBF8; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl2 { background-color: #F4E7F7; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl3 { background-color: #F2E3F6; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl4 { background-color: #F0DFF4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl5 { background-color: #EFDBF3; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl6 { background-color: #EDD7F1; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl7 { background-color: #ECD4F0; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl8 { background-color: #EAD0EF; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl9 { background-color: #E9CCED; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl10 { background-color: #E7C8EC; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl11 { background-color: #E6C4EA; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl12 { background-color: #E5C0E9; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl13 { background-color: #E3BDE7; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl14 { background-color: #E2B9E6; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl15 { background-color: #E1B5E4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl16 { background-color: #E0B2E2; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl17 { background-color: #DEAEE1; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl18 { background-color: #DDAADF; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl19 { background-color: #DCA6DE; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl20 { background-color: #DBA3DC; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl21 { background-color: #DA9FDA; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl22 { background-color: #D99CD9; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl23 { background-color: #D798D7; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl24 { background-color: #D594D4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl25 { background-color: #D491D2; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl26 { background-color: #D28DCF; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl27 { background-color: #D08ACD; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl28 { background-color: #CF86CA; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl29 { background-color: #CD83C8; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl30 { background-color: #CB7FC5; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl31 { background-color: #C87DC4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl32 { background-color: #C57AC2; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl33 { background-color: #C178C1; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl34 { background-color: #BD76BE; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl35 { background-color: #B974BB; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl36 { background-color: #B471B8; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl37 { background-color: #AF6FB4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl38 { background-color: #AA6DB1; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl39 { background-color: #A66BAE; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl40 { background-color: #A168AB; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl41 { background-color: #9D66A7; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl42 { background-color: #9864A4; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl43 { background-color: #9462A1; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl44 { background-color: #8F609E; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl45 { background-color: #8B5D9A; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl46 { background-color: #865B97; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl47 { background-color: #825994; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl48 { background-color: #7E5790; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl49 { background-color: #7A558D; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl50 { background-color: #76528A; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl51 { background-color: #715086; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl52 { background-color: #6D4E83; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl53 { background-color: #694C80; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl54 { background-color: #654A7C; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl55 { background-color: #614879; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl56 { background-color: #5E4576; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl57 { background-color: #5A4372; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl58 { background-color: #56416F; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl59 { background-color: #523F6C; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          td.cl60 { background-color: #4F3D68; padding: 5px; border: 0px solid rgb(255,255,255); }\n\
          th.empty { background-color: white; }\n\
          div.time { transform: rotate(-90deg); display: inline-block; }\n\
        </style>\n\
      </head>\n\
      <body>\n\
';
    //console.log(page_start);
    
    var page_end = '  </body>\n\
</html>';

    const skip_keys = ["time", "day", "month", "year"];

    row_keys.push("time");
    row_keys.push("day");
    row_keys.push("month");
    row_keys.push("year");

    var page = page_start + legend + table_start;
    for (var i = 0; i < row_keys.length; i++) {
        const row_key = row_keys[i];
        page += "\n" + rows[row_key].join("\n") + "\n" + row_end;
    }
    page += "\n" + table_end + legend2 + page_end;

    return page;
}

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
    //document.getElementById("add-patient-section").style.display = "none";
    function checkstatus() {
        var db_status = database.getStatus();
        if (db_status === true) {
            clearInterval(id);
            console.log("DB erfolgreich geladen!");
            //document.getElementById("db-status").value = "DB erfolgreich geladen";
            // ipcRenderer.send("db-loaded");
            // Fill the list of patients in the corresponding table
            patient_list = database.readAllPatients();
            if (patient_list === null) {
                console.log("No Changes!");
            } else {
                    var tmp = database.readAllPatients();
		    if (tmp != null) {
			console.log('number of patients ' + tmp.length);
			//delete the old values and fill in the new ones
			delete_table_values();
			console.log("data for navifation panel length " + tmp.length);
			fill_table(tmp, patient_table_nav);
		    }
            }
            //document.getElementById("add-patient-section").style.display = "block";
        } else {
            //console.log("db is still loading!");
            //document.getElementById("db-status").value = "DB lädt ..."
            //document.getElementById("db-status-list-patients").value = "db loading ..."
            //document.getElementById("db-status-visualisation").value = "DB lädt ..."
            //ipcRenderer.send("db_loading");
        }
    }
});
