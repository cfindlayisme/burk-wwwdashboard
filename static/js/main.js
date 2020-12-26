////
// Most of the frontend magic happens here for the dashboard, charts, etc
//
// Author: Chuck Findlay <chuck@findlayis.me>
// License: LGPL v3.0
////

// Adjusts active navbar item (highlighted blue) to the selected one when triggered
function navSelected(selected) {
    $('.nav-link').each(function() {
        $(this).removeClass('active');
    });
    $(selected).addClass('active');
}

function getTodaysDate() {
    var date = new Date();
    date.setDate(date.getDate());
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
}

function getYesterdaysDate() {
    var date = new Date();
    date.setDate(date.getDate()-1);
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
}

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

////
// Related to the "Dashboard" page below
///

// Draws our dashboard page
function display_dashboard() {
    var txt = '';
    txt += '<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">\
            <h1 class="h2">Dashboard</h1>\
            <div class="btn-toolbar mb-2 mb-md-0">\
                \
            </div>\
            </div>';
    txt += '<script type="text/javascript">\
            $(document).ready(function() {\
            });';
    $('#mainContent').html(txt);
}

////
// Related to the "Chart" page below
////
var chartGraph = null;

function display_chart() {
    var txt = '';
    txt += '<div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">\
            <h1 class="h2">Chart</h1>\
            <div class="btn-toolbar mb-2 mb-md-0">\
                <p id="Labels"></p>\
            </div>\
          </div>\
            <script type="text/javascript">draw_graph_select();</script>\
            <canvas class="my-4" id="chart" width="900" height="380"></canvas>';
    $('#mainContent').html(txt);
}

// Draws the HTML option menu for selecting what label to graph
function draw_graph_select() {
    var obj, dbParam, xmlhttp, myObj, x, txt = "";
    obj = { table: "labels", limit: 16 };
    dbParam = JSON.stringify(obj);
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            myObj = JSON.parse(this.responseText);
            txt += '<select onchange=\"graph_select(this.value)\">\
                <option disabled selected value>--</option>';
            for (x in myObj) {
                txt += "<option value=\"" + myObj[x].label + "\">" + myObj[x].label;
            }
            txt += "</select>" 
            document.getElementById("Labels").innerHTML = txt;
        }
    }
    xmlhttp.open("GET", "/get/meters/labels", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send();
}

function graph_select(sel) {
    if (chartGraph != null)
    chartGraph.destroy();
    $.ajax({
    url: "/get/meters/label/" + btoa(sel),
    method: "GET",
    success: function(data) {
        console.log(data);
        var dataValues = [];
        var label = [];

        for(var i in data) {
            var x = data[i].timestamp
            var y = data[i].value

            label.push(x)
            dataValues.push(y)
        }

        var chartdata = {
            labels: label,
            datasets : [
                {
                    label: sel,
                    backgroundColor: '#3e95cd',
                    data: dataValues,
                }
            ],
        };

        var ctx = document.getElementById("chart");

        chartGraph = new Chart(ctx, {
            type: 'line',
            data: chartdata
        });

        updateConfigAsNewObject(chartGraph);
    },
    error: function(data) {
        console.log(data);
    }
    });
}

// Updates the graph config
function updateConfigAsNewObject(chart) {
    chart.options = {
        responsive: true,
        scales: {
            xAxes: [{
                display: true,
                type: 'time',
                time: {
                    unit: 'day'
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }]
        }
    }
    chart.update();
}