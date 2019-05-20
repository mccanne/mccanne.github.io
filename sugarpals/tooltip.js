// Copyright (c) 2012 Riverbed Technology; all rights reserved

// create a div for a tooltip on the main body
tooltip = {};
//XXX do this in an init function... or make into proper class
tooltip.init = function() {
    this.div = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .style('color', 'white')
      .text('a simple tooltip');

    this.locked = false;
};

//
// position the tooltip at the current mouse location
//
tooltip.travel = function() {
    //position tooltip
    //XXX where does offset of 10 come from?
    var top = (d3.event.pageY-10)+'px';
    var left = (d3.event.pageX+10)+'px';
    this.div.style('top', top).style('left', left);
}

//
// called when mousing over an item that should have a tooltip raised
// for it.  if another item has the tip locked, then we don't allow changes
//
tooltip.enable = function(item, msg) {
    if (!this.locked) {
	this.div.text(msg);
	this.div.style('visibility', 'visible');
	this.item = item;
	// highlight this object with white outline
	this.div.attr('stroke', 'white');
	this.travel();
    }
};

tooltip.disable = function() {
    if (!this.locked) {
	this.div.style('visibility', 'hidden');
	this.div.attr('stroke', 'none');
	this.item = undefined;
    }
};

tooltip.lock = function() {
    this.locked = true;
};

tooltip.unlock = function() {
    this.locked = false;
};

tooltip.break_lock = function() {
    if (this.locked) {
	this.locked = false;
	this.disable();
    }
};
