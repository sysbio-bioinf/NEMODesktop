//The following functions are used to handle the data corresponding to the patients save in JSON files.
//-----------------------------------------------------------------------------------------------------
const electron = require('electron');
const {dialog} = require("electron").remote;
const path = require('path');
const fs = require('fs');
const chartjs = require('chart.js');
const database = require(path.resolve(__dirname,"../../database"));
const loki = require("lokijs");
const chartjszoom = require('chartjs-plugin-zoom');
const vizRenderer = require('electron').ipcRenderer;

var test = null;

var patient_list = null;
const patient_table_nav = document.getElementById("patients-table-navigation").getElementsByTagName('TBODY')[0];
const list_button_nav = document.getElementById("open-patient-view");
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
const search_bar = document.getElementById("patients-search-bar");

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

//------------------define a variable saving the status of all charts to be displayed-----------------------
var chart_status = [];
for (var s = 0; s < 23; s++) {
    chart_status.push(false);
}
//----------------------------------------------------------------------------------------------------------

//-define a variable saving the last row clicked in the table in order to update the chart when the checkbox is clicked-
// var actual_event = null;
//----------------------------------------------------------------------------------------------------------------------

patient_table_nav.addEventListener('click', (event) => {
    fill_chart(event.target.closest('td').parentNode.rowIndex - 1);
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
    var row_keys = ["general", "dia", "eat", "pain", "oral", "appetite", "pnp", "weight_first", "weight_last", "fatigue", "activity", "medication", "hypertension", "eczema", "liver", "vision", "muscle", "joint", "breath", "exercise", "raceheart", "weight"];

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
          }\n\
          table.heatmap td {\n\
            border: 1px solid rgb(255,255,255);\n\
          }\n\
          table.heatmap th {\n\
            border: 1px solid rgb(255,255,255);\n\
            padding-left: 5px;\n\
            padding-right: 5px;\n\
            white-space: nowrap;\n\
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

async function fill_chart(table_row_index) {

    //The following function is used to extract and display the corresponding data in the chart!

    // var target = event.target.closest('td');
    // var table_row_index = target.parentNode.rowIndex - 1;
    test = table_row_index;
    // actual_event = event;
    sessionStorage.setItem('ActualRow', table_row_index.toString());
    var pid = patient_table_nav.rows[table_row_index].cells[0].innerHTML;
    var pfname = patient_table_nav.rows[table_row_index].cells[1].innerHTML;
    var plname = patient_table_nav.rows[table_row_index].cells[2].innerHTML;
    var anzeige = document.getElementById("data_display");

    document.getElementById("patient-name").innerHTML = 'Patient ' + pid + ': ' + pfname + ' ' + plname;

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
    //console.log(heatmap_html);
    heatmap_html = build_heatmap_html(heatmap_data, "last");
    //console.log(heatmap_html);

    await Promise.all([ent, vis, medup]).then(function (results) {

        //var tmp = database.readEntries(pid);
        var tmp = results[0];
        //var tmp_visit = database.readVisits(pid);
        var tmp_visit = results[1];
        //var tmp_medUpdate = database.readMedUpdates(pid);
        var tmp_medUpdate = results[2];

        //Destroy all previously created charts
        Chart.helpers.each(Chart.instances, function (instance) {
            instance.chart.destroy();
        })

        //Initialize and use the canvas
        var canvas = document.getElementById("current-chart");
        var chart_canvas = canvas.getContext("2d");
        chart_canvas.clearRect(0, 0, canvas.width, canvas.height);

        if (tmp.length == 0) {
            console.log("Empty set of entries");
        } else {
            //console.log("Total entries: " + tmp.length);
            //console.log("Total visits: " + tmp_visit.length);
            //console.log("Total medication updates: " + tmp_medUpdate.length);
            //chart_canvas.clearRect(0, 0, canvas.width, canvas.height);

        //var jahr = []; var tag = []; var monat = []; var zeit = [];
	//CTCAE
        var pnp = []; var commentar = []; var medication = [];                                          //PNP   //Besonderheiten    //Bedarfsmedikation
        var gewicht = []; var bewegung = []; var appetite = []; var oral = []; var schmerz = [];        //aktuelles Gewicht //Bewgung   //Nahrungsaufnahme  //Mukositis oral    //Schmerzen
        var essen = []; var diarrhoe = []; var general = []; var datum = [];                            //Erbrechen     //Diarrhö       //Allgemeinbefinden     //Datum

	//Targeted tumor therapy
	var fatigue = []; var hypertension = []; var eczema = []; var liver = [];			//Muedigkeit	//Blutdruck	//Hautausschlag		//Gelbfaerbung der Augen
	var vision = []; var raceheart = []; var muscle = []; var joint = [];				//Sehstoerungen	//Puls		//Muskelschmerzen	//Gelenkschmerzen
	var breath = []; var exercise = [];								//Atemnot	//Koerperliche Belastbarkeit

        for (var i = 0; i < tmp.length; i++) {
          //jahr[i] = tmp[i].year;
          //monat[i] = tmp[i].month;
         //tag[i] = tmp[i].day;
         //zeit[i] = tmp[i].time;
	    // CTCAE
            pnp[i] = tmp[i].pnp;                    //PNP
            medication[i] = tmp[i].medication;      //Bedarfsmediaktion
            datum[i] = tmp[i].idate;                //Datum
            commentar[i] = tmp[i].comments;         //Besonderheiten
            gewicht[i] = tmp[i].weight;             //aktuelles Gewicht
            bewegung[i] = tmp[i].activity;          //Bewegung
            oral[i] = tmp[i].oral;                  //Mukositis oral
            schmerz[i] = tmp[i].pain;               //Schmerzen
            essen[i] = tmp[i].eat;                  //Erbrechen
            appetite[i] = tmp[i].appetite;          //Nahrungsaufnahme
            diarrhoe[i] = tmp[i].dia;               //Diarrhö
            general[i] = tmp[i].general;            //Allgemeinbefinden

            //Targeted tumor therapy
            fatigue[i] = tmp[i].fatigue;	    //Muedigkeit
            hypertension[i] = tmp[i].hypertension;  //Blutdruck
            eczema[i] = tmp[i].eczema;		    //Hautausschlag
            liver[i] = tmp[i].liver;		    //Gelbfaerbung der Augen
            vision[i] = tmp[i].vision;		    //Sehstoerungen
            raceheart[i] = tmp[i].raceheart;	    //Puls
            muscle[i] = tmp[i].muscle;		    //Muskelschmerzen
            joint[i] = tmp[i].joint;		    //Gelenkschmerzen
            breath[i] = tmp[i].breath;		    //Atemnot
            exercise[i] = tmp[i].exercise;	    //Koerperliche Belastbarkeit
        }


            //Normalizing the weight between 0 and 3 before ploting the results //Genereller Gewichtsverlust
            var weights = [];
            var w_0 = gewicht[0];
            for (var i = 0; i < gewicht.length; i++) {
                w = gewicht[i] - w_0;
                p = (Math.abs(w) / w_0) * 100;
                if (w <= 0) {
                    //Weight Loss
                    if (p >= 5 && p < 10) {
                        weights[i] = 1;
                    } else if (p >= 10 && p < 20) {
                        weights[i] = 2;
                    } else if (p >= 20) {
                        weights[i] = 3;
                    } else if (p < 5) {
                        weights[i] = 0;
                    }
                } else {
                    //Weight Gain
                    weights[i] = 0;
                }
            }


            //------------------------------------ Filtering the dates array --------------------------------------
            //console.log("All dates: " + datum);
            datum.sort(function (a, b) { return a - b });
            var tmp_dates = [];
            var tmp_cnt = 0;
            var total_dates = datum.length;
            //----------------------- Generate also tmp variables to store the data specific to each date ---------
	    // CTCAE
            var tmp_pnp = []; var tmp_medication = [];                  //PNP       //Bedarfmedikation
            var tmp_commentar = []; var tmp_weights = [];               //Besonderheiten    //Gewicht in Score
            var tmp_bewegung = []; var tmp_oral = [];                   //Bewegung          //Mukositis oral
            var tmp_schmerz = []; var tmp_essen = [];                   //Schmerzen         //Erbrechen
            var tmp_appetite = []; var tmp_diarrhoe = [];               //Nahrungsaufnahme     //Diarrhö
            var tmp_general = []; var tmp_gewicht = [];                 //Allgemeinbefinden     //Übermitteltes Gewicht in kg
	    // Targeted tumor therapy
	    var tmp_fatigue = []; var tmp_hypertension = []; var tmp_eczema = []; var tmp_liver = [];			//Muedigkeit	//Blutdruck	//Hautausschlag		//Gelbfaerbung der Augen
	    var tmp_vision = []; var tmp_raceheart = []; var tmp_muscle = []; var tmp_joint = [];				//Sehstoerungen	//Puls		//Muskelschmerzen	//Gelenkschmerzen
	    var tmp_breath = []; var tmp_exercise = [];								//Atemnot	//Koerperliche Belastbarkeit


            for (var i = 0; i < total_dates; i++) {
                //console.log("i " + i + "/" + total_dates)
                if (i == total_dates - 1) {

                    if (total_dates == 1) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);                       //PNP   //Bedarfsmedikation
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);                 //Besonderheiten    //Gewicht in Score
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);                         //Bewegung      //Mukositis oral
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);                         //Schmerzen     //Erbrechen
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);                 //Nahrungsaufnahme  //Diarrhö
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);                     //Allgemeinbefinden     //Übermitteltes Gewicht  

			tmp_fatigue.push(fatigue[i]); tmp_hypertension.push(hypertension[i]);		//Muedigkeit	//Blutdruck
			tmp_eczema.push(eczema[i]); tmp_liver.push(liver[i]);				//Hautausschlag	//Gelbfaerbung der Augen
			tmp_vision.push(vision[i]); tmp_raceheart.push(raceheart[i]);			//Sehstoerungen	//Puls
			tmp_muscle.push(muscle[i]); tmp_joint.push(joint[i]);				//Muskelschmerzen	//Gelenkschmerzen
			tmp_breath.push(breath[i]); tmp_exercise.push(exercise[i]);			//Atemnot	//Koerperliche Belastbarkeit
                    } else if ((new Date(datum[i - 1])).getDay() != (new Date(datum[i])).getDay()) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);                       //PNP       //Bedarfsmedikation
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);                 //Besonderheiten    //Gewicht in Score  
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);                         //Bewegung      //Mukositis oral
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);                         //Schmerzen     //Erbrechen
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);                 //Nahrungsaufnahme     //Diarrhö
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);                     //Allgemeinbefinden     //Übermitteltes Gewicht

			tmp_fatigue.push(fatigue[i]); tmp_hypertension.push(hypertension[i]);		//Muedigkeit	//Blutdruck
			tmp_eczema.push(eczema[i]); tmp_liver.push(liver[i]);				//Hautausschlag	//Gelbfaerbung der Augen
			tmp_vision.push(vision[i]); tmp_raceheart.push(raceheart[i]);			//Sehstoerungen	//Puls
			tmp_muscle.push(muscle[i]); tmp_joint.push(joint[i]);				//Muskelschmerzen	//Gelenkschmerzen
			tmp_breath.push(breath[i]); tmp_exercise.push(exercise[i]);			//Atemnot	//Koerperliche Belastbarkeit
                    } else if ((new Date(datum[i - 1])).getDay() == (new Date(datum[i])).getDay()) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);                       //PNP       //Bedarfsmedikation
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);                 //Besonderheiten    //Gewicht in Score 
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);                         //Bewegung      //Mukositis oral
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);                         //Schmerzen     //Erbrechen
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);                 //Nahrungsaufnahme  //Diarrhö
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);                     //Allgemeinbefinden //Übermitteltes Gewicht in kg

			tmp_fatigue.push(fatigue[i]); tmp_hypertension.push(hypertension[i]);		//Muedigkeit	//Blutdruck
			tmp_eczema.push(eczema[i]); tmp_liver.push(liver[i]);				//Hautausschlag	//Gelbfaerbung der Augen
			tmp_vision.push(vision[i]); tmp_raceheart.push(raceheart[i]);			//Sehstoerungen	//Puls
			tmp_muscle.push(muscle[i]); tmp_joint.push(joint[i]);				//Muskelschmerzen	//Gelenkschmerzen
			tmp_breath.push(breath[i]); tmp_exercise.push(exercise[i]);			//Atemnot	//Koerperliche Belastbarkeit
                    }
                } else {
                    d1 = (new Date(datum[i])).getDay();
                    d2 = (new Date(datum[i + 1])).getDay();
                    //console.log("day 1: " +d1 + " day 2: " + d2);
                    if (d1 == d2) {
                        tmp_cnt = i + 1;
                    } else {
                        tmp_dates.push(new Date(datum[tmp_cnt]));
                        tmp_pnp.push(pnp[tmp_cnt]); tmp_medication.push(medication[tmp_cnt]);           //PNP       //Bedarfsmedikation
                        tmp_commentar.push(commentar[tmp_cnt]); tmp_weights.push(weights[tmp_cnt]);     //Besonderheiten    //Gewicht in Score
                        tmp_bewegung.push(bewegung[tmp_cnt]); tmp_oral.push(oral[tmp_cnt]);             //Bewegung      //Mukositis oral
                        tmp_schmerz.push(schmerz[tmp_cnt]); tmp_essen.push(essen[tmp_cnt]);             //Schmerzen     //Erbrechen
                        tmp_appetite.push(appetite[tmp_cnt]); tmp_diarrhoe.push(diarrhoe[tmp_cnt]);     //Nahrungsaufnahme  //Diarrhö
                        tmp_general.push(general[tmp_cnt]); tmp_gewicht.push(gewicht[tmp_cnt]);         //Allgemeinbefinden  //Übermitteltes Gewicht in kg

                        tmp_fatigue.push(fatigue[i]); tmp_hypertension.push(hypertension[i]);		//Muedigkeit	//Blutdruck
                        tmp_eczema.push(eczema[i]); tmp_liver.push(liver[i]);				//Hautausschlag	//Gelbfaerbung der Augen
                        tmp_vision.push(vision[i]); tmp_raceheart.push(raceheart[i]);			//Sehstoerungen	//Puls
                        tmp_muscle.push(muscle[i]); tmp_joint.push(joint[i]);				//Muskelschmerzen	//Gelenkschmerzen
                        tmp_breath.push(breath[i]); tmp_exercise.push(exercise[i]);			//Atemnot	//Koerperliche Belastbarkeit
                        tmp_cnt = i + 1
                    }
                }
            }
            if (anzeige.checked == false) {
                datum = tmp_dates;
                pnp = tmp_pnp; medication = tmp_medication;         //PNP   //Bedarfsmedikation
                commentar = tmp_commentar; weights = tmp_weights;   //Besonderheiten        //Gewichtsumwandlung in Score
                bewegung = tmp_bewegung; oral = tmp_oral;           //Bewegung      //Mukositis oral
                schmerz = tmp_schmerz; essen = tmp_essen;           //Schmerzen     //Erbrechen
                appetite = tmp_appetite; diarrhoe = tmp_diarrhoe;   //Nahrungsaufnahme  //Diarrhö
                general = tmp_general; gewicht = tmp_gewicht;       //Allgemeinbefinden  //Übermitteltes Gewicht in kg

		fatigue = tmp_fatigue; hypertension = tmp_hypertension;	//Muedigkeit	//Blutdruck
		eczema = tmp_eczema; liver = tmp_liver;			//Hautausschlag	//Gelbfaerbung der Augen
		vision = tmp_vision; raceheart = tmp_raceheart;		//Sehstoerungen	//Puls
		muscle = tmp_muscle; joint = tmp_joint;			//Muskelschmerzen //Gelenkschmerzen
		breath = tmp_breath; exercise = tmp_exercise;		//Atemnot	//Koerperliche Belastbarkeit
            }


            //console.log("Data Collected: " + datum);
            //----------------------------------------------------------------------------------------------------

            // create a single array of dates and at the same time create a visits values array with null where no visit value is available
            var visit_date = [];
            var regular_visit = [];
            for (var i = 0; i < tmp_visit.length; i++) {
                visit_date[i] = new Date(tmp_visit[i].visit_date);
            }

            // do the same with the medication updates
            var medication_update = [];
            var medication_update_label = [];
            for (var i = 0; i < tmp_medUpdate.length; i++) {
                medication_update[i] = new Date(tmp_medUpdate[i].idate);
            }

            var all_dates = visit_date.concat(datum);
            all_dates = medication_update.concat(all_dates);
            for (var i = 0; i < all_dates.length; i++) {
                all_dates[i] = new Date(all_dates[i]);
            }
            all_dates.sort(function (a, b) { return a - b });

            var all_dates_labels = all_dates;

            var all_dates_tmp = Array(all_dates.length).fill(1).map( (_, i) => i+1 )

            var all_dates_ms = [];
            for (var i = 0; i < all_dates.length; i++) {
                all_dates_ms[i] = all_dates[i].getTime();
            }
            var visit_date_ms = [];
            for (var i = 0; i < visit_date.length; i++) {
                visit_date_ms[i] = visit_date[i].getTime();
            }
            var medication_update_ms = [];
            for (var i = 0; i < medication_update.length; i++) {
                medication_update_ms[i] = medication_update[i].getTime();
            }
            var datum_ms = [];
            for (var i = 0; i < datum.length; i++) {
                datum_ms[i] = (new Date(datum[i])).getTime();
            }

            

            var visit_date_data = [];
            for (var i = 0; i < all_dates_ms.length; i++) {
                var idx = visit_date_ms.indexOf(all_dates_ms[i]);
                if (idx < 0) {
                    regular_visit[i] = -1;
                    visit_date_data.push({
                        x: all_dates_tmp[i],
                        y: -1
                    });
                } else {
                    if (tmp_visit[idx].regular_visit == 0) {
                        regular_visit[i] = "Außerplanmäßiger Termin";
                    } else {
                        regular_visit[i] = "Regulärer Termin";
                    }
                    visit_date_data.push({
                        x: all_dates_tmp[i],
                        y: 3
                    });
                }
            }
            var medication_update_data = [];                                //Generelle Medikationsänderung
            for (var i = 0; i < all_dates_ms.length; i++) {
                var idx = medication_update_ms.indexOf(all_dates_ms[i]);
                if (idx < 0) {
                    medication_update_label[i] = -1;
                    medication_update_data.push({
                        x: all_dates_tmp[i],
                        y: -1
                    });
                } else {
                    medication_update_label[i] = "Medikation geändert";
                    medication_update_data.push({
                        x: all_dates_tmp[i],
                        y: 3
                    });
                }
            }

            var weight_loss = [];                               //Gewichtsverlust bzgl letztem Arztbesuch
            var wl_0 = gewicht[0];
            for (var i = 0; i < datum_ms.length; i++) {

                var suche = true;
                var cnt = 0;
                while (cnt < visit_date_ms.length && suche == true) {
                    if (visit_date_ms[cnt] <= datum_ms[i] && visit_date_ms[cnt + 1] >= datum_ms[i]) {
                        var goal = visit_date_ms[cnt];
                        for (var k = 0; k < i; k++) {
                            if (Math.abs(datum_ms[k] - goal) < Math.abs(datum_ms[0] - goal) && datum_ms[k] <= goal) {
                                wl_0 = gewicht[k];
                            }
                        }
                        suche = false;
                    } else if (visit_date_ms[cnt] > datum_ms[i]) {
                        suche = false;
                    }
                    cnt = cnt + 1;
                }
                var w = gewicht[i] - wl_0;
                var p = (Math.abs(w) / wl_0) * 100;
                if (w <= 0) {
                    //Weight Loss
                    if (p >= 5 && p < 10) {
                        weight_loss[i] = 1;
                    } else if (p >= 10 && p < 20) {
                        weight_loss[i] = 2;
                    } else if (p >= 20) {
                        weight_loss[i] = 3;
                    } else if (p < 5) {
                        weight_loss[i] = 0;
                    }
                } else {
                    //Weight Gain
                    weight_loss[i] = 0;
                }
            }

		//CTCAE
            var commentar_data = []; var gewicht_data = []; var weight_loss_data = [];                                          //Besonderheiten    //Gewicht am Tag    //Gewichtsverlust bzgl letztem Arzttermins
            var weights_data = []; var bewegung_data = []; var appetite_data = []; var oral_data = []; var schmerz_data = [];   //Gewichtsverlust bzgl erstem Arztbesuch    //Bewegung      //Nahrungsaufnahme  //Mukositis oral    //Schmerzen
            var essen_data = []; var diarrhoe_data = []; var general_data = []; var pnp_data = []; var medication_data = [];    //Erbrechen     //Diarrhö       //Allgemeinbefinden     //PNP       //Bedarfsmedikation    
		//Targeted tumor therapy
		var fatigue_data = []; var hypertension_data = []; var eczema_data = []; 					//Muedigkeit	//Blutdruck	//Hautausschlag
		var liver_data = []; var vision_data = []; var raceheart_data = [];						//Gelbfaerbung der Augen	//Sehstoerungen	//Puls
		var muscle_data = []; var joint_data = []; var breath_data = [];						//Muskelschmerzen	//Gelenkschmerzen	//Atemnot
		var exercise_data = [];												//Koerperliche Belastbarkeit
		
        all_dates = Array(all_dates.length).fill(1).map( (_, i) => i+1 );

            for (var i = 0; i < all_dates_ms.length; i++) {
                var idx = datum_ms.indexOf(all_dates_ms[i]);
                if (idx < 0) {
                    gewicht_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    weights_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    bewegung_data.push({            //Bewegung
                        x: all_dates[i],
                        y: null
                    })
                    appetite_data.push({            //Nahrungsaufnahme
                        x: all_dates[i],
                        y: null
                    });
                    oral_data.push({                //Mukositis oral
                        x: all_dates[i],
                        y: null
                    });
                    schmerz_data.push({             //Schmerzen
                        x: all_dates[i],
                        y: null
                    });
                    essen_data.push({               //Erbrechen
                        x: all_dates[i],
                        y: null
                    });
                    diarrhoe_data.push({            //Diarrhö
                        x: all_dates[i],
                        y: null
                    });
                    general_data.push({             //Allgemeinbefinden
                        x: all_dates[i],
                        y: null
                    });
                    commentar_data.push({           //Besonderheiten
                        x: all_dates[i],
                        y: null
                    });
                    pnp_data.push({                 //PNP
                        x: all_dates[i],
                        y: null
                    });
                    fatigue_data.push({		    //Muedigkeit
                    x: all_dates[i],
                    y: null
                    });
                    medication_data.push({          //Bedarfsmedikation
                        x: all_dates[i],
                        y: null
                    });
                    weight_loss_data.push({         //Gewichtsverlust bzgl. letztem Arzttermin
                        x: all_dates[i],
                        y: null
                    });
                    // Targeted tumor therapy
                    /*fatigue_data.push({		    //Muedigkeit
                    x: all_dates[i],
                    y: null
                    });*/
                    hypertension_data.push({	    //Blutdruck
                    x: all_dates[i],
                    y: null
                    });
                    eczema_data.push({		    //Hautausschlag
                    x: all_dates[i],
                    y: null
                    });
                    liver_data.push({		    //Gelbfaerbung der Augen
                    x: all_dates[i],
                    y: null
                    });
                    vision_data.push({		    //Sehstoerungen
                    x: all_dates[i],
                    y: null
                    });
                    raceheart_data.push({	    //Puls
                    x: all_dates[i],
                    y: null
                    });
                    muscle_data.push({	   	    //Muskelschmerzen
                    x: all_dates[i],
                    y: null
                    });
                    joint_data.push({	   	    //Gelenkschmerzen
                    x: all_dates[i],
                    y: null
                    });
                    breath_data.push({	   	    //Atemnot
                    x: all_dates[i],
                    y: null
                    });
                    exercise_data.push({	    //Koerperliche Belastbarkeit
                    x: all_dates[i],
                    y: null
                    });
                } else {
                    gewicht_data.push({            //Gewicht am Tag
                        x: all_dates[i],
                        y: gewicht[idx]
                    });
                    weights_data.push({         //Gewichtsverlust bzgl. erstem Arztbesuch
                        x: all_dates[i],
                        y: weights[idx]
                    });
                    bewegung_data.push({        //Bewegung
                        x: all_dates[i],
                        y: bewegung[idx]
                    });
                    appetite_data.push({        //Nahrungsaufnahme
                        x: all_dates[i],
                        y: appetite[idx]
                    });
                    oral_data.push({            //Mukositis oral
                        x: all_dates[i],
                        y: oral[idx]
                    });
                    schmerz_data.push({         //Schmerzen
                        x: all_dates[i],
                        y: schmerz[idx]
                    });
                    essen_data.push({           //Erbrechen
                        x: all_dates[i],
                        y: essen[idx]
                    });
                    diarrhoe_data.push({        //Diarrhö
                        x: all_dates[i],
                        y: diarrhoe[idx]
                    });
                    general_data.push({         //Allgemeinbefinden
                        x: all_dates[i],
                        y: general[idx]
                    });
                    commentar_data.push({       //Besonderheiten
                        x: all_dates[i],
                        y: commentar[idx]
                    });
                    pnp_data.push({             //PNP
                        x: all_dates[i],
                        y: pnp[idx]
                    });
                    fatigue_data.push({		    //Muedigkeit
                    x: all_dates[i],
                    y: fatigue[idx]
                    });
                    medication_data.push({      //Bedarfsmedikation
                        x: all_dates[i],
                        y: 3 * medication[idx]
                    });
                    weight_loss_data.push({     //Gewichtsverlust bzgl. letztem Arzttermin
                        x: all_dates[i],
                        y: weight_loss[idx]
                    });
		
                    // Targeted tumor therapy
                    /*fatigue_data.push({		    //Muedigkeit
                    x: all_dates[i],
                    y: fatigue[idx]
                    });*/
                    hypertension_data.push({	    //Blutdruck
                        x: all_dates[i],
                        y: hypertension[idx]
                    });
                    eczema_data.push({		    //Hautausschlag
                        x: all_dates[i],
                        y: eczema[idx]
                    });
                    liver_data.push({		    //Gelbfaerbung der Augen
                        x: all_dates[i],
                        y: liver[idx]
                    });
                    vision_data.push({		    //Sehstoerungen
                        x: all_dates[i],
                        y: vision[idx]
                    });
                    raceheart_data.push({	    //Puls // TODO Schema
                        x: all_dates[i],
                        y: null
                    });
                    muscle_data.push({	   	    //Muskelschmerzen
                        x: all_dates[i],
                        y: muscle[idx]
                    });
                    joint_data.push({	   	    //Gelenkschmerzen
                        x: all_dates[i],
                        y: joint[idx]
                    });
                    breath_data.push({	   	    //Atemnot
                        x: all_dates[i],
                        y: breath[idx]
                    });
                    exercise_data.push({	    //Koerperliche Belastbarkeit
                        x: all_dates[i],
                        y: exercise[idx]
                    });
                        }
                    }

            var tmp_bar_data = [];
            for (var i = 0; i < all_dates_ms.length; i++){
                tmp_bar_data.push({
                    x: all_dates[i],
                    y: 0.25
                });
            }

            var general_data_colors = generate_bar_colors(general_data);
            var diarrhoe_data_colors = generate_bar_colors(diarrhoe_data);
            var essen_data_colors = generate_bar_colors(essen_data);
            var schmerz_data_colors = generate_bar_colors(schmerz_data);
            var oral_data_colors = generate_bar_colors(oral_data);
            var appetite_data_colors = generate_bar_colors(appetite_data);
            var weights_data_colors = generate_bar_colors(weights_data);
            var bewegung_data_colors = generate_bar_colors(bewegung_data);
            var pnp_data_colors = generate_bar_colors(pnp_data);
            var weight_loss_data_colors = generate_bar_colors(weight_loss_data);

            var fatigue_data_colors = generate_bar_colors(fatigue_data);
            var hypertension_data_colors = generate_bar_colors(hypertension_data);
            var eczema_data_colors = generate_bar_colors(eczema_data);
            var liver_data_colors = generate_bar_colors(liver_data);
            var vision_data_colors = generate_bar_colors(vision_data);
            var raceheart_data_colors = generate_bar_colors(raceheart_data);
            var muscle_data_colors = generate_bar_colors(muscle_data);
            var joint_data_colors = generate_bar_colors(joint_data);
            var breath_data_colors = generate_bar_colors(breath_data);
            var exercise_data_colors = generate_bar_colors(exercise_data);

            var visit_date_data_colors = generate_visits_colors(visit_date_data);
            var medication_data_colors = generate_bedarfsmedication_colors(medication_data);
            var medication_update_data_colors = generate_medicationupdate_colors(medication_update_data);

            var bar_data = {
                labels: all_dates,
                datasets: [
                    {
                        label: "Arzttermin",
                        data: tmp_bar_data,
                        hidden: chart_status[10],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225, 225, 225, 1)",
                        backgroundColor: visit_date_data_colors
                    },
                    {
                        label: "Bedarfsmedikation",
                        data: tmp_bar_data,
                        hidden: chart_status[9],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225, 225, 225, 1)",
                        backgroundColor: medication_data_colors
                    },
                    {
                        label: "Änderung der Medikation",
                        data: tmp_bar_data,
                        hidden: chart_status[11],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225, 225, 225, 1)",
                        backgroundColor: medication_update_data_colors
                    },
                    {
                        label: "Allgemeinbefinden",
                        data: tmp_bar_data,
                        hidden: chart_status[0],
                        borderColor: "rgba(225,255,255,1)",
                        borderWidth: 1,
                        barThickness: 25,
                        backgroundColor: general_data_colors
                    },
                    {
                        label: "Diarrhö",
                        data: tmp_bar_data,
                        hidden: chart_status[1],
                        borderColor: "rgba(255,225,255,1)",
                        borderWidth: 1,
                        barThickness: 25,
                        backgroundColor: diarrhoe_data_colors
                    },
                    {
                        label: "Erbrechen",
                        data: tmp_bar_data,
                        hidden: chart_status[2],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(255,255,225,1)",
                        backgroundColor: essen_data_colors
                    },
                    {
                        label: "Schmerzen",
                        data: tmp_bar_data,
                        hidden: chart_status[3],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: schmerz_data_colors
                    },
                    {
                        label: "Mukositis oral",
                        data: tmp_bar_data,
                        hidden: chart_status[4],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: oral_data_colors
                    },
                    {
                        label: "Nahrungsaufnahme",
                        data: tmp_bar_data,
                        hidden: chart_status[5],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: appetite_data_colors
                    },
                    {
                        label: "Bewegung",
                        data: tmp_bar_data,
                        hidden: chart_status[6],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: bewegung_data_colors
                    },
                    {
                        label: "Gewichtsverlust bzgl. erstem Artztermin",
                        data: tmp_bar_data,
                        hidden: chart_status[7],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: weights_data_colors
                    },
                    {
                        label: "PNP",
                        data: tmp_bar_data,
                        hidden: chart_status[8],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225, 225, 225, 1)",
                        backgroundColor: pnp_data_colors
                    },
		            {
                        label: "Müdigkeit",
                        data: tmp_bar_data,
                        hidden: chart_status[13],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: fatigue_data_colors
                    },
                    {
                        label: "Gewichtsverlust bzgl. letztem Arzttermin",
                        data: tmp_bar_data,
                        hidden: chart_status[12],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: weight_loss_data_colors
                    },

                    //Targeted tumor therapy
                    /*{
                        label: "Müdigkeit",
                        data: tmp_bar_data,
                        hidden: chart_status[13],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: fatigue_data_colors
                    },*/
		            {
                        label: "Blutdruck",
                        data: tmp_bar_data,
                        hidden: chart_status[14],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: hypertension_data_colors
                    },
		            {	
                        label: "Hautausschlag",
                        data: tmp_bar_data,
                        hidden: chart_status[15],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: eczema_data_colors
                    },
		            {	
                        label: "Gelbfärbung der Augen",
                        data: tmp_bar_data,
                        hidden: chart_status[16],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: liver_data_colors
                    },
		            {	
                        label: "Sehstörungen",
                        data: tmp_bar_data,
                        hidden: chart_status[17],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: vision_data_colors
                    },
		            {	
                        label: "Puls",
                        data: tmp_bar_data,
                        hidden: chart_status[18],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: raceheart_data_colors
                    },
		            {	
                        label: "Muskelschmerzen",
                        data: tmp_bar_data,
                        hidden: chart_status[19],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: muscle_data_colors
                    },
		            {	
                        label: "Gelenkschmerzen",
                        data: tmp_bar_data,
                        hidden: chart_status[20],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: joint_data_colors
                    },
		            {	
                        label: "Atemnot",
                        data: tmp_bar_data,
                        hidden: chart_status[21],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: breath_data_colors
                    },
		            {	
                        label: "Körperliche Belastbarkeit",
                        data: tmp_bar_data,
                        hidden: chart_status[22],
                        borderWidth: 1,
                        barThickness: 25,
                        borderColor: "rgba(225,225,225,1)",
                        backgroundColor: exercise_data_colors
                    }
                ]
            }
            
            for (var i = 0; i < all_dates_labels.length; i++) {
                d = all_dates_labels[i];
                all_dates_labels[i] = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " +
                    d.getHours();
                bla = "";
                if ((d.getMinutes() + "").length == 1) {
                    bla = "0" + d.getMinutes();
                } else {
                    bla = d.getMinutes();
                }

                all_dates_labels[i] = all_dates_labels[i] + ":" + bla;
            }

            all_dates = Array(all_dates.length).fill(1).map( (_, i) => i+1 )

            var data = {
                labels: all_dates,
                datasets: [
                    {
                        label: "Allgemeinbefinden",
                        data: general_data,
                        id: "y-1",
                        hidden: chart_status[0],
                        borderColor: "rgba(225,0,0,0.9)",
                        backgroundColor: "rgba(225,0,0,0.9)"
                    },
                    {
                        label: "Diarrhö",
                        data: diarrhoe_data,
                        id: "y-1",
                        hidden: chart_status[1],
                        borderColor: "rgba(0,225,0,0.9)",
                        backgroundColor: "rgba(0,225,0,0.9)"
                    },
                    {
                        label: "Erbrechen",
                        data: essen_data,
                        id: "y-1",
                        hidden: chart_status[2],
                        borderColor: "rgba(0,0,225,0.9)",
                        backgroundColor: "rgba(0,0,225,0.9)"
                    },
                    {
                        label: "Schmerzen",
                        data: schmerz_data,
                        id: "y-1",
                        hidden: chart_status[3],
                        borderColor: "rgba(225,191,0,0.8)",
                        backgroundColor: "rgba(225,191,0,0.8)"
                    },
                    {
                        label: "Mukositis oral",
                        data: oral_data,
                        id: "y-1",
                        hidden: chart_status[4],
                        borderColor: "rgba(0,191,225,0.8)",
                        backgroundColor: "rgba(0,191,225,0.8)"
                    },
                    {
                        label: "Nahrungsaufnahme",
                        data: appetite_data,
                        id: "y-1",
                        hidden: chart_status[5],
                        borderColor: "rgba(25,91,91,1)",
                        backgroundColor: "rgba(25,91,91,1)"
                    },
                    {
                        label: "Bewegung",
                        data: bewegung_data,
                        id: "y-1",
                        hidden: chart_status[6],
                        borderColor: "rgba(51,0,0,0.8)",
                        backgroundColor: "rgba(51,0,0,0.8)"
                    },
                    {
                        label: "Gewichtsverlust bzgl. erstem Artztermin",
                        data: weights_data,
                        id: "y-1",
                        hidden: chart_status[7],
                        borderColor: "rgba(225,25,191,0.8)",
                        backgroundColor: "rgba(225,25,191,0.8)"
                    },
                    {
                        label: "PNP",
                        data: pnp_data,
                        id: "y-1",
                        hidden: chart_status[8],
                        borderColor: "rgba(191, 159, 63, 0.8)",
                        backgroundColor: "rgba(191, 159, 63, 0.8)"
                    },
		            {
                        label: "Müdigkeit",
                        data: fatigue_data,
		                id: "y-1",
                        hidden: chart_status[13],
                        borderColor: "rgba(141,211,199,1)",
                        backgroundColor: "rgba(141,211,199,1)"
                    },
                    {
                        label: "Bedarfsmedikation",
                        data: medication_data,
                        id: "y-1",
                        hidden: chart_status[9],
                        borderColor: "rgba(63, 170, 191, 0.8)",
                        backgroundColor: "rgba(63, 170, 191, 0.8)"
                    },
                    {
                        label: "Arzttermin",
                        data: visit_date_data,
                        id: "y-1",
                        hidden: chart_status[10],
                        type: "line",
                        showLine: false,
                        steppedLine: true,
                        pointRadius: 1,
                        borderWidth: 5,
                        borderColor: "rgba(0, 0, 0, 1)",
                        backgroundColor: "rgba(0, 0, 0, 1)"
                    },
                    {
                        label: "Änderung der Medikation",
                        data: medication_update_data,
                        id: "y-1",
                        hidden: chart_status[11],
                        type: "line",
                        showLine: false,
                        steppedLine: true,
                        pointRadius: 1,
                        borderWidth: 5,
                        borderColor: "rgba(138, 63, 191, 1)",
                        backgroundColor: "rgba(138, 63, 191, 1)"
                    },
                    {
                        label: "Gewichtsverlust bzgl. letztem Arzttermin",
                        data: weight_loss_data,
                        id: "y-1",
                        hidden: chart_status[12],
                        borderColor: "rgba(245,176,66,0.8)",
                        backgroundColor: "rgba(245,176,66,0.8)"
                    },

                    //Targeted tumor therapy
                    /*{
                        label: "Müdigkeit",
                        data: fatigue_data,
		                id: "y-1",
                        hidden: chart_status[13],
                        borderColor: "rgba(141,211,199,1)",
                        backgroundColor: "rgba(141,211,199,1)"
                    },*/
		            {
                        label: "Blutdruck",
                        data: hypertension_data,
			            id: "y-1",
                        hidden: chart_status[14],
                        borderColor: "rgba(225,225,0,1)",
                        backgroundColor: "rgba(225,225,0,1)"
                    },
		            {	
                        label: "Hautausschlag",
                        data: eczema_data,
			            id: "y-1",
                        hidden: chart_status[15],
                        borderColor: "rgba(190,186,218,1)",
                        backgroundColor: "rgba(190,186,218,1)"
                    },
		            {	
                        label: "Gelbfärbung der Augen",
                        data: liver_data,
			            id: "y-1",
                        hidden: chart_status[16],
                        borderColor: "rgba(251,128,114,1)",
                        backgroundColor: "rgba(251,128,114,1)"
                    },
		            {	
                        label: "Sehstörungen",
                        data: vision_data,
			            id: "y-1",
                        hidden: chart_status[17],
                        borderColor: "rgba(128,177,211,1)",
                        backgroundColor: "rgba(128,177,211,1)"
                    },
		            {	
                        label: "Puls",
                        data: raceheart_data,
			            id: "y-1",
                        hidden: chart_status[18],
                        borderColor: "rgba(203,140,58,1)",
                        backgroundColor: "rgba(203,140,58,1)"
                    },
		            {	
                        label: "Muskelschmerzen",
                        data: muscle_data,
			            id: "y-1",
                        hidden: chart_status[19],
                        borderColor: "rgba(179,222,105,1)",
                        backgroundColor: "rgba(179,222,105,1)"
                    },
		            {	
                        label: "Gelenkschmerzen",
                        data: joint_data,
			            id: "y-1",
                        hidden: chart_status[20],
                        borderColor: "rgba(252,205,229,1)",
                        backgroundColor: "rgba(252,205,229,1)"
                    },
		            {	
                        label: "Atemnot",
                        data: breath_data,
			            id: "y-1",
                        hidden: chart_status[21],
                        borderColor: "rgba(160,160,160,1)",
                        backgroundColor: "rgba(160,160,160,1)"
                    },
		            {	
                        label: "Körperliche Belastbarkeit",
                        data: exercise_data,
			            id: "y-1",
                        hidden: chart_status[22],
                        borderColor: "rgba(188,128,189,1)",
                        backgroundColor: "rgba(188,128,189,1)"
                    }
                ]
            };

            //no fill beneath the line
            Chart.defaults.global.elements.line.fill = false;

            current_chart = new Chart(chart_canvas, {
                type: 'line',
                data: data,
                options: {
                    spanGaps: true,
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                min: 0,
                                max: 3,
                                stepSize: 1
                            }
                        }],
                        xAxes: [
                            {
                                type: "linear",
                                id: "x-2",
                                position: "bottom",
                                display: "false",

                                barPercentage: 0.5,
                                barThickness: 3,
                                ticks: {
                                    max: all_dates.length,
                                    min: 1,
                                    stepSize: 1,
                                    callback: function (value, index, values) {
                                        return all_dates_labels[value-1];
                                        //if (anzeige.checked == false) {
                                        //    return value.split(" ")[0];
                                        //} else {
                                        //    return value;
                                        //}
                                    }
                                }
                            }
                        ]
                    },
                    elements: {
                        line: {
                            tension: 0
                        }
                    },
                    tooltips: {
                        mode: 'point',
                        axis: 'y',
                        callbacks: {
                            title: function (tooltipItem, data) {
                                return all_dates_labels[tooltipItem.datasetIndex];
                            },
                            label: function (tooltipItem, data) {
                                if (data.datasets[tooltipItem.datasetIndex].label != "Arzttermin") {
                                    if (data.datasets[tooltipItem.datasetIndex].label == "Änderung der Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Gewichtsverlust bzgl. erstem Artztermin") {
                                        return [data.datasets[tooltipItem.datasetIndex].label + " Grad: " + tooltipItem.yLabel.toString()] +
                                            " ; " + gewicht_data[tooltipItem.index].y + " kg ";
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Gewichtsverlust bzgl. letztem Arzttermin") {
                                        return [data.datasets[tooltipItem.datasetIndex].label + " Grad: " + tooltipItem.yLabel.toString()] +
                                            " ; " + gewicht_data[tooltipItem.index].y + " kg ";
                                    } else {
                                        return [data.datasets[tooltipItem.datasetIndex].label + " Grad: " + tooltipItem.yLabel.toString()];
                                    }
                                } else {
                                    return [data.datasets[tooltipItem.datasetIndex].label, "Typ: " + regular_visit[tooltipItem.index]];
                                }
                            },
                            footer: function (tooltipItem, data) {
                                if ((data.datasets[tooltipItem[0].datasetIndex].label != "Arzttermin") && (data.datasets[tooltipItem[0].datasetIndex].label != "Änderung der Medikation")) {
                                    return comment_splitter(commentar_data[tooltipItem[0].index].y, 50);
                                }
                            }
                        }
                    },
                    legend: {
                        onClick: function (e, legendItem) {
                            var index = legendItem.datasetIndex;
                            var ci = this.chart;
                            var meta = ci.getDatasetMeta(index);
                            //console.log(meta);
                            //meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            if (meta.hidden === null) {
                                if (ci.data.datasets[index].hidden == true) {
                                    ci.data.datasets[index].hidden = false;
                                    meta.hidden = null; 
                                    chart_status[index] = false;
                                }else{
                                    ci.data.datasets[index].hidden = true;
                                    meta.hidden = true; 
                                    chart_status[index] = meta.hidden;
                                }
                                //alert('Status: ' + ci.data.datasets[index].hidden + ' Actual Status: ' + meta.hidden);
                            } else {
                                ci.data.datasets[index].hidden = false;
                                meta.hidden = null; 
                                chart_status[index] = false; 
                                //alert('Status: ' + ci.data.datasets[index].hidden + ' Actual Status: ' + meta.hidden);
                            }
                            ci.update();
                        }
                    },
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'x',
                                speed: 20,
		                        threshold: 10,
                                rangeMin: {x: 1},
                                rangeMax: {x: all_dates.length}
                                //onPan: function({chart}) {console.log('Panning...');},
                                //onPanComplete: function({chart}) {console.log('...panning over!');}
                            },
                            zoom: {
                                enabled: true,
                                drag: false,
                                mode: 'x',
                                speed: 0.1,
                                threshold: 2,
                                sensitivity: 3,
                                rangeMin: {x: 1},
                                rangeMax: {x: all_dates.length}
                                //onZoom: function({chart}) {console.log('Zooming...')},
                                //onZoomComplete: function({chart}) {console.log('...zooming over!')}

                            }
                        }
                    }
                }
            });
            current_chart.update();
        }

    });

}

vizRenderer.on('QRcodeData', (event, arg) => {
    //alert('I have recieved some data');
    for (var idx = 0; idx < arg[0].length; idx++) {
        database.addEntry(arg[0][idx]);
    }
    //arg[1] = medication updates
    for (var idx = 0; idx < arg[1].length; idx++) {
        database.addMedicationUpdate(arg[1][idx]);
    }
    //arg[2] = visits
    for (var idx = 0; idx < arg[2].length; idx++) {
        database.addVisit(arg[2][idx]);
    }
});

// reads all entries, visits and medUpdates for a specific patient
vizRenderer.on('getEntriesV', async (event, arg) => {
    var QREntries = arg;
    var pid = QREntries[0].pid;

    var ent = await database.readPidEntries(pid);
    var vis = await database.readPidVisits(pid);
    var medup = await database.readPidMedUpdates(pid);

    await Promise.all([ent, vis, medup]).then(function (results) {
        vizRenderer.send('submitDBandQR', [results, QREntries]);
    });
});


// core method to compare DB and QR entries => new entries are added to database, old ones not. 
// In the end, a confirmation is sended to main.js if the QR Code is already completely known.
vizRenderer.on('submitDBandQRV', (event, arg) => {

    var DBentries = arg[0][0];
    var DBvisits = arg[0][1];
    var DBmedUpdates = arg[0][2];

    var entries = arg[1];

    var knownQRCode = false;

    console.log(DBentries[DBentries.length - 1]);
    console.log(entries[entries.length - 1]);
    //alert(DBentries[DBentries.length-1]==entries[entries.length-1])

    var alreadyInDb = 0;
    for (var idx = 0; idx < entries.length; idx++) {
        var entry = entries[idx];

        if (Object.keys(entry).length == 2) { //medUpdate
            if (DBmedUpdates.find(medUpdate => medUpdate.idate == entry.idate)) {
                alreadyInDb++;
            } else {
                database.addMedicationUpdate(entry);
            }
        } else { //normal entry
            if (DBentries.find(DBentry => DBentry.idate == entry.idate)) {
                alreadyInDb++;
            } else {
                database.addEntry(entry);
            }
        }
    }
    if (alreadyInDb == entries.length) {
        knownQRCode = true;
    }
    vizRenderer.send('confirm', knownQRCode);
});

vizRenderer.on('saveVisitV', (event, arg) => {
    database.addVisit(arg);
});

vizRenderer.on('addPatientV', async (event, arg) => {
    var new_patient = arg;
    var prom = await database.addPatientToDB(new_patient);
    var promII = await database.readAllPatients();
    await Promise.all([prom,promII]).then(function (results) {
        var argII = results[0];
        var argIII = results[1];
        vizRenderer.send('patientAdded', argIII);
    });
});

// -> Patient was edited, now read new patient list and send to main -> add-patient
vizRenderer.on('patientEditedConfirmV', async(event,arg) => {
    var patient_listV = await database.readAllPatients();
    await Promise.all([patient_listV]).then(function (results) {
        var patient_list = results[0];
        vizRenderer.send('confirm-patient-edited',patient_list);
    });
});

vizRenderer.on('checkIDV', async (event, arg) => {
    var prom = await database.checkForID(arg);
    var promII = await database.readAllPatients();
    var promIII = await database.readUUID(arg.pid);
    await Promise.all([prom,promII,promIII]).then(function (results) {
        var argII = results[0];
        var argIII = results[1];
        var argIV = results[2];
        vizRenderer.send('checkIDconf', [argII,argIII,argIV]);
    });
});

vizRenderer.on('savePDFPresetV', async (event,arg) => {
    var presetsDBw = await database.readPDFPresets();
    await Promise.all([presetsDBw]).then(function(results) {
        //check if current preset is already in database, if not -> save new preset
        //alert(arg.preset_name);
        var presetsDB = results[0];

        if(presetsDB.length>0) { 
            var errorCode = 0;
            
            for(var i = 0; i < presetsDB.length; i++) {
                //error code 1: name is already in database
                if(arg.preset_name == presetsDB[i].name) {
                    errorCode = 1;
                    break;
                }
                //error code 2: preset is already in database under another name
                // TODO Bedingungen
                if(arg.preset_values[0] == presetsDB[i].general && 
                    arg.preset_values[1] == presetsDB[i].dia &&
                    arg.preset_values[2] == presetsDB[i].eat &&
                    arg.preset_values[3] == presetsDB[i].pain && 
                    arg.preset_values[4] == presetsDB[i].oral &&
                    arg.preset_values[5] == presetsDB[i].appetite && 
                    arg.preset_values[6] == presetsDB[i].activity &&
                    arg.preset_values[7] == presetsDB[i].weightloss_beginning && 
                    arg.preset_values[8] == presetsDB[i].pnp && 
                    arg.preset_values[9] == presetsDB[i].medication && 
                    arg.preset_values[10] == presetsDB[i].visit && 
                    arg.preset_values[11] == presetsDB[i].medication_update && 
                    arg.preset_values[12] == presetsDB[i].weightloss_last && 
                    arg.preset_values[13] == presetsDB[i].fatigue &&
                    arg.preset_values[14] == presetsDB[i].hypertension &&
                    arg.preset_values[15] == presetsDB[i].eczema && 
                    arg.preset_values[16] == presetsDB[i].liver &&
                    arg.preset_values[17] == presetsDB[i].vision &&
                    arg.preset_values[18] == presetsDB[i].raceheart &&
                    arg.preset_values[19] == presetsDB[i].muscle &&
                    arg.preset_values[20] == presetsDB[i].joint &&
                    arg.preset_values[21] == presetsDB[i].breath &&
                    arg.preset_values[22] == presetsDB[i].exercise) {
                    errorCode = 2;
                    break;
                }
            }
            if(errorCode==0) { //no error so far -> save new preset under this name
                var new_preset = {
                    name: arg.preset_name,
                    general: arg.preset_values[0], //Allgemeinbefinden
                    dia: arg.preset_values[1], //Diarrhö
                    eat: arg.preset_values[2], //Erbrechen
                    pain: arg.preset_values[3], //Schmerzen
                    oral: arg.preset_values[4], //Mukositis oral
                    appetite: arg.preset_values[5], //Nahrungsaufnahme
                    activity: arg.preset_values[6], //Bewegung
                    weightloss_beginning: arg.preset_values[7], //Gewichtsverlust bzgl. erstem Artztermin
                    pnp: arg.preset_values[8], //PNP
                    medication: arg.preset_values[9], //Bedarfsmedikation
                    visit: arg.preset_values[10], //Arzttermin
                    medication_update: arg.preset_values[11], //Änderung der Medikation
                    weightloss_last: arg.preset_values[12], //Gewichtsverlust bzgl. letztem Arzttermin
                    fatigue: arg.preset_values[13], //Müdigkeit
                    hypertension: arg.preset_values[14], //Blutdruck
                    eczema: arg.preset_values[15], //Hautausschlag
                    liver: arg.preset_values[16], //Gelbfärbung der Augen
                    vision: arg.preset_values[17], //Sehstörungen
                    raceheart: arg.preset_values[18], //Puls
                    muscle: arg.preset_values[19], //Muskelschmerzen
                    joint: arg.preset_values[20], //Gelenkschmerzen
                    breath: arg.preset_values[21], //Atemnot
                    exercise: arg.preset_values[22] //Körperliche Belastung
                };
                database.addPDFPreset(new_preset);
            }
            vizRenderer.send("confirmNewPDFPreset",errorCode);
        }else { // no entry in PDF presets -> save directly
            var new_preset = {
                name: arg.preset_name,
                    general: arg.preset_values[0], //Allgemeinbefinden
                    dia: arg.preset_values[1], //Diarrhö
                    eat: arg.preset_values[2], //Erbrechen
                    pain: arg.preset_values[3], //Schmerzen
                    oral: arg.preset_values[4], //Mukositis oral
                    appetite: arg.preset_values[5], //Nahrungsaufnahme
                    activity: arg.preset_values[6], //Bewegung
                    weightloss_beginning: arg.preset_values[7], //Gewichtsverlust bzgl. erstem Artztermin
                    pnp: arg.preset_values[8], //PNP
                    medication: arg.preset_values[9], //Bedarfsmedikation
                    visit: arg.preset_values[10], //Arzttermin
                    medication_update: arg.preset_values[11], //Änderung der Medikation
                    weightloss_last: arg.preset_values[12], //Gewichtsverlust bzgl. letztem Arzttermin
                    fatigue: arg.preset_values[13], //Müdigkeit
                    hypertension: arg.preset_values[14], //Blutdruck
                    eczema: arg.preset_values[15], //Hautausschlag
                    liver: arg.preset_values[16], //Gelbfärbung der Augen
                    vision: arg.preset_values[17], //Sehstörungen
                    raceheart: arg.preset_values[18], //Puls
                    muscle: arg.preset_values[19], //Muskelschmerzen
                    joint: arg.preset_values[20], //Gelenkschmerzen
                    breath: arg.preset_values[21], //Atemnot
                    exercise: arg.preset_values[22] //Körperliche Belastung
            };
            database.addPDFPreset(new_preset);
            vizRenderer.send("confirmNewPDFPreset",0);
        }
    });
});

vizRenderer.on('getPDFPresetsV', async (event,arg) => {
    var presetsDBw = await database.readPDFPresets();
    await Promise.all([presetsDBw]).then(function(results) {
        var presetsDB = results[0];

        vizRenderer.send('sendPDFPresetsBack',presetsDB);
    });
});

vizRenderer.on('readAllPatientsV', async (event,arg) => {
    var res = await database.readAllPatients();
    await Promise.all([res]).then(function(results) {
        var ress = results[0];
        vizRenderer.send('response-to-devicesV',ress)
    });
});

vizRenderer.on('saveDeviceV', async (event,arg) => {
    var res = await database.addDevice(arg);
    await Promise.all([res]).then(function(results) {
        var ress = results[0];
        //vizRenderer.send('response-to-devicesV',ress)
    });
});

const reset_chart = document.getElementById("reset-chart");
reset_chart.addEventListener('click', () => {
    if (patient_table_nav.rows[test] == null || typeof patient_table_nav.rows[test] == 'undefined') {
        alert("Kein Patient ausgewählt");
    }
    else {
        current_chart.resetZoom();
    }
});

const export_to_pdf = document.getElementById("export-to-pdf");
export_to_pdf.addEventListener('click', async () => {
    //ipcRenderer.send('print-to-pdf');
    //var target = event.target.closest('td');
    //var table_row_index = target.parentNode.rowIndex - 1;
    if (patient_table_nav.rows[test] == null || typeof patient_table_nav.rows[test] == 'undefined') {
        alert("Kein Patient ausgewählt")
    }
    else {
        var pid = patient_table_nav.rows[test].cells[0].innerHTML;
        var pfname = patient_table_nav.rows[test].cells[1].innerHTML;
        var plname = patient_table_nav.rows[test].cells[2].innerHTML;
        var pbdate = patient_table_nav.rows[test].cells[3].innerHTML;
        var anzeige = document.getElementById("data_display");

        var ent = await database.readPidEntries(pid);
        var vis = await database.readPidVisits(pid);
        var medup = await database.readPidMedUpdates(pid);
        var presets = await database.readPDFPresets();

        var legend_names = [];
        Chart.helpers.each(Chart.instances, function (instance) {
            var ci = instance.chart;
            
            for (var i = 0; i < chart_status.length; i++) {
                var meta = ci.getDatasetMeta(i);
                legend_names.push(ci.data.datasets[i].label);
            }
        });
        
        await Promise.all([ent, vis, medup, anzeige, pid, pfname, plname, pbdate, chart_status, legend_names, presets]).then(function (results) {
            vizRenderer.send('pdf-preset-window',results);
        });


    }

});


const info_scoring = document.getElementById("info-scoring");
info_scoring.addEventListener('click', () => {
    vizRenderer.send('open-info-scoring');
});

const csv_export_button = document.getElementById("csv-export");
csv_export_button.addEventListener('click', () => {
    var result = [];
    patient_list = database.readAllPatients();
    for (var i = 0; i < patient_list.length; i++) {
        tmp = {
            pid: null,
            firstname: null,
            lastname: null,
            birthdate: null
        }
        //data
        tmp.pid = patient_list[i].id;
        tmp.firstname = patient_list[i].firstname;
        tmp.lastname = patient_list[i].lastname;
        tmp.birthdate = patient_list[i].birthdate;
        result.push(tmp);
    }

    const configDir =  (electron.app || electron.remote.app).getPath('userData');
    const csv_path = path.join(configDir,"patienten-liste.csv");
    
   /* dialog.showSaveDialog(null, options, (path) => {
        console.log(path);
        pathname = path;
    });*/

    var pathname = dialog.showSaveDialog( {
        title: "Patientenliste speichern",
        filters: [ { name:"CSV-Dateien", ext: [ "csv" ] } ], // what kind of files do you want to see when this box is opend
        defaultPath: csv_path // the default path to save file
    });

    if ( ! pathname ) {
        // path is undefined
        return;
    }
    
    /*
    fs.writeFile( path , text , ( err , buf ) => {
        if ( err )
            return alert("saved");
        return alert("not saved");
    });*/

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: pathname,
        header: [
            { id: 'pid', title: 'ID' },
            { id: 'firstname', title: 'FIRSTNAME' },
            { id: 'lastname', title: 'LASTNAME' },
            { id: 'birthdate', title: 'BIRTHDATE' }
        ],
        fieldDelimiter: ';'
    });

    csvWriter.writeRecords(result)       // returns a promise
        .then(() => {
            console.log('...Done');
            alert("Patientenliste erfolgreich unter " + pathname + " exportiert.");
        });
})

function generate_bar_colors(data_object){
    var bar_colors = [];
    for (var i = 0; i < data_object.length; i++) {
        if (data_object[i].y == null) {
            bar_colors.push("rgba(127, 127, 127,1)");
        }else if (data_object[i].y == 0) {
            bar_colors.push("rgba(182, 214, 0, 1)");
        }else if (data_object[i].y == 1) {
            bar_colors.push("rgba(255, 239, 10, 1)");
        }else if (data_object[i].y == 2) {
            bar_colors.push("rgba(235, 125, 0, 1)");
        }else if (data_object[i].y == 3) {
            bar_colors.push("rgba(219, 11, 0, 1)");
        }
        //console.log('Value ' + data_object[i].y + ' color: ' + bar_colors[i]);
    }
    return bar_colors;
}

function generate_visits_colors(data_object){
    var bar_colors = [];
    for (var i = 0; i < data_object.length; i++) {
        if (data_object[i].y == null) {
            bar_colors.push("rgba(127, 127, 127,1)");
        }else if (data_object[i].y == 0) {
            bar_colors.push("rgba(255, 255, 255, 1)");
        }else if (data_object[i].y == 3) {
            bar_colors.push("rgba(0, 0, 0, 1)");
        }
        //console.log('Value ' + data_object[i].y + ' color: ' + bar_colors[i]);
    }
    return bar_colors;
}

function generate_bedarfsmedication_colors(data_object){
    var bar_colors = [];
    for (var i = 0; i < data_object.length; i++) {
        if (data_object[i].y == null) {
            bar_colors.push("rgba(127, 127, 127,1)");
        }else if (data_object[i].y == 0) {
            bar_colors.push("rgba(0, 219, 205, 1)");
        }else if (data_object[i].y == 3) {
            bar_colors.push("rgba(0, 88, 219, 1)");
        }
        //console.log('Value ' + data_object[i].y + ' color: ' + bar_colors[i]);
    }
    return bar_colors;
}

function generate_medicationupdate_colors(data_object){
    var bar_colors = [];
    for (var i = 0; i < data_object.length; i++) {
        if (data_object[i].y == null) {
            bar_colors.push("rgba(127, 127, 127,1)");
        }else if (data_object[i].y == 0) {
            bar_colors.push("rgba(215, 215, 193, 1)");
        }else if (data_object[i].y == 3) {
            bar_colors.push("rgba(124, 124, 80, 1)");
        }
        //console.log('Value ' + data_object[i].y + ' color: ' + bar_colors[i]);
    }
    return bar_colors;
}
