const electron = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const fs = require('fs');
const chartjs = require('chart.js');
const chartjszoom = require('chartjs-plugin-zoom');
const database = require(path.resolve(__dirname, "../../database"));
const loki = require("lokijs");

//------------------define a variable saving the status of all charts to be displayed-----------------------
var chart_status = [];
for (var s = 0; s < 23; s++) {
    chart_status.push(false);
}
/*
ipcRenderer.on('pdf-data', async (event,arg) => {
    var id = document.getElementById("tid");
    id.innerHTML = arg.pid;
    var fname = document.getElementById("tfname");
    fname.innerHTML = arg.pfname;
    var lname = document.getElementById("tlname");
    lname.innerHTML = arg.plname;
    var bdate = document.getElementById("tbdate");
    bdate.innerHTML = arg.pbdate;

    var anzeige = arg.anzeige;
    console.log(anzeige);

    var pid = id.innerHTML;
    //var pfname = fname.innerHTML;
    //var plname = bdate.innerHTML;

    var ent = await database.readPidEntries(pid);
    var vis = await database.readPidVisits(pid);
    var medup = await database.readPidMedUpdates(pid);

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
        var canvas = document.getElementById("current-chart-II");
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
            var pnp = []; var commentar = []; var medication = [];
            var gewicht = []; var bewegung = []; var appetite = []; var oral = []; var schmerz = [];
            var essen = []; var diarrhoe = []; var general = []; var datum = [];
            for (var i = 0; i < tmp.length; i++) {
                //jahr[i] = tmp[i].year;
                //monat[i] = tmp[i].month;
                //tag[i] = tmp[i].day;
                //zeit[i] = tmp[i].time;
                pnp[i] = tmp[i].pnp;
                medication[i] = tmp[i].medication;
                datum[i] = tmp[i].idate;
                commentar[i] = tmp[i].comments;
                gewicht[i] = tmp[i].weight;
                bewegung[i] = tmp[i].activity;
                oral[i] = tmp[i].oral;
                schmerz[i] = tmp[i].pain;
                essen[i] = tmp[i].eat;
                appetite[i] = tmp[i].appetite;
                diarrhoe[i] = tmp[i].dia;
                general[i] = tmp[i].general;
            }

            //Normalizing the weight between 0 and 3 before ploting the results
            var weights = [];
            var w_0 = gewicht[0];
            for (var i = 0; i < gewicht.length; i++) {
                w = gewicht[i] - w_0;
                p = (Math.abs(w) / w_0) * 100;
                if (p >= 5 && p < 10) {
                    weights[i] = 1;
                } else if (p >= 10 && p < 20) {
                    weights[i] = 2;
                } else if (p >= 20) {
                    weights[i] = 3;
                } else if (p < 5) {
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
            var tmp_pnp = []; var tmp_medication = [];
            var tmp_commentar = []; var tmp_weights = [];
            var tmp_bewegung = []; var tmp_oral = [];
            var tmp_schmerz = []; var tmp_essen = [];
            var tmp_appetite = []; var tmp_diarrhoe = [];
            var tmp_general = []; var tmp_gewicht = [];
            for (var i = 0; i < total_dates; i++) {
                //console.log("i " + i + "/" + total_dates)
                if (i == total_dates - 1) {

                    if (total_dates == 1) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);
                    } else if ((new Date(datum[i - 1])).getDay() != (new Date(datum[i])).getDay()) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);
                    } else if ((new Date(datum[i - 1])).getDay() == (new Date(datum[i])).getDay()) {
                        tmp_dates.push(new Date(datum[i]));
                        tmp_pnp.push(pnp[i]); tmp_medication.push(medication[i]);
                        tmp_commentar.push(commentar[i]); tmp_weights.push(weights[i]);
                        tmp_bewegung.push(bewegung[i]); tmp_oral.push(oral[i]);
                        tmp_schmerz.push(schmerz[i]); tmp_essen.push(essen[i]);
                        tmp_appetite.push(appetite[i]); tmp_diarrhoe.push(diarrhoe[i]);
                        tmp_general.push(general[i]); tmp_gewicht.push(gewicht[i]);
                    }
                } else {
                    d1 = (new Date(datum[i])).getDay();
                    d2 = (new Date(datum[i + 1])).getDay();
                    //console.log("day 1: " +d1 + " day 2: " + d2);
                    if (d1 == d2) {
                        tmp_cnt = i + 1;
                    } else {
                        tmp_dates.push(new Date(datum[tmp_cnt]));
                        tmp_pnp.push(pnp[tmp_cnt]); tmp_medication.push(medication[tmp_cnt]);
                        tmp_commentar.push(commentar[tmp_cnt]); tmp_weights.push(weights[tmp_cnt]);
                        tmp_bewegung.push(bewegung[tmp_cnt]); tmp_oral.push(oral[tmp_cnt]);
                        tmp_schmerz.push(schmerz[tmp_cnt]); tmp_essen.push(essen[tmp_cnt]);
                        tmp_appetite.push(appetite[tmp_cnt]); tmp_diarrhoe.push(diarrhoe[tmp_cnt]);
                        tmp_general.push(general[tmp_cnt]); tmp_gewicht.push(gewicht[tmp_cnt]);
                        tmp_cnt = i + 1
                    }
                }
            }
            if (anzeige.checked == false) {
                datum = tmp_dates;
                pnp = tmp_pnp; medication = tmp_medication;
                commentar = tmp_commentar; weights = tmp_weights;
                bewegung = tmp_bewegung; oral = tmp_oral;
                schmerz = tmp_schmerz; essen = tmp_essen;
                appetite = tmp_appetite; diarrhoe = tmp_diarrhoe;
                general = tmp_general; gewicht = tmp_gewicht;
            }

            console.log("Data Collected: " + datum);
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
                        x: all_dates[i],
                        y: 0
                    });
                } else {
                    if (tmp_visit[idx].regular_visit == 0) {
                        regular_visit[i] = "Ungewöhnlicher Arzttermin";
                    } else {
                        regular_visit[i] = "Gewöhnlicher Arzttermin";
                    }
                    visit_date_data.push({
                        x: all_dates[i],
                        y: 3
                    });
                }
            }
            var medication_update_data = [];
            for (var i = 0; i < all_dates_ms.length; i++) {
                var idx = medication_update_ms.indexOf(all_dates_ms[i]);
                if (idx < 0) {
                    medication_update_label[i] = -1;
                    medication_update_data.push({
                        x: all_dates[i],
                        y: 0
                    });
                } else {
                    medication_update_label[i] = "Medikation geändert";
                    medication_update_data.push({
                        x: all_dates[i],
                        y: 3
                    });
                }
            }

            var commentar_data = []; var gewicht_data = [];
            var weights_data = []; var bewegung_data = []; var appetite_data = []; var oral_data = []; var schmerz_data = [];
            var essen_data = []; var diarrhoe_data = []; var general_data = []; var pnp_data = []; var medication_data = [];
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
                    bewegung_data.push({
                        x: all_dates[i],
                        y: null
                    })
                    appetite_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    oral_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    schmerz_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    essen_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    diarrhoe_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    general_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    commentar_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    pnp_data.push({
                        x: all_dates[i],
                        y: null
                    });
                    medication_data.push({
                        x: all_dates[i],
                        y: null
                    });
                } else {
                    gewicht_data.push({
                        x: all_dates[i],
                        y: gewicht[idx]
                    });
                    weights_data.push({
                        x: all_dates[i],
                        y: weights[idx]
                    });
                    bewegung_data.push({
                        x: all_dates[i],
                        y: bewegung[idx]
                    });
                    appetite_data.push({
                        x: all_dates[i],
                        y: appetite[idx]
                    });
                    oral_data.push({
                        x: all_dates[i],
                        y: oral[idx]
                    });
                    schmerz_data.push({
                        x: all_dates[i],
                        y: schmerz[idx]
                    });
                    essen_data.push({
                        x: all_dates[i],
                        y: essen[idx]
                    });
                    diarrhoe_data.push({
                        x: all_dates[i],
                        y: diarrhoe[idx]
                    });
                    general_data.push({
                        x: all_dates[i],
                        y: general[idx]
                    });
                    commentar_data.push({
                        x: all_dates[i],
                        y: commentar[idx]
                    });
                    pnp_data.push({
                        x: all_dates[i],
                        y: pnp[idx]
                    });
                    medication_data.push({
                        x: all_dates[i],
                        y: 3 * medication[idx]
                    });
                }
            }

            for (var i = 0; i < all_dates.length; i++) {
                d = all_dates[i];
                all_dates[i] = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " +
                    d.getHours();
                bla = "";
                if ((d.getMinutes() + "").length == 1) {
                    bla = "0" + d.getMinutes();
                } else {
                    bla = d.getMinutes();
                }

                all_dates[i] = all_dates[i] + ":" + bla;
            }

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
                        label: "Gewichtsverlust",
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
                        type: "bar",
                        xAxisID: "x-2",
                        borderColor: "rgba(0, 0, 0, 1)",
                        backgroundColor: "rgba(0, 0, 0, 1)"
                    },
                    {
                        label: "Änderung der Medikation",
                        data: medication_update_data,
                        id: "y-1",
                        hidden: chart_status[11],
                        type: "bar",
                        xAxisID: "x-2",
                        borderColor: "rgba(138, 63, 191, 1)",
                        backgroundColor: "rgba(138, 63, 191, 1)"
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
                                id: "x-2",
                                position: "bottom",
                                display: "false",
                                barPercentage: 0.5,
                                barThickness: 3,
                                ticks: {
                                    callback: function (value, index, values) {
                                        if (anzeige.checked == false) {
                                            return value.split(" ")[0];
                                        } else {
                                            return value;
                                        }
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
                            label: function (tooltipItem, data) {
                                if (data.datasets[tooltipItem.datasetIndex].label != "Arzttermin") {
                                    if (data.datasets[tooltipItem.datasetIndex].label == "Änderung der Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Gewichtsverlust") {
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
                            //meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            if (meta.hidden === null) {
                                meta.hidden = !ci.data.datasets[index].hidden;
                                chart_status[index] = meta.hidden;
                            } else {
                                meta.hidden = null;
                                chart_status[index] = !chart_status[index];
                            }
                            ci.update();
                        }
                    },
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'x',
                                speed: 5
                                //onPan: function({chart}) {console.log('Panning...');},
                                //onPanComplete: function({chart}) {console.log('...panning over!');}
                            },
                            zoom: {
                                enabled: true,
                                mode: 'x',
                                speed: 10
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
    
    setTimeout(function(){ 
        ipcRenderer.send('print-to-pdf');
    }, 700);
    
    ipcRenderer.once('wrote-pdf', (event, path) => {
        const message = `PDF gespeichert in Pfad: ${path}`
        alert(message);
        ipcRenderer.send('hide-pdfwindow');
      })
});
*/

// TODO New plot with new questions

ipcRenderer.on('pdf-data-print', async (event,argII) => {
        var arg = argII[0];
        var selectedIndx = argII[1];

        var id = document.getElementById("tid");
        id.innerHTML = arg[4];
        var fname = document.getElementById("tfname");
        fname.innerHTML = arg[5];
        var lname = document.getElementById("tlname");
        lname.innerHTML = arg[6];
        var bdate = document.getElementById("tbdate");
        bdate.innerHTML = arg[7];

        var chart_status = arg[8];
        if(selectedIndx == 0) {
            chart_status = arg[8];
        }else {
            var pdfPresetsDB = arg[arg.length-1];
            var pdfPreset = pdfPresetsDB[selectedIndx-1];
            chart_status = [pdfPreset.general,pdfPreset.dia,pdfPreset.eat,pdfPreset.pain,pdfPreset.oral,
                        pdfPreset.appetite,pdfPreset.activity,pdfPreset.weightloss_beginning,pdfPreset.pnp,
                        pdfPreset.medication,pdfPreset.visit,pdfPreset.medication_update,pdfPreset.weightloss_last]; //TODO New questions
        }
        
        //var tmp = database.readEntries(pid);
        var tmp = arg[0];
        //var tmp_visit = database.readVisits(pid);
        var tmp_visit = arg[1];
        //var tmp_medUpdate = database.readMedUpdates(pid);
        var tmp_medUpdate = arg[2];
        var anzeige = arg[3];

        //Destroy all previously created charts
        Chart.helpers.each(Chart.instances, function (instance) {
            instance.chart.destroy();
        })

        //Initialize and use the canvas
        var canvas = document.getElementById("current-chart-II");
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
        var pnp = []; var commentar = []; var medication = [];                                          //PNP   //Besonderheiten    //Bedarfsmedikation
        var gewicht = []; var bewegung = []; var appetite = []; var oral = []; var schmerz = [];        //aktuelles Gewicht //Bewgung   //Nahrungsaufnahme  //Mukositis oral    //Schmerzen
        var essen = []; var diarrhoe = []; var general = []; var datum = [];                            //Erbrechen     //Diarrhö       //Allgemeinbefinden     //Datum

	//Targeted tumor therapy
	var fatigue = []; var hypertension = []; var eczema = []; var liver = [];			//Muedigkeit	//Blutdruck	//Hautausschlag		//Gelbfaerbung der Augen
	var vision = []; var raceheart = []; var muscle = []; var joint = [];				//Sehstoerungen	//Puls		//Muskelschmerzen	//Gelenkschmerzen
	var breath = []; var exercise = []; //Atemnot	//Koerperliche Belastbarkeit

        for (var i = 0; i < tmp.length; i++) {
          //jahr[i] = tmp[i].year;
          //monat[i] = tmp[i].month;
         //tag[i] = tmp[i].day;
         //zeit[i] = tmp[i].time;
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
                        x: all_dates[i],
                        y: 0
                    });
                } else {
                    if (tmp_visit[idx].regular_visit == 0) {
                        regular_visit[i] = "Ungewöhnlicher Arzttermin";
                    } else {
                        regular_visit[i] = "Gewöhnlicher Arzttermin";
                    }
                    visit_date_data.push({
                        x: all_dates[i],
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
                        x: all_dates[i],
                        y: 0
                    });
                } else {
                    medication_update_label[i] = "Medikation geändert";
                    medication_update_data.push({
                        x: all_dates[i],
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
		var exercise_data = [];	//Koerperliche Belastbarkeit


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
                    medication_data.push({          //Bedarfsmedikation
                        x: all_dates[i],
                        y: null
                    });
                    weight_loss_data.push({         //Gewichtsverlust bzgl. letztem Arzttermin
                        x: all_dates[i],
                        y: null
                    });
		    // Targeted tumor therapy
		    fatigue_data.push({		    //Muedigkeit
			x: all_dates[i],
			y: null
		    });
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
                    medication_data.push({      //Bedarfsmedikation
                        x: all_dates[i],
                        y: 3 * medication[idx]
                    });
                    weight_loss_data.push({     //Gewichtsverlust bzgl. letztem Arzttermin
                        x: all_dates[i],
                        y: weight_loss[idx]
                    });
		
		   // Targeted tumor therapy
		    fatigue_data.push({		    //Muedigkeit
			x: all_dates[i],
			y: fatigue[idx]
		    });
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

            for (var i = 0; i < all_dates.length; i++) {
                d = all_dates[i];
                all_dates[i] = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " +
                    d.getHours();
                bla = "";
                if ((d.getMinutes() + "").length == 1) {
                    bla = "0" + d.getMinutes();
                } else {
                    bla = d.getMinutes();
                }

                all_dates[i] = all_dates[i] + ":" + bla;
            }

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
                        type: "bar",
                        xAxisID: "x-2",
                        borderColor: "rgba(0, 0, 0, 1)",
                        backgroundColor: "rgba(0, 0, 0, 1)"
                    },
                    {
                        label: "Änderung der Medikation",
                        data: medication_update_data,
                        id: "y-1",
                        hidden: chart_status[11],
                        type: "bar",
                        xAxisID: "x-2",
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
		    {
                        label: "Müdigkeit",
                        data: fatigue_data,
		        id: "y-1",
                        hidden: chart_status[13],
                        borderColor: "rgba(141,211,199,1)",
                        backgroundColor: "rgba(141,211,199,1)"
                    },
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
                    responsive: false,
                    maintainAspectRatio: false,
                    devicePixelRatio: 5,
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
                                id: "x-2",
                                position: "bottom",
                                display: "false",
                                barPercentage: 0.5,
                                barThickness: 3,
                                ticks: {
                                    callback: function (value, index, values) {
                                        if (anzeige.checked == false) {
                                            return value.split(" ")[0];
                                        } else {
                                            return value;
                                        }
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
                            label: function (tooltipItem, data) {
                                if (data.datasets[tooltipItem.datasetIndex].label != "Arzttermin") {
                                    if (data.datasets[tooltipItem.datasetIndex].label == "Änderung der Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Medikation") {
                                        return [data.datasets[tooltipItem.datasetIndex].label];
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Gewichtsverlust bzgl. des ersten Artztermins") {
                                        return [data.datasets[tooltipItem.datasetIndex].label + " Grad: " + tooltipItem.yLabel.toString()] +
                                            " ; " + gewicht_data[tooltipItem.index].y + " kg ";
                                    } else if (data.datasets[tooltipItem.datasetIndex].label == "Gewichtsverlust bzgl. jedes Arzttermins") {
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
                            //meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            if (meta.hidden === null) {
                                meta.hidden = !ci.data.datasets[index].hidden;
                                chart_status[index] = meta.hidden;
                                //alert('Previous Status: ' + null + ' Actual Status: ' + meta.hidden);
                                //alert('Actual Chart tatus: ' + cgart_status[index]);
                            } else {
                                meta.hidden = null;
                                chart_status[index] = !chart_status[index];
                                //alert('Previous Status: ' + !chart_status[index] + ' Actual Status: ' + meta.hidden);
                                //alert('Actual Chart tatus: ' + chart_status[index]);
                            }
                            ci.update();
                        }
                    },
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'x',
                                speed: 5
                                //onPan: function({chart}) {console.log('Panning...');},
                                //onPanComplete: function({chart}) {console.log('...panning over!');}
                            },
                            zoom: {
                                enabled: true,
                                mode: 'x',
                                speed: 10
                                //onZoom: function({chart}) {console.log('Zooming...')},
                                //onZoomComplete: function({chart}) {console.log('...zooming over!')}

                            }
                        }
                    }
                }
            });
            current_chart.update();
        }
    
    setTimeout(function(){ 
        ipcRenderer.send('print-to-pdf');
    }, 700);
    
});

ipcRenderer.once('wrote-pdf', (event, path) => {
    const message = `PDF gespeichert in Pfad: ${path}`
    alert(message);
    ipcRenderer.send('hide-pdfwindow');
});
