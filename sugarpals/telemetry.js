// Copyright (c) 2012 Riverbed Technology; all rights reserved

//XXX change this into a proper javascript class
//XXX also, wrap module in an anon function

// transform the csv data into the primary pump-view data structure,
// the top-level array is a table of each day's data, indexed by 
// a javascript Date representing zero hour of the corresponding day.
// each day has four named entries (BG, carbs, basal, bolus), which
// are time series represented as arrays of <x,y> data points, where
// x is a javascript Date representing the exact time of the data point,
// and y is the particular value (i.e., grams of carbs, units of insulin, etc)

telemetry = {};
telemetry.midnight = function(time) {
    return d3.time.day(time);
}

telemetry.note_date = function(t) {
    if (this.minDate == undefined)
	this.minDate = this.maxDate = t;
    else if (t.getTime() < this.minDate.getTime())
	this.minDate = telemetry.midnight(t);
    else if (t.getTime() > this.maxDate.getTime())
	this.maxDate = t;
}

telemetry.pump_data = {};
telemetry.add_pump_data = function(csv) {
    for (i in csv) {
	// canonicalize the time
	r = csv[i];
	t = new Date(r.time);

	//XXX FIX... hack to make CGM data overlap with pump data
	// so switching between views makes sense
	if (r.cbg != undefined && r.cbg != '') {
	    //log(r);
	    t = add_days(t, -34);
	}
	//log(hackdate);


	this.note_date(t);
	tmidnight = telemetry.midnight(t);
	var dd = this.pump_data[tmidnight];
	if (dd == undefined) {
	    dd = { BG:[], carbs:[], basal:[], bolus:[], cBG:[] };
	    this.pump_data[tmidnight] = dd;
	}
	if (r.bg != undefined && r.bg != '')
	    dd.BG.push({x:t, y:r.bg});
	if (r.carbs != undefined && r.carbs != '')
	    dd.carbs.push({x:t, y:r.carbs});
	if (r.basal != undefined && r.basal != '')
	    dd.basal.push({x:t, y:r.basal});
	if (r.bolus != undefined && r.bolus != '')
	    dd.bolus.push({x:t, y:r.bolus});
	if (r.cbg != undefined && r.cbg != '') {
	    //log(r);
	    dd.cBG.push({x:t, y:r.cbg});
	}
    }
};

function add_days(date, ndays) {
    var sum = new Date;
    sum.setTime(date.getTime() + ndays * 1000 * 24 * 3600);
    return sum;
}

//
// select a subset of BG records from start date to end date
// XXX need a cleaner model for all this
//
telemetry.selectBGs = function(sdate, edate) {
    //XXX there has to be an easier way...
    var e = telemetry.midnight(edate).getTime();
    var day = sdate;
    var ts = [];
    while (day.getTime() <= e) {
	dd = this.pump_data[day];
	//XXX must be an easier way to make a copy
	if (dd != undefined) {
	    for (k in dd.BG) {
		ts.push(dd.BG[k]);
	    }
	}
	day = add_days(day, 1);
    }
    return ts;
};

telemetry.selectCBGs = function(sdate, edate) {
    //XXX there has to be an easier way...
    var e = telemetry.midnight(edate).getTime();
    var day = sdate;
    var ts = [];
    while (day.getTime() <= e) {
	dd = this.pump_data[day];
	//XXX must be an easier way to make a copy
	if (dd != undefined) {
	    for (k in dd.cBG) {
		ts.push(dd.cBG[k]);
	    }
	}
	day = add_days(day, 1);
    }
    return ts;
};

//
// called after the csv files have been fetched from the server...
// XXX this should be called asynchronously when everything has loaded
//
telemetry.data_ready = function() {
    // convert the basal point time series into a sequence of rectangles
    // for easier d3 style plotting

    //XXX not yet
    //for (var date in telemetry.pump_data)
       //add_basal_endpoints(pump_data[date].basal);

    //
    // start out by displaying 4 weeks of history
    // take the last date read from the csv file and subtract 4 weeks
    //
    var endDate = maxDate;
    var startDate = add_days(endDate, -7*4);
    if (startDate.getTime() < minDate.getTime())
	startDate = minDate;

    draw_strips(startDate, endDate);

    //
    // update the range inputs in the html
    //
    sInput = d3.select("#startDateInput");
    sInput.attr('value', friendly_date3(startDate));
    eInput = d3.select("#endDateInput");
    //eInput.attr('value', friendly_date3(endDate));
    eInput.attr('value', friendly_date3(endDate));

    msg = d3.select("#rangeMessage");
    msg.text('Available data is from ' + friendly_date3(minDate) +
	     ' to ' + friendly_date3(maxDate) + '...');
}

telemetry.process_file = function(csv) {
    telemetry.add_pump_data(csv);
    telemetry.nread += 1;
    if (telemetry.nread >= telemetry.nfiles) {
	telemetry.callback();
    }
}

//
// load a set of csv files into the browser as the telemetry data.
// the files are loaded asynchronsouly into the browser data structures.
// when the are all loaded, the callback is invoked indicating all the
// data is loaded and ready to operate upon
// XXX need to catch error (esp file not found)
//
function load_telemetry(fileList, callback) {
    telemetry.callback = callback;
    telemetry.nfiles = fileList.length;
    telemetry.nread = 0;
    for (fname in fileList)
	d3.csv(fileList[fname], telemetry.process_file);
}

