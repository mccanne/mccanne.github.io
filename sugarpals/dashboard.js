// Copyright (c) 2012 Riverbed Technology; all rights reserved

//XXX should make day-strip into re-usable charting element a la Bostock's
// proposal

dbd = {};

// draw shaded rects in each day-rect so we give a visual cue of night
// vs. day

var daylight = [
		0, 1, 2, 3, 4, 5,
		9, 14, 16, 17, 18, 20,
		22, 20, 18, 17, 16, 14,
		9, 5, 4, 3, 2, 1 ];

//
// return a gray color where midnight (0) is darkest and noon (12) is brightest
//
dbd.hour_to_color = function (h) {
    var max_level = 150;
    var min_level = 20;

    var weight = daylight[Math.floor(h)] / 24.0;

    var level = Math.floor(weight * (max_level - min_level)) + min_level;
    return d3.rgb(level, level, level);
};

dbd.hour_to_color = function (h) {
    var weight = [
	  0, 0.1, 0.1, 0.1, 0.1, 0.2, 0.4, 0.6, 0.7, 0.9, 0.95, 1, 1,
	  1, 1, .95, 0.9, 0.7, 0.6, 0.4, 0.2, 0.1, 0.1, 0.1, 0.1,];
 

    var max_level = 190;
    var min_level = 50;

    weight = daylight[Math.floor(h)] / 24.0;

    var level = Math.floor(weight * (max_level - min_level)) + min_level;
    return d3.rgb(level, level, level);
};

dbd.draw_ramp = function () {
    var hours = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 ];
    var vis = this.vis;
    var ds = this.tscale;
    var h2c = this.hour_to_color;
    var w = ds(1) - ds(0);
    var h = vis.attr('height');
    vis.selectAll('hour-shades').data(hours)
	.enter().append('rect')
	.attr('class', 'shade')
	.attr('x', function (d) { return ds(d); } )
	.attr('y', 0)
        .attr('width', w)
    .attr('height', h)
	.attr('stroke', function(d) { return h2c(d); })
    .attr('fill', function(d) { return h2c(d); });
};

dbd.remove_y_legend = function() {
    this.vis.selectAll('.y_legend').remove();
};

dbd.draw_time_legend = function() {
    this.time_legend.selectAll('hour_label')
    	.data([[3,'3am'], [6,'6am'], [9,'9am'], [12, 'noon'], 
	       [15, '3pm'], [18, '6pm'], [21, '9pm']])
	.enter().append('text')
    	.attr('class', 'hour_label')
	.attr('x', function(d) { return (dbd.tscale(d[0])); })
	.attr('y', 12)
	.attr('font-size', '90%')
	.attr('text-anchor', 'middle')
    	//.attr('stroke', '#fff')
	.text(function(d) { return d[1]; });
};

//XXX not yet
//dbd.set_dates = function(sdate, edate) {
//}

//XXX shake_me needs this
var dscale;

dbd.init = function(div, sdate, edate, w, h) {
    // margin of legend XXX need to do in coord math correctly
    var top_margin = 20;
    var left_margin = 35;
    var vw = w - left_margin;
    var vh = h - top_margin;

    this.mode = 'simple';
    this.root = div.append('div');
    var g1 = this.root.append('g');
    // filler at upper left corner
    g1.append('svg')
    	.attr('width', left_margin)
    	.attr('height', top_margin);
    this.time_legend = g1.append('svg')
    	.attr('width', vw).attr('height', top_margin);

    var g2 = this.root.append('g');
    this.y_legend = g2.append('svg')
    	.attr('width', left_margin).attr('height', vh);
    this.vis = g2.append('svg')
    	.attr('width', vw)
	.attr('height', vh);

    this.sdate = sdate;
    this.edate = edate;

    //XXX need to add margins
    var pad = 20;
    this.tscale = d3.scale.linear()
    	.domain([0, 24]).range([pad, vw-pad]);

    //XXX 14 days of history is hard wired...
    this.yscale_day = d3.scale.linear()
    	.domain([0, 13]).range([vh-pad,pad]);
    this.yscale_bg = d3.scale.linear()
    	.domain([40, 350]).range([vh-pad,pad]);

    this.draw_ramp();
    this.draw_day_grid(pad, vw-pad);//XXX
    this.draw_bg_grid(pad, vw-pad);//XXX
    this.draw_time_legend();
    this.legend_type = 'none';
    this.ts_type = 'none';

    this.vis.on('mousedown', function(d, i) {
	    //log('down');
	    if (tooltip.item != undefined) {
		tooltip.lock();
	    }
	})
        .on("mouseup", function(d, i) { tooltip.break_lock(); })
	.on('mousemove', function(d, i) {
		//position tooltip
		tooltip.travel();
	    });

    //XXX
    dscale = this.tscale;
};

function days_between(from_date, to_date) {
    var ms = midnight(to_date).getTime() - midnight(from_date).getTime();
    var day = ms / (1000.*24*3600);
    return day;
}

dbd.day_scale_date = function(date) {
    return this.yscale_day(days_between(this.sdate, date));
}

dbd.day_scale = function(d) {
    return this.day_scale_date(d.x);
}

dbd.bg_scale_val = function(val) {
    return (this.yscale_bg(val));
}

dbd.bg_scale = function(d) {
    //XXX
    var bg = d.y;
    if (bg > 350)
	bg = 350;
    if (bg < 40)
	bg = 40;
    return this.bg_scale_val(bg);
};

var bg_arrow = { 'half_width':11, 'height':18, 'notch':3 };

//
// generate a high or low icon as SVG path data based on the dot
//
function gen_down_arrow(d) {
    var cx = dbd.tscale(get_hour(d.x));
    var cy = dbd.yscale(d);
    var a = bg_arrow;

    //XXX need to back off from center

    var p = 'M' + (cx - a.half_width) + ' ' + (cy - Math.round(a.height / 2));
    p += 'l' + a.half_width + ' ' + a.notch;
    p += 'l' + a.half_width + ' -' + a.notch;
    p += 'l-' + a.half_width + ' ' + a.height;
    return p + 'z';
}

function gen_up_arrow(d) {
    var cx = dbd.tscale(get_hour(d.x));
    var cy = dbd.yscale(d);
    var a = bg_arrow;

    //XXX need to back off from center

    var p = 'M' + (cx - a.half_width) + ' ' + (cy + Math.round(a.height / 2));
    p += 'l' + a.half_width + ' -' + a.notch;
    p += 'l' + a.half_width + ' ' + a.notch;
    p += 'l-' + a.half_width + ' -' + a.height;
    return p + 'z';
}

dbd.plot_bg = function(ts) {
    // partition the data set into lows, normals, and highs
    
    var lows = ts.filter(function(d) { return (d.y < 80); });
    var normals = ts.filter(function(d) { return (d.y >= 80 && d.y < 180); });
    var highs = ts.filter(function(d) { return (d.y >= 180); });

    //
    // join the pump BG readings to circles in each day-rect
    // the data is generated by the data of each container day-rect,
    // which is a javascript Date, which is then used to index the
    // pump_data object since the data is stored keyed by date
    //
    this.vis.selectAll('.BG-low')
    	.data(lows)
        .enter().append('path').attr('d', function(d) { return gen_down_arrow(d); })
    	.attr('class', 'BG-low')
	.attr('opacity', '0.65')
        .attr('fill', function (d, i) { return bg_to_simple_color(d.y); });

    this.vis.selectAll('.BG-high')
    	.data(highs)
        .enter().append('path').attr('d', function(d) { return gen_up_arrow(d); })
    	.attr('class', 'BG-high')
	.attr('opacity', '0.65')
        .attr('fill', function (d, i) { return bg_to_simple_color(d.y); });

    this.vis.selectAll('.BG-normal')
      .data(normals)
      .enter().append('circle')
      .attr('class', 'BG-normal')
      .attr('cx', function(d) { return dbd.tscale(get_hour(d.x)); } )
      .attr('cy', function(d) { return dbd.yscale(d); })
      .attr('r', 10)
      .attr('opacity', '0.65')
      .attr('fill', function (d, i) { return bg_to_simple_color(d.y); });

    //XXX fix all selects on .BG
    d3.selectAll('.BG-low,.BG-normal,.BG-high')
        .on('mouseover', function(d, i) {
		var circle = d3.select(this);
		tooltip.enable(circle, format_time_bg_data(this.__data__));
		//XXX this should be based on Adi classification?
		if (this.__data__.y < 70) {
		    shake_me(this);
		}
	    })
	.on('mouseup', function(d, i) { tooltip.unlock(); })
	.on('mouseout', function(d, i) {
		tooltip.disable();
		stop_shaking();
	    });

}

//
// draw BG dots on the given object
// a drawable is something that has methods to plot telemetry data
// in particular, the drawable has an object ".vis" which is the d3 svg
// we need to draw on
// XXX todo: change parameter from the div to something more reusable
// XXX todo: shouldn't take sdate... clean this up
// legend is 'bg' or 'day'
// 
dbd.plot = function(legend, ts) {
    //
    // plot the BG time series according to legend
    // 1. figure out if we have to redraw the legend because it changed
    // 2. figure out if we have to delete and re-bind the data to new
    //    circles because we have a new time series
    // XXX for now, we assume the ts time values fall within the configured
    // window... if they don't, then no data will be displayed
    //
    if (this.legend_type != legend) {
	// the legend changed (or it's the first time when legend_type
	// is undefined), so plot the legend type requested

	d3.selectAll('.bg_grid,.day_grid').attr('visibility', 'hidden');

	if (legend == 'day') {
	    d3.selectAll('.day_grid').attr('visibility', 'visible');
	    this.draw_day_legend();
	    this.yscale = this.day_scale;
	} else {
	    d3.selectAll('.bg_grid').attr('visibility', 'visible');
	    this.draw_bg_legend();
	    this.yscale = this.bg_scale;
	}
	this.legend_type = legend;
    }

    if (this.ts_type == ts) {
	// if it's the same time series, just move the dots
	this.vis.selectAll('.BG-normal')
	    .transition()
            .attr('cy', function(d) { return dbd.yscale(d); });
	this.vis.selectAll('.BG-high')
	    .transition()
            .attr('d', function(d) { return gen_up_arrow(d); });
	this.vis.selectAll('.BG-low')
	    .transition()
            .attr('d', function(d) { return gen_down_arrow(d); });
    } else {
	//
	// if it's a different time series (or the first tie when
	// ts_type is undefined), plot new dots
	//
	this.vis.selectAll('.BG-low,.BG-normal,.BG-high').remove();
	this.plot_bg(ts);
	this.ts_type = ts;
    }
};

dbd.draw_day_grid =function(left, right) {
    var ndays = days_between(this.sdate, this.edate);
    var ys = this.day_scale_date(midnight(this.sdate));
    var ye = this.day_scale_date(midnight(this.edate));
    var row_height = (ys - ye) / ndays;
    var halfrow = row_height / 2;
    var dateRange = d3.time.days(this.sdate, this.edate);

    this.vis.selectAll('.day_grid')
      .data(dateRange)
      .enter().append('line')
      .attr('class', 'day_grid')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1.5px')
      .attr('opacity', '0.25')
      .attr('x1', left)
      .attr('y1', function(d) { return (dbd.day_scale_date(midnight(d))) - halfrow; })
      .attr('x2', right)
      .attr('y2', function(d) { return (dbd.day_scale_date(midnight(d))) - halfrow; });
};

dbd.draw_bg_grid =function(left, right) {
    this.vis.selectAll('.bg_grid')
      .data([80,180])
      .enter().append('line')
      .attr('class', 'bg_grid')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1.5px')
      .attr('opacity', '0.25')
      .attr('x1', left)
      .attr('y1', function(d) { return (dbd.bg_scale_val(d)); })
      .attr('x2', right)
      .attr('y2', function(d) { return (dbd.bg_scale_val(d)); });
};

dbd.draw_day_legend = function() {
    // need funny edate processing to get edate included in the range
    var dateRange = d3.time.days(this.sdate, add_days(this.edate, 1));
    this.y_legend.selectAll('.y_legend').remove();
    // first draw days of week, then draw calendar dates mm/dd
    var x = parseInt(this.y_legend.attr('width')) / 2;
    var dh = 8;//XXX
    this.y_legend.selectAll('y_legend')
	.data(dateRange)
	.enter().append('text')
	.attr('class', 'y_legend')
	.attr('font-size', '85%')
	.attr('x', x)
        .attr('y', function(d) { return dbd.day_scale_date(d) - dh; } )
	.attr('text-anchor', 'middle')
	.text(function(d) { return weekday(d); });

    this.y_legend.selectAll('y_legend2')
	.data(dateRange)
	.enter().append('text')
	.attr('class', 'y_legend')
	.attr('font-size', '85%')
	.attr('x', x)
        .attr('y', function(d) { return dbd.day_scale_date(d) + dh; } )
	.attr('text-anchor', 'middle')
	.text(function(d) { return friendly_date4(d); });
};

dbd.draw_bg_legend = function() {
    var x = parseInt(this.y_legend.attr('width')) / 2;
    this.y_legend.selectAll('.y_legend').remove();
    this.y_legend.selectAll('y_legend')
	.data([40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340])
	.enter().append('text')
	.attr('class', 'y_legend')
	.attr('font-size', '85%')
	.attr('x', x)
	.attr('y', function(d) { return dbd.bg_scale_val(d);})
	.attr('text-anchor', 'middle')
    //.attr('stroke', '#fff')
	.text(function(d) { return d; });
};

//XXX change_mode isn't the right abstraction...
// anyway, idea is to set detailed vs. simple
dbd.set_mode = function(mode) {
    if (dbd.mode == mode)
	return;
    dbd.mode = mode;
    if (dbd.mode == 'simple') {
	this.vis.selectAll('.BG-low,.BG-normal,.BG-high')
	    .transition()
	    //XXX doesn't hurt to set r in arrows
	    .attr('r', 10)
	    .attr('fill', function (d, i) { return bg_to_simple_color(d.y); });
    } else {
	this.vis.selectAll('.BG-low,.BG-normal,.BG-high')
	  .transition()
	  .attr('r', function(d) { return bg_to_radius(d.y); })
	  .attr('fill', function (d, i) { return bg_to_color(d.y); });
    }
};
