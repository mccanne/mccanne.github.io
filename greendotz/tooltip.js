tooltip={};tooltip.init=function(){this.div=d3.select("body").append("div").style("position","absolute").style("z-index","10").style("visibility","hidden").style("color","white").text("a simple tooltip");this.locked=false};tooltip.travel=function(){var b=(d3.event.pageY-10)+"px";var a=(d3.event.pageX+10)+"px";this.div.style("top",b).style("left",a)};tooltip.enable=function(a,b){if(!this.locked){this.div.text(b);this.div.style("visibility","visible");this.item=a;this.item.attr("stroke-width","2px");this.travel()}};tooltip.disable=function(){if(!this.locked){this.div.style("visibility","hidden");if(this.item!=undefined){this.item.attr("stroke-width","0.75px");this.item=undefined}d3.selectAll(".remove-with-tooltip").remove()}};tooltip.disable_no_stroke=function(){if(!this.locked){this.div.style("visibility","hidden");this.item=undefined;d3.selectAll(".remove-with-tooltip").remove()}};tooltip.lock=function(){this.locked=true};tooltip.unlock=function(){this.locked=false};tooltip.break_lock=function(){if(this.locked){this.locked=false;this.disable()}};