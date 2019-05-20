// Copyright (c) 2012 Riverbed Technology; all rights reserved

// hardwire for now... user should be able to browse
//XXX also note these csv fetches run async, so rather than figure out
// completion events we just run them serially...
files = ['./pump-data-bg.csv', './pump-data-insulin.csv', './cgm.csv' ];
//files = ['./pump-data-bg.csv', './pump-data-insulin.csv', './t.csv' ];
//files = ['./pump-data-bg.csv', './pump-data-insulin.csv' ];

var ts_pump;
var ts_cgm;

//XXX clean this up
// use bootstrap-tab.js tabbable tabs, jQuery hooks
function select_tab(which) {
    d3.select("#hourly_tab").attr('class', 'inactive');
    d3.select("#day_tab").attr('class', 'inactive');
    d3.select("#hourly_tab_cgm").attr('class', 'inactive');
    d3.select("#day_tab_cgm").attr('class', 'inactive');
    d3.select(which).attr('class', 'active');
}

//
// draw a simple two-weeks dots chart
//
function data_ready() {
    // latest two weeks of data... subtract 13 instead of 14 because dtaes
    // are inclusive and -14 gives fencepost error
    var edate = telemetry.midnight(telemetry.maxDate);
    var sdate = telemetry.midnight(add_days(edate, -13));
    draw_dashboard(sdate, edate);
}

function draw_dashboard(sdate, edate) {
    //XXX
    ts_pump = telemetry.selectBGs(sdate, edate);
    ts_cgm = telemetry.selectCBGs(sdate, edate);

    var div = d3.select("#dashboard");

    // get width from bootstrap and make height reasonably proportional
    var w = parseInt(div.style('width'));
    var h = Math.round(0.75 * w);

    select_tab('#day_tab');
    dbd.init(div, sdate, edate, w, h);
    dbd.plot('day', ts_pump);

    d3.select("#db-edate").attr('value', friendly_date3(edate))
	//XXX these boundaries aren't working...
      .attr('startDate', sdate)
      .attr('endDate', edate);
}

//
// on the first resize event, delete the dashboard so during the
// resize it is blank (XXX should show some status text or spinny thing)
//
function dashboard_clear() {
    d3.select("#dashboard").selectAll("svg").remove();
}

function dashboard_resize() {
    // since the dashboard SVG is gone, just pretend like we are making
    // the first one... it is a bit overkill, but works fine...
    data_ready();
}

var resize_callback = undefined;

function check_for_resize()
{
    //XXX it's ok that we call the clear operation  multiple times, but it might work
    // better to call it on just the first resize event
    // better we might want to track resize events with a gray square that
    // says 'resizing...' or something like that
    dashboard_clear();

    if (resize_callback != undefined) {
	clearTimeout(resize_callback);
    }
    resize_callback = setTimeout(function () { dashboard_resize(); }, 500);
}

// XXX
d3.select(window).on('resize', function() { check_for_resize(); });

function set_daily() {
    dbd.plot('day', ts_pump);
    select_tab('#day_tab');
}

function set_hourly() {
    dbd.plot('bg', ts_pump);
    select_tab('#hourly_tab');
}

function set_day_by_day_cgm() {
    dbd.plot('day', ts_cgm);
    select_tab('#day_tab_cgm');
}

function set_hourly_cgm() {
    dbd.plot('bg', ts_cgm);
    select_tab('#hourly_tab_cgm');
}

function sidebar_select(name) {
    log('SIDEBAR: ' + name);
}

var sidebar_info = 
    [
     { heading:'Sugarbook' },
     {text:'Dashboard', onclick:'build_dashboard()' },
     {text:'Daily detail', onclick:'build_detailed_view()' },
     {text:'Long-term Detail', onclick:'build_app_unimp()' },
     { heading:'Pals' },
     {text:'Current pals', onclick:'build_app_unimp()' },
     {text:'Invite pals', onclick:'build_app_unimp()' },
     {text:'Chat', onclick:'build_app_unimp()' },
     { heading:'Messages' },
     {text:'Notifications', onclick:'build_notifications()' },
     {text:'Alerts', onclick:'build_app_unimp()' },
     { heading:'Devices' },
     {text:'Sync pump', onclick:'build_app_unimp()' },
     {text:'Sync CGM', onclick:'build_app_unimp()' },
     {text:'Sync fitbit', onclick:'build_app_unimp()' },
     {text:'Settings', onclick:'build_app_unimp()' },
     {text:'Add device', onclick:'build_app_unimp()' }
     ];

var site_items = [ 
	{ text:'Home', onclick:'build_home()' },
	{ text:'About', onclick:'build_about()' },
	{ text:'Tutorials', onclick:'build_main_unimp()' },
	{ text:'Blogs', onclick:'build_main_unimp()' }, 
	{ text:'Related Sites', onclick:'build_main_unimp()' },
	{ text:'Contact Us', onclick:'build_main_unimp()' } ];

var user_items = 
[
 { text:'Profile', onclick:'build_main_unimp()' },
 { text:'-divider-' },
 { text:'Signout', onclick:'build_main_unimp()' }
];

function init_app_frame() {
    var b = new bamba("body");
    b.navbar('sugarpals', 'electra@sugarpals.org', 0, user_items, site_items)
	.container().id("bamba_permanent");
    reset_main_frame();
}

function reset_main_frame() {
    d3.select("#bamba_dynamic").remove();
    var b = new bamba("#bamba_permanent");
    return b.div().id("bamba_dynamic");
}

function unimp(b) {
    var html = '<h1>Under construction...!</h1>';
    b.div()
	.div('class=hero-unit')
	  .html(html)
	 .pop()
	.p().text('This page under contruction...').pop()
       .pop();
}

function build_main_unimp() {
    var b = reset_main_frame();
    unimp(b);
}

function build_about() {
    var html = '<h1>Welcome to sugarpals!</h1>';
    html += '<p><p>';
    html += "Sugarpals is your on-line place for understanding and tracking \
your blood sugar, insulin, carb intake, and physical activity.  Diabetes sucks, but \
it doesn't have to be hard.  Sugarpals will make dealing with \
diabetes easier for you.  And it can even be fun!";

    var b = reset_main_frame();
    b.div()
	.div('class=hero-unit')
	  .html(html)
	 .pop()
	.p().text('This page under contruction...').pop()
       .pop();
}

function build_app_unimp() {
    d3.select("#app-child").remove()
    var b = new bamba('#app-parent');
    unimp(b.div().id('app-child'));
}

function select_green_dots() {
    dbd.set_mode('simple');
}

function select_detailed_dots() {
    dbd.set_mode('detailed');
}

function build_notifications() {
    d3.select("#app-child").remove()
    var b = new bamba('#app-parent');
    b.div().id('app-child')
      .column(10)
      .row()
	.h(2, 'Recent Updates');

    build_fake_updates(b);
}

function build_detailed_view() {
    d3.select("#app-child").remove()
    var b = new bamba('#app-parent');
    b.div().id('app-child')
      .well()
	.h(2,"Daily View")
	.hr()
	.p().text("date navigator goes here");
}


function build_dashboard() {
    d3.select("#app-child").remove()
    var b = new bamba('#app-parent');
    b.div().id('app-child')
      .well()
	.h(2,"Electra's sugarbook")
	.hr()
	.div('class=clearfix')
	  .$$('label').text('Date').pop()
	  .div('class=input')
	    //XXX add to bamba
	    .$$('input')
	      .attr('value', '5/28/2012')//XXX
	      //.attr('class', 'form-stacked')
	      .id('db-edate').pop()
	   .pop()
	 .pop()
	//	.radio_buttons([
	//		      { text:'Shaded Dots',
	//			      onclick:'select_detailed_dots()' },
	//		      { text:'Green Dots', onclick:'select_green_dots()' }
	//		      ])
	//	.p().html('<br>').pop()
	.tab_menu(
		[ { text:'Daily', id:'day_tab', onclick:'set_daily()' },
		  { text:'Hourly', id:'hourly_tab', onclick:'set_hourly()' } ])
	//.div().id('picker').pop()
	.div().id('dashboard').pop()
       .pop();

    b.column(10)
      .row()
	.h(2, 'Recent Updates');

    build_fake_updates(b);

    //XXX shouldn't need to re-load the data if it hasn't changed...
    load_telemetry(files, data_ready);

    // initialize the date picker widget(s)
    init_edate_datepicker();
}

function init_edate_datepicker() {
    var picker = $("#db-edate");
    picker.datepicker({format: 'm/d/yyyy'});
    picker.datepicker()
	.on('changeDate', function(ev) {
		var edate = new Date(ev.date);
		var sdate = telemetry.midnight(add_days(edate, -13));
		//XXX this doesn't handle data sets with less than 14 days
		if (edate.valueOf() > telemetry.midnight(telemetry.maxDate)) {
		    edate = telemetry.midnight(telemetry.maxDate);
		    sdate = add_days(edate, -13);
		}
		if (sdate.valueOf() < telemetry.midnight(telemetry.minDate)) {
		    sdate = telemetry.minDate;
		    edate = add_days(edate, 13);
		}
		picker.attr('value', edate);
		picker.text(friendly_date3(edate));
		picker.datepicker('hide');
		picker.attr('class', 'inactive');
		picker.blur();
		log(edate);
		dashboard_clear();
		draw_dashboard(sdate, edate);
	    });
}

//XXX not done
function build_fake_update(from, ts, msg)
{
    var s = 'From ';
    s += from;
    s += ' ' + ts;
    s += '<div class="well">';
    s += '<p>' + msg + '</p></div>';
    return s;
}

function build_fake_updates(b) {
    var dad = '<span class="label label-success">dad</span>';
    var mom = '<span class="label label-success">mom</span>';
    var fitbit = '<span class="label label-inverse">fitbit</span>';
    var pump = '<span class="label label-inverse">pump</span>';

    var s = '<p><p>';
    s += build_fake_update(dad, '8:37am today', 
'hey electra, remember to do temp basal before PE today... I set a sugarpals alarm to remind you an hour before');
    s += build_fake_update(mom, '8:46am today', 'oops we forgot to bolus for breakfast... correcting BG now');
    s += build_fake_update(fitbit, '7:05am today', 'Detected first activity of day.');
    s += build_fake_update(fitbit, '9:37pm yesterday', 'Detected sleep.');
    s += build_fake_update(pump, '7:32pm yesterday', 'Pumped synced to <a href="http://www.sugarpals.org">sugarpals</a>.');

    b.div().html(s).pop();
}

function build_home() {
    var b = reset_main_frame();
    b.row()
       .column(2)
	 .sidebar(0, sidebar_info)
	.pop()
	.column(10).id('app-parent');
    build_dashboard();
}
tooltip.init();
init_app_frame();
build_home();

//XXX set home tab active...