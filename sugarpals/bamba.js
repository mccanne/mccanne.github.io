// Copyright (c) 2012 Riverbed Technology; all rights reserved

//
// main class constructor for bamba auto-DOM model
//
function bamba(selector) {
    this.selection = d3.select(selector);
    this.tos = 0;
    this.stack = [];
}

//XXX design note: container objects descend the hierarchy.  leaf objects don't
// you use up() to get out of the container and continue

bamba.prototype.push = function(o) {
    this.stack[this.tos] = this.selection;
    this.tos += 1;
    this.selection = o;
    return this;
}

//
// set the selection to the parent node of the current selection as a d3 selection
//
bamba.prototype.pop = function() {
    this.tos -= 1;
    this.selection = this.stack[this.tos];
    return this;
};

//
// create a new DOM element with the indicated attributes and traverse down into it
// attrs is an array of 2-element Objects of name,value pairs
//
bamba.prototype.$ = function(tag, attrs) {
    var elem = this.selection.append(tag);
    if (attrs == undefined)
	return elem;

    for (k = 0; k < attrs.length; ++k) {
	//
	// split at =.  XXX need to deal with = in value field?
	//
	var a = attrs[k].split('=');
	elem.attr(a[0], a[1]);
    }
    return elem;
};

bamba.prototype.$$ = function(tag, attrs) {
    this.push(this.$(tag, attrs));
    return this;
}

bamba.prototype.a = function() {
    this.$$('a', arguments);
    return this;
}

bamba.prototype.ul = function() {
    this.$$('ul', arguments);
    return this;
}

bamba.prototype.i = function() {
    this.$('i', arguments);
    return this;
}

// insert a span and don't descend
bamba.prototype.span = function() {
    this.$('span', arguments);
    return this;
}

bamba.prototype.div = function() {
    this.$$('div', arguments);
    return this;
};

bamba.prototype.well = function() {
    return this.div('class=well');
};

bamba.prototype.container = function() {
    return this.div('class=container');
};

bamba.prototype.row = function() {
    return this.div('class=row');
};

// really a bootstrap "span", but I find that terminology confusing
bamba.prototype.column = function(grid_width) {
    return this.div('class=span' + grid_width);
};

//
// insert a header tag with text 's' of level 'n'
// e.g., h(2, 'foo') creates '<h2>foo</h2>'
// does not descend
//
bamba.prototype.h = function(n, s) {
    this.selection.append('h' + n).text(s);
    return this;
};

bamba.prototype.hr = function() {
    this.selection.append('hr');
    return this;
};

//
// set an attr on the current selection
//
bamba.prototype.attr = function(name, val) {
    this.selection.attr(name, val);
    return this;
};

//
// set the id on the current selection
//
bamba.prototype.id = function(val) {
    this.attr('id', val);
    return this;
};

//
// set text on the current selection
//
bamba.prototype.text = function(s) {
    this.selection.text(s);
    return this;
};

//
// set inner HTML on the current selection
//
bamba.prototype.html = function(s) {
    this.selection.html(s);
    return this;
};

bamba.prototype.p = function() {
    this.$$('p', arguments);
    return this;
};

bamba.prototype.br = function() {
    this.$$('br', arguments);
    return this;
};

//
// configure an anchor link to do the desired action based on the supplied item info
// which is eihter 'sidebar' or 'navbar' so that sidebar_select or navbar_select
// is invoked in the default case
//
function config_clickable(a, config) {
    if (config.text == '-divider-') {
	a.attr('class', 'divider');
	return;
    }
    if (config.onclick != undefined) {
	if (config.href != undefined) {
	    a.attr('href', config.href);
	}
	a.attr('onclick', config.onclick + ';return false;');
	a.text(config.text);
    } else if (config.href != undefined) {
	a.attr('href', config.href);
	a.text(config.text);
    } else {
	//XXX raise error or allow a default action?  or disable it?
	a.text(config.text);
	return false;
    }
    return true;
}

bamba.prototype.li_items = function(items) {
    var list = this.selection;
    for (k in items) {
	var item = items[k];
	var li = list.append('li');
	if (item.heading != undefined) {
	    li.attr('class', 'nav-header');
	    li.text(item.heading);
	} else if (item.text == '-divider-') {
	    li.attr('class', 'divider');
	} else {
	    if (item.id != undefined) 
		li.attr('id', item.id);

	    var a = li.append('a');
	    config_clickable(a, item);
	}
    }
    return this;
}

bamba.prototype.button_items = function(items) {
    var group = this.selection;
    for (k in items) {
	var item = items[k];
	var button = group.append('button');
	if (item.id != undefined) 
	    button.attr('id', item.id);
	var a = button.append('a');
	config_clickable(a, item);
    }
    return this;
}

//
// build a tabbed menu selector
// tabs is an array of objects that describes the tabs
// each objects has { id, name, onclick }
// active_index is the index of the tab that should initially
// be marked active
//
bamba.prototype.tab_menu = function(tabs) {
    this
      .ul('class=nav nav-tabs')
        .li_items(tabs)
       .pop();
    return this;
};

bamba.prototype.radio_buttons = function(buttons) {
    this
      .div('class=btn-group').attr('data-toggle', 'buttons-radio')
        .button_items(buttons)
       .pop();
    return this;
};

bamba.prototype.navbar = function(app_name, user_name, active_index, user_dropdown, site_items) {
    this
      .div('class=navbar navbar-fixed-top')
        .div('class=navbar-inner')
          .div('class=container-fluid')
            .a('class=btn btn-navbar', 'data-toggle=collapse', 'data-target=.nav-collapse')
              .span('class=icon-bar')
              .span('class=icon-bar')
              .span('class=icon-bar')
             .pop()
            .a('class=brand').text(app_name).pop()
           .div('class=btn-group pull-right')
             .a('class=btn dropdown-toggle', 'data-toggle=dropdown', 'href=#')
               .i('class=icon-user')
               // XXX need to do something about this ugliness 
              .$$('text', []).text(' ' + user_name + ' ').pop()
               .span('class=caret')
              .pop()
             .ul('class=dropdown-menu')
               .li_items(user_dropdown)
              .pop()
            .pop()
           .div('class=nav-collapse')
             .ul('class=nav')
               .li_items(site_items)
              .pop()
            .pop()
          .pop()
        .pop()
      .pop();

    return this;
};

//
// inserts a complete sidebar element into the current bamba selection based
// on the menu headings and items/actions in the elements array
// does not descend
// elements has form [ { heading:'name', list:[{ text:'', href:'' OR onclick:'' } ... ] } ... ]
// XXX need a clean way to enable/disable items and set them as active/inactive
//
bamba.prototype.sidebar = function(items_class, menu_items) {
    this
      .div('class=well sidebar-nav')
        .ul('class=nav nav-list')
          .li_items(menu_items)
         .pop()
       .pop();

    return this;
};

