// hardwire for now... user should be able to browse
//XXX also note these csv fetches run async, so rather than figure out
// completion events we just run them serially...
files = ['./pump-data-bg.csv', './pump-data-insulin.csv', './cgm.csv' ];
//files = ['./pump-data-bg.csv', './pump-data-insulin.csv', './t.csv' ];
//files = ['./pump-data-bg.csv', './pump-data-insulin.csv' ];

var ts_pump;
var ts_cgm;

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
    // latest one week of data
    var edate = telemetry.midnight(telemetry.maxDate);
    var sdate = telemetry.midnight(add_days(edate, -7));
    //XXX
    ts_pump = telemetry.selectBGs(sdate, edate);
    ts_cgm = telemetry.selectCBGs(sdate, edate);

    var div = d3.select("#dashboard");

    // get width from bootstrap and make height reasonably proportional
    var w = parseInt(div.style('width'));
    var h = Math.round(0.5 * w);

    select_tab('#day_tab');
    var vis = div.append("svg");
    dbd.init(vis, sdate, edate, w, h);
    dbd.plot('day', ts_pump);
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
// d3 or bootstrap don't seem to have hooks for this so we
// use jQuery directly
//
$(window).resize(function() { check_for_resize(); });

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
     {text:'Two-week Detail', onclick:'build_app_unimp()' },
     {text:'Long-term Detail', onclick:'build_app_unimp()' },
     { heading:'Pals' },
     {text:'Current pals', onclick:'build_app_unimp()' },
     {text:'Invite pals', onclick:'build_app_unimp()' },
     {text:'Chat', onclick:'build_app_unimp()' },
     { heading:'Messages' },
     {text:'Notifications', onclick:'build_app_unimp()' },
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

function build_dashboard() {
    d3.select("#app-child").remove()
    var b = new bamba('#app-parent');
    b.well().id('app-child')
	.h(2,"Electra's sugarbook")
	.hr()
	.tab_menu(
		  [ { text:'Daily', id:'day_tab', onclick:'set_daily()' },
		    { text:'Hourly', id:'hourly_tab', onclick:'set_hourly()' } ])
	.div().id('dashboard').pop();

    //XXX shouldn't need to re-load the data if it hasn't changed...
    load_telemetry(files, data_ready);
    return;

    d3.select("#content").remove();
    b = new bamba("#content-parent");
    b.well().id('content')
	.h(2,"Electra's sugarbook")
	.hr()
	.tab_menu(
		  [ { text:'Daily', id:'day_tab', onclick:'set_daily()' },
		    { text:'Hourly', id:'hourly_tab', onclick:'set_hourly()' } ])
	.div().id('dashboard').pop();

    //XXX shouldn't need to re-load the data if it hasn't changed...
    load_telemetry(files, data_ready);
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
init_app_frame();
build_home();
//XXX set home tab active...