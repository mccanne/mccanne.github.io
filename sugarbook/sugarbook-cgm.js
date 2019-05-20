//
// Copyright (c) 2012 Riverbed Technology, Inc.
// All rights reserved.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//


//
// A few notes about this module:
//  - it is a rough prototype (my first d3 program) and needs to be refactored
//    in a major way
//  - the "day strips" should use d3 transforms more elegantly instead of lots
//    of embedded math
//  - there are a couple mysteries pending of why certain things don't work
//    (see some of the XXX comments)
//  - it is far from done... lots of features not gotten to yet (see README)
//

// some shorthand
function log(o) {
    if (1) console.log(o);
}

//
// the main window is divided into "strips", with margins around them
// a strip is highlighted by turning visibility on and off of a rect below
// the strip that overlaps the margin
// each strip represents a day and the x-axis represents time of day
// a strip is shaded so that night hours are darker than day hours
// w and h is width and height of each row, which represents a 24-hour day
//
var m = {top:15, right:10, bottom:4, left:30}, // top right bottom left margin
    strip_w = 900, // width of day strip
    strip_h = 50, // height of day strip
    strip_eh = 75, // height of expanded portion of strip
    highlight_w = 2, // width of highlighting border around strip
    w = strip_w + m.right + m.left + highlight_w * 2, // width of whole strip
    h = strip_h + m.top + m.bottom + highlight_w * 2, // height of whole strip
    // scale for mapping hours onto strip coordinates, relative to the
    // highlighting rect
    dscale = d3.scale.linear().domain([0, 24]).range([0, strip_w]);


// create a div for a tooltip on the main body
var tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .text('a simple tooltip');

tooltip.locked = false;

//
// position the tooltip at the current mouse location
//
function tooltip_travel() {
    //position tooltip
    //XXX where does offset of 10 come from?
    var top = (d3.event.pageY-10)+'px';
    var left = (d3.event.pageX+10)+'px';
    tooltip.style('top', top).style('left', left);
}

//
// called when mousing over an item that should have a tooltip raised
// for it.  if another item has the tip locked, then we don't allow changes
//
function tooltip_enable(item, msg) {
    if (!tooltip.locked) {
	tooltip.text(msg);
	tooltip.style('visibility', 'visible');
	tooltip.item = item;
	// highlight this object with white outline
	item.attr('stroke', 'white');
	tooltip_travel();
    }
}

function tooltip_disable() {
    if (!tooltip.locked) {
	tooltip.style('visibility', 'hidden');
	tooltip.item.attr('stroke', 'none');
	tooltip.item = undefined;
    }
}

function tooltip_lock() {
    tooltip.locked = true;
}

function tooltip_unlock() {
    tooltip.locked = false;
}

function tooltip_break_lock() {
    if (tooltip.locked) {
	tooltip.locked = false;
	tooltip_disable();
    }
}

// transform the csv data into the primary pump-view data structure,
// the top-level array is a table of each day's data, indexed by 
// a javascript Date representing zero hour of the corresponding day.
// each day has four named entries (BG, carbs, basal, bolus), which
// are time series represented as arrays of <x,y> data points, where
// x is a javascript Date representing the exact time of the data point,
// and y is the particular value (i.e., grams of carbs, units of insulin, etc)

var minDate;
var maxDate;
function note_date(t) {
    if (minDate == undefined)
	minDate = maxDate = t;
    else if (t.getTime() < minDate.getTime())
	minDate = midnight(t);
    else if (t.getTime() > maxDate.getTime())
	maxDate = t;
}

var pump_data = {};
function add_pump_data(csv) {
    for (i in csv) {
	// canonicalize the time
	r = csv[i];
	t = new Date(r.time);
	note_date(t);
	tmidnight = d3.time.day(t);
	dd = pump_data[tmidnight];
	if (dd == undefined) {
	    dd = pump_data[tmidnight] = { BG:[], carbs:[], basal:[], bolus:[] };
	}
	if (r.bg != undefined && r.bg != '')
	    dd.BG.push({x:t, y:r.bg});
	if (r.carbs != undefined && r.carbs != '')
	    dd.carbs.push({x:t, y:r.carbs});
	if (r.basal != undefined && r.basal != '')
	    dd.basal.push({x:t, y:r.basal});
	if (r.bolus != undefined && r.bolus != '')
	    dd.bolus.push({x:t, y:r.bolus});
    }
}

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

function friendly_date2(d) {
    return day_of_week[d.getDay()] + ' ' +
	month_of_year[d.getMonth()] + ' ' + d.getDate();
}

function friendly_date3(d) {
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
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

function format_time_data(d) {
    return d.y + " @ " + format_time(d.x);
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

// Saleh's rules of thumb
function bg_to_class(BG) {
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

var deselect_timer = undefined;
function cancel_deselect_timer() {
    if (deselect_timer != undefined) {
	clearTimeout(deselect_timer);
	deselect_timer = undefined;
    }
}

function set_deselect_timer() {
    cancel_deselect_timer();
    deselect_timer = setTimeout('trigger_deselect_timer()', 500);
}

function trigger_deselect_timer() {
    if (selected != undefined) {
	deselect(selected);
    }
}

var selected = undefined;
function deselect(g) {
    c = d3.event;

    d3.select(g).selectAll(".border").style('visibility', 'hidden');
    d3.select(g).selectAll('.separator').attr('visibility', 'hidden');
    expand(g, strip_h);

    //XXX hide carb and insulin charts
    d3.select(g).selectAll(".carbs, .bolus")
	.style("visibility", "hidden");

    selected = undefined;

    d3.selectAll(".basal").remove();
}

function expand(r, h) {
    // set the outer day-strip height to the new size plus the padding
    var g = r.parentElement;
    d3.select(g).attr('height', h + 2 * highlight_w + m.top + m.bottom);
}

var yscale = d3.scale.linear().domain([0, 2]).range([strip_h + strip_eh, strip_h]);

var basal_area = d3.svg.area()
    .x(function(d) { return dscale(get_hour(d.x)); })
    .y0(yscale(0))
    .y1(function(d) { return yscale(d.y); })
    .interpolate('step-after');

var basal_area_zero = d3.svg.area()
    .x(function(d) { return dscale(get_hour(d.x)); })
    .y0(yscale(0))
    .y1(yscale(0))
    .interpolate('step-after');

var basal_line = d3.svg.line()
    .x(function(d) { return dscale(get_hour(d.x)); })
    .y(function(d) { return yscale(d.y); })
    .interpolate('step-after');

function largest_hour_smaller_than(pts, hour) {
    var k = 0;
    while (k < pts.length) {
	var h = get_hour(pts[k].x);
	if (h > hour)
	    return k - 1;
	k = k + 1;
    }
    return pts.length;
}

function basal_invert(pts, hour) {
    var k = largest_hour_smaller_than(pts, hour);
    if (k < 0 || k >= pts.length)
	//XXX should handle out-of-bounds condition even though it shouldn't
	// happen because it shouldn't be possible to mouseover a part of the
	// area graph that is not on screen
	return undefined;
    //XXX fix last slot problem
    return [ pts[k], pts[k+1] ];
}

function basal_graph(g) {
    pts = pump_data[g.__data__].basal;
    if (pts.length == 0)
	// no data, don't plot anything
	// (should probably put a label: "no data"
	return;

    var strip = d3.select(g);
    var fill = strip.append("svg:path")
	.attr('class', 'basal')
	.attr('fill', 'lightblue')
	.attr('opacity', '0.6')
	// start at zero then transition to actual values
	.attr('d', basal_area_zero(pts))
	.on('mousemove', function(d, i) {
		var m = d3.svg.mouse(g);
		var relX = m[0];
		//XXX should use dscale inverse for this...?
		hour = relX / strip_w * 24.;
		span = basal_invert(pts, hour);
		var chart = d3.select(this);
		var msg = format_time_basal_data(span[0], span[1]);
		tooltip_enable(chart, msg);
	    })
	.on("mouseup", function(d, i) {
		tooltip_unlock();
	    })
	.on('mouseout', function(d, i) {
		tooltip_disable();
	    });

    // the white line that appears at the top of the basal graph
    strip.append("svg:path")
	.attr('class', 'basal')
	.attr('stroke', 'white')
	.attr('fill', 'none')
	.attr('d', basal_line(pts));


    // animate the filling of color under the basal graph
    fill.transition().attr('d', basal_area(pts));
}

var shake_item = undefined;
var shake_dx = 1;

function stop_shaking() {
    shaking = false;
}

function shake_me_more() {
    shake_dx = - shake_dx;
    var item = shake_item;
    if (shaking)
	dx = shake_dx;
    else
	dx = 0;

    d3.select(item)
	.attr('cx', dscale(get_hour(item.__data__.x)) + shake_dx);
    if (shaking)
	shake_me(item);
    else
	shake_item = undefined;
}

function shake_me(item) {
    if (shake_item != undefined && shake_item != item) {
	// put currently shaking dot in it's rightful place
	var x = dscale(get_hour(shake_item.__data__.x));
	d3.select(shake_item)
	    .attr('cx', x);
    }
    shake_item = item;
    shaking = true;
    setTimeout(function () { shake_me_more(); }, 40);
}

function shake_me_no() {
    shaking = false;
}

	
// add points at hour tzero and tzero-epsilon so left and right portion
// of the basal graph are filled in
//XXX this needs to reach back a day so we need to fix it up
// for now, Electra's data has tzero and we just add the rightmost point
function add_basal_endpoints(pts) {
    n = pts.length;
    if (n == 0)
	return;
    var last = 24.0 - 1./3600.;
    var x = pts[n-1].x;
    if (get_hour(x) < last) {
	var ms = midnight(x).getTime() + (24*60*60*1000) - 1;
	var d = new Date;
	d.setTime(ms);
	pts.push({ x:d, y:pts[n-1].y });
    }
}

//
// called after the csv files have been fetched from the server...
// XXX this should be called asynchronously when everything has loaded
//
function data_ready() {
    // convert the basal point time series into a sequence of rectangles
    // for easier d3 style plotting
    for (var date in pump_data)
	add_basal_endpoints(pump_data[date].basal);

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

//
// called from html date-range button
//
function setDates() {
    sInput = d3.select("#startDateInput");
    eInput = d3.select("#endDateInput");

    sdate = new Date(sInput[0][0].value);
    // need to bump date past midnight exactly as d3 won't include
    // that last day otherwise
    edate = new Date(eInput[0][0].value + ' 00:01');

    if (sdate == 'Invalid Date' || edate == 'Invalid Date')
	alert('Invalid Date');
    else {
	if (sdate.getTime() < minDate.getTime()) {
	    //log(sdate.getTime());
	    //log(minDate.getTime());
	    sdate = minDate;
	    //XXX setting .attr() doesn't seem to work?!
	    //sInput.attr('value', friendly_date3(sdate));
	    sInput[0][0].value = friendly_date3(sdate);
	    alert("earliest available data starts on " + friendly_date3(sdate));
	} else if (edate.getTime() > maxDate.getTime()) {
	    edate = maxDate;
	    //XXX setting .attr() doesn't seem to work?!
	    //eInput.attr('value', friendly_date3(edate));
	    eInput[0][0].value = friendly_date3(edate);
	    alert("latest available data ends on " + friendly_date3(edate));
	}	    
	draw_strips(sdate, edate);
    }
}

function draw_strips(startDate, endDate) {
    dateRange = d3.time.days(startDate, endDate);
    // remove anything already present
    // XXX this doesn't resize the view to make it smaller if you go to fewer dates
    d3.select("#main-view").selectAll("svg").remove();

    // this an svg elements
    svg = d3.select("#main-view").selectAll("svg")
	.data(dateRange)
	.enter().append("svg")
	.on('mousedown', function(d, i) {
		if (tooltip.item != undefined) {
		    tooltip_lock();
		}
	    })
	.on("mouseup", function(d, i) { tooltip_break_lock(); })
	//XXX we coud enable this only when tooltip is active as
	// an optimization
	.on('mousemove', function(d, i) {
		//position tooltip
		tooltip_travel();
	    })

	.attr("width", w)
	.attr("height", h)
	.attr("class", "RdYlGn")
	// add a container that accounts for the margin
	.append("g")
	.attr('class', 'day-strip')
	// we translate everything inside the daystrip to past the highlighting
	// rect, which is itself placed at (-highlight_w,-highlight_w)
	.attr("transform", "translate(" + (m.left+highlight_w) + "," + (m.top+highlight_w) + ")")

	//
	// when the mouse enters a new strip, we "select it" and do a bunch of 
	// stuff to add detail to the selected day
	// note we deselect the current selection when we enter another strip
	// or when we get a mouseout with no mouseover after a couple seconds
	//
	.on("mouseover", function(d, i) {
		// don't do anything if we are already selected
		// cancel the pending timer no matter what
		cancel_deselect_timer();
		if (this == selected) {
		    // this strip is already selected... don't have to do anything
		    return;
		}
		if (selected != undefined) {
		    // we're selecting a new strip... deselect the old one
		    deselect(selected);
		}
		// highlight the border around the strip
		selected = this;
		expand(this, strip_h + strip_eh);
		d3.select(this).selectAll(".border").style("visibility", "visible");
		d3.select(this).selectAll('.separator').attr('visibility', 'visible');

		basal_graph(this);

		//
		// add some eye candy by animating the bars...
		// first make them small then setup a transition to their
		// actual size... we need to redo the selections on
		// the carbs and insulin separately since the original
		// data sets are separate
		//
		d3.select(this).selectAll('.carbs')
		  .style('visibility', 'visible')
 		  .attr('height', 2)
		  .transition()
		  .attr('height', function (d) { return d.y / 100.0 * strip_h; });

		d3.select(this).selectAll('.bolus')
		  .style('visibility', 'visible')
 		  .attr('height', 2)
 		  .attr('y', strip_h-2)
		  .transition()
		  .attr('height', function (d) { return d.y / 10.0 * strip_h; })
		  .attr('y', function (d) { return strip_h - (d.y / 10.0 * strip_h); });
	    })
	.on('mouseout', function(d, i) {
		set_deselect_timer();
	    })

  	.on("mousedown", function(d, i) {
		//expand(this);
	    });

    //
    // add a border around the strip that we can turn on and off to
    // highlight the selection
    //
    d3.selectAll('.day-strip').append('rect')
	.style('visibility', 'hidden')
	.attr('class', 'border')
	.attr('x', -highlight_w)
	.attr('y', -highlight_w)
	.attr('width', strip_w + highlight_w * 2)
	.attr('height', strip_h + strip_eh + highlight_w * 2)
	.attr('fill', '#eee');

    // this adds text to each svg element and prints the along the left column
    // rotated ... the xtranslation of -6 takes back outside the viewport
    svg.append('text')
	.attr('x', -m.left + 3)
	.attr('y', -5)
	.attr('text-anchor', 'start')
	.map(friendly_date2)
	.text(String);

    // draw shaded rects in each day-rect so we give a visual cue of night
    // vs. day
    var hours = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 ];

    d3.selectAll(".day-strip").selectAll('hour-shades').data(hours)
	.enter().append('rect')
	.attr('class', 'shade')
	.attr('x', function (d) { return dscale(d); } )
	.attr('y', 0)
	.attr('width', dscale(1) - dscale(0))
	.attr('height', strip_h + strip_eh)
	.attr('stroke', function(d) { return hour_to_color(d); })
	.attr('fill', function(d) { return hour_to_color(d); });
	
    // create a line to provide separation when the strip is expanded 
    // to view basal rates and pump events
    //svg.selectAll('separators').data([0]).enter().append('line')
    svg.append('line')
	.attr('class', 'separator')
	.attr('x1', dscale(0))
	.attr('y1', strip_h+1)
	.attr('x2', dscale(24))
	.attr('y2', strip_h+1)
	.attr('opacity', 0.5)
	.attr('stroke', '#000')
	.attr('visibility', 'hidden');


    //
    // join the pump BG readings to circles in each day-rect
    // the data is generated by the data of each container day-rect,
    // which is a javascript Date, which is then used to index the
    // pump_data object since the data is stored keyed by date
    //
    d3.selectAll(".day-strip").selectAll('BGs')
	.data(function(date) { return pump_data[date].BG; })
	.enter().append('circle')
	.attr('class', 'BG')
	.attr('bg-class', function(d) { return bg_to_class(d.y); })
	.attr('cx', function(d) { return dscale(get_hour(d.x)); } )
	.attr('cy', strip_h * 0.5)
	.attr('r', function(d) { return bg_to_radius(d.y); })
	.attr('fill', function (d, i) { return bg_to_color(d.y); })
	.on('mouseover', function(d, i) {
		var circle = d3.select(this);
		tooltip_enable(circle, format_time_data(this.__data__));
		//XXX this should be based on Adi classification?
		if (this.__data__.y < 70) {
		    shake_me(this);
		}
	    })
	.on("mouseup", function(d, i) { tooltip_unlock(); })
	.on('mouseout', function(d, i) {
		tooltip_disable();
		stop_shaking();
	    });
    
    var rw = 8;//XXX width of carb histogram
    d3.selectAll(".day-strip").selectAll('carbs')
	.data(function(date) { return pump_data[date].carbs; })
	.enter().append('rect')
	.attr('class', 'carbs')
	.attr('x', function(d) { return dscale(get_hour(d.x)) - rw/2; } )
	.attr('y', 0) // draw from top
	.attr('width', rw)
	.attr('height', function (d) { return d.y / 100.0 * strip_h; })
	.attr('fill', 'lightpink')
	//.attr('fill', 'lightyellow')
	.attr('opacity', '0.6')
	.style('visibility', 'hidden')
	
	.on('mouseover', function(d, i) {
		//XXX is there a better way to get at the data points?
		rect = d3.select(this);
		tooltip_enable(rect, format_time_carb_data(this.__data__));
	    })
	.on("mouseup", function(d, i) { tooltip_unlock(); })
	.on('mouseout', function(d, i) {
		tooltip_disable();
	    });

    d3.selectAll(".day-strip").selectAll('bolus')
	.data(function(date) { return pump_data[date].bolus; })
	.enter().append('rect')
	.attr('class', 'bolus')
	.attr('x', function(d) { return dscale(get_hour(d.x)) - rw/2; } )
	// draw from bottom
	.attr('y', function (d) { return strip_h - (d.y / 10.0 * strip_h); })
	.attr('width', rw)
	.attr('height', function (d) { return d.y / 10.0 * strip_h; })
	.attr('fill', 'lightblue')
	.attr('opacity', '0.8')
	.style('visibility', 'hidden')
	.on('mouseover', function(d, i) {
		var rect = d3.select(this);
		tooltip_enable(rect, format_time_insulin_data(this.__data__));
	    })
	.on("mouseup", function(d, i) { tooltip_unlock(); })
	.on('mouseout', function(d, i) {
		tooltip_disable();
	    });
}

// hardwire for now... user should be able to browse
//XXX also note these csv fetches run async, so rather than figure out
// completion events we just run them serially...
d3.csv('cgm-bg.csv', function(text) {
	add_pump_data(text); 
	d3.csv('./pump-insulin-cgm.csv', function(text) {
		add_pump_data(text);
		data_ready();
	    });
    });

