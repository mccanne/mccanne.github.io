// Copyright (c) 2012 Riverbed Technology; all rights reserved


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

	
