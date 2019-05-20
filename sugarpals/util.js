// Copyright (c) 2012 Riverbed Technology; all rights reserved


//XXX find a good client-side javascript logging package
// some shorthand
function log(o) {
    if (1) console.log(o);
}


//XXX wrap in anon func and util hook

var day_of_week = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat"
};

var month_of_year = {
    0: "Jan",
    1: "Feb",
    2: "Mar",
    3: "Apr",
    4: "May",
    5: "Jun",
    6: "Jul",
    7: "Aug",
    8: "Sep",
    9: "Oct",
    10: "Nov",
    11: "Dec"
}

function day_postfix(day) {
    if ((day >= 4 && day <= 20) || (day >= 24 && day <= 30))
	return 'th';
    m = day % 10;
    if (m == 1)
	return 'st';
    if (m == 2)
	return 'nd';
    return 'rd';
}

//
// format date as Wed-1st, Thu-2nd, Fri-3rd
// ignores month/year (it will appear at top)
// XXX there's probably a better way to do this
//
function friendly_date(d) {
    var day = d.getDate();
    return day_of_week[d.getDay()] + '-' + day + day_postfix(day);
}

function weekday(d) {
    var day = d.getDate();
    return day_of_week[d.getDay()];
}

function friendly_date2(d) {
    return day_of_week[d.getDay()] + ' ' +
	month_of_year[d.getMonth()] + ' ' + d.getDate();
}

function friendly_date3(d) {
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}

function friendly_date4(d) {
    return (d.getMonth() + 1) + '/' + d.getDate();
}

function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

//
// d3.time doesn't seem to be able to do this quite this way
//
function format_time(d) {
    var h = d.getHours();
    var m = d.getMinutes();
    if (m < 10)
	m = "0" + m;
		   
    var post;
    if (h == 12) {
	post = "pm";
    } else if (h > 12) {
	post = "pm";
	h -= 12;

    } else {
	if (h == 0)
	    h = 12;
	post = "am";
    }

    return h + ":" + m + post;
}

function format_time_bg_data(d) {
    return Math.round(d.y) + " @ " + format_time(d.x) + ' '+ friendly_date(d.x);
}

function format_time_insulin_data(d) {
    return parseFloat(d.y) + "u @ " + format_time(d.x);
}

function format_time_basal_data(ps, pe) {
    // start time of basal period
    var ts = ps.x;
    // end time of basal period
    var te = pe.x;
    
    s = parseFloat(ps.y) + "u/hr " + format_time(ts) +
	" to " + format_time(te);
    return s;
}

function format_time_carb_data(d) {
    return d.y + "g @ " + format_time(d.x);
}

function bg_to_class(BG) {
    if (BG < 80) 
	return 'low';
    if (BG < 140)
	return 'green';
    if (BG < 180)
	return 'yellow';
    return 'high';
    //XXX
    // Saleh's rules of thumb
    if (BG < 50) 
	return 'low-urgent';
    if (BG < 60)
	return 'low-attention';
    if (BG < 70)
	return 'low';
    if (BG < 180)
	return 'neutral';
    if (BG < 250)
	return 'high';
    if (BG < 300)
	return 'high-attention';
    return 'high-urgent';

}

function bg_to_simple_color(BG) {
    var h, s, b;
    //XXX need to use thresholds based on user profile
    if (BG < 80) {
	return "blue";
    }
    if (BG < 140) {
	return "#24c72c";
	return "#3ca845";
	//return "green";
    }
    if (BG < 180) {
	return "yellow";
	return "#f2ee6b";
    }
    return "red";
}

function bg_to_color(BG) {
    var h, s, b;
    if (BG < 80) {
	// low... do various intensities of blue to green
	var w = (BG - 40.0) / (80 - 40);
	if (w < 0)
	    w = 0;
	// blue to green
	var ramp=d3.scale.pow().exponent(2).range([240/360.,120/360.0]);
	h = ramp(w);
	s = 1. - w * 0.3;
	b = 0.9;
    } else if (BG < 250) {
	var w = (BG - 80.0) / (250 - 80);
	if (w < 0)
	    w = 0;
	
	// blue is 240
	// green is 120
	// yellow is 60
	// orange is 20
	// purple is 280
	
	var ramp=d3.scale.pow().exponent(0.5).range([120/360.,0/360.0]);
	h = ramp(w);
	s = 0.7;
	b = 0.9;
    } else {
	if (BG >= 300) {
	    // bright red
	    return d3.rgb(255, 0, 255);
	}

	var w = (BG - 250.0) / (300 - 250);
	if (w < 0)
	    w = 0;
	
	// blue is 240
	// green is 120
	// yellow is 60
	// orange is 20
	// purple is 280
	
	h = 0;
	s = 0.7 + w*0.28;
	b = 0.9 + w*0.1;
    }
    rgb = hsvToRgb(h, s, b);
    return d3.rgb(rgb[0], rgb[1], rgb[2]);
}
	   
function bg_to_radius(BG)
{
    if (BG < 80)
	return bg_to_radius(80);
    if (BG > 350)
	BG = 350;
    return 8 + Math.sqrt((BG - 80) / 500 * 80);
}

function midnight(time) {
    return d3.time.day(time);
}

//
// given a date, return time as a real number expressed in hours from
// midnight (0) to noon (12) etc
// expressed as decimal fraction to capture minutes
//
function get_hour(now) {
    var ms = now.getTime() - midnight(now).getTime();
    return ms / (1000.*60*60);
}

function add_days(date, ndays) {
    var sum = new Date;
    sum.setTime(date.getTime() + ndays * 1000 * 24 * 3600);
    return sum;
}

var daylight = [
		0, 1, 2, 3, 4, 5,
		9, 14, 16, 17, 18, 20,
		22, 20, 18, 17, 16, 14,
		9, 5, 4, 3, 2, 1 ];

//
// return a gray color where midnight (0) is darkest and noon (12) is brightest
//
function hour_to_color(h) {
    var max_level = 150;
    var min_level = 20;

    weight = daylight[Math.floor(h)] / 24.0;

    var level = Math.floor(weight * (max_level - min_level)) + min_level;
    return d3.rgb(level, level, level);
}    

