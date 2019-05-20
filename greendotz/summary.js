function center_text(e,g,h,f,a,j,m,d){var c=h+a/2;var b=f+j/2;var i=e.append("text").attr("x",c).attr("y",b).attr("text-anchor","middle").attr("font-weight",d).attr("font-size",m).text(g);var l=parseInt(i.style("height"));i.attr("y",b+l/4);return i}function data_box_text(f,o,m,a,n){var i=f.append("g");var e=i.append("text").attr("id",a+n).attr("x",o).attr("y",m).attr("text-anchor","middle").attr("font-weight","bold").attr("font-size","180%").attr("fill","#444").attr("stroke","none").attr("opacity",0.4).text("256");var h=i.append("text").attr("x",o).attr("y",m).attr("text-anchor","middle").attr("font-weight","bold").attr("font-size","90%").attr("fill","#444").attr("stroke","none").attr("opacity",0.8).text(n);var b=parseInt(e.style("height"));var j=parseInt(e.style("width"));var p=parseInt(h.style("height"));var c=parseInt(h.style("width"));var d=b+1.5*p;var l=Math.max(j,c);e.attr("x",o+l/2);e.attr("y",m+b);h.attr("x",o+l/2);h.attr("y",m+b+p);if(0){i.append("rect").attr("x",o).attr("y",m).attr("width",l).attr("height",d).attr("fill","none").attr("stroke","black")}return{box:i,width:l,height:d}}function summary_data_box(g,a,o,l,b,e){var m=g.append("rect").attr("x",o).attr("y",l).attr("width",b).attr("height",100).attr("fill",e).attr("opacity",0.75);var i=data_box_text(g,o,l,a,"low");var h=data_box_text(g,o,l,a,"average");var d=data_box_text(g,o,l,a,"high");var j=Math.max(i.width,h.width,d.width);var f=Math.max(i.height,h.height,d.height);var c=b-3*j;if(c<0){log("summary box too narrow");return}var n=c/4;i.box.attr("transform",fmt_translate(n,0));h.box.attr("transform",fmt_translate(2*n+j,0));d.box.attr("transform",fmt_translate(3*n+2*j,0));m.attr("height",f);return f}function label_rect(e,h,i,g,a,n,c,d){var f=e.append("rect").attr("x",i).attr("y",g).attr("width",a).attr("height",10).attr("fill",c).attr("opacity",0.75);var l=e.append("text").attr("x",i+a/2).attr("y",g).attr("text-anchor","middle").attr("font-weight",d).attr("font-size",n).attr("opacity",0.8).attr("fill","#444").attr("streok","none").text(h);var b=parseInt(l.style("width"));var m=parseInt(l.style("height"));log(b+" x "+m);var j=m*2;f.attr("height",j);l.attr("y",g+1.25*m);return j}function build_mini_scale(j,i,c,m,l,d){var g=daterange.edate;var e=d3.time.day.offset(g,-90);var b=10;var a=d3.scale.linear().domain([e,g]).range([j+b,j+c-b]);var h={min:l,max:d};var f=d3.scale.linear().domain([h.min,h.max]).range([i+m*0.85,i+m*0.15]);return{xscale:a,yscale:f,xrange:{min:e,max:g},yrange:h}}function map_ts_to_array(a){ts_out=[];for(k in a){ts_out[midnight(a[k].x)]=a[k]}return ts_out}var all_graphs;function draw_mini_graph(r,m,l,t,q,u,A,j,B,i,c,s){var w=A.xrange.min;var f=A.xrange.max;var e=r.append("rect").attr("x",m).attr("y",l).attr("width",t).attr("height",q).attr("fill",u).attr("opacity",0.75);for(k in j){var b=j[k];r.append("svg:line").attr("x1",A.xscale(w)).attr("y1",A.yscale(b)).attr("x2",A.xscale(f)).attr("y2",A.yscale(b)).attr("opacity",0.6).attr("stroke-dasharray","3,1").attr("stroke","#555");r.append("svg:text").attr("x",A.xscale(w)).attr("y",A.yscale(b)).attr("dy","-0.4em").attr("opacity",0.8).attr("fill","#333").attr("stroke","none").attr("font-size","75%").text(b)}var o=r.append("svg:text").attr("x",A.xscale(f)).attr("y",A.yscale(A.yrange.max)).attr("fill","#444").attr("stroke","none").attr("font-size","90%").attr("text-anchor","end").text(B);var n=parseInt(o.style("height"));var h=first_of_months_between(w,f);for(k in h){var z=h[k];var g=month_of_year[z.getMonth()];r.append("svg:text").attr("x",A.xscale(z)).attr("y",A.yscale(A.yrange.min)).attr("dy","1.5em").attr("fill","#333").attr("stroke","none").attr("font-size","75%").attr("text-anchor","middle").text(g)}i(r);var v=r.append("svg:line").attr("class","mini-highlighter").attr("x1",A.xscale(w)).attr("y1",A.yscale(j[0])).attr("x2",A.xscale(w)).attr("y2",A.yscale(j[j.length-1])).attr("opacity",0.8).attr("stroke-dasharray","3,1").attr("stroke-width","1.5px").attr("stroke","black").attr("visibility","hidden");var a=r.append("svg:circle").attr("class","mini-highlighter").attr("cx",A.xscale(w)).attr("cy",A.yscale(A.yrange.min)).attr("r",3).attr("opacity",0.8).attr("stroke","black").attr("fill","none").attr("visibility","hidden");log("X");var p=r.append("rect").attr("class","top-highlighter").attr("x",m).attr("y",l).attr("width",t).attr("height",q).attr("opacity",0);all_graphs.push(p);p.update_highlighter=function(C){v.attr("visibility","visible");var d=A.xscale(C);v.attr("x1",d);v.attr("x2",d);a.attr("cx",d);var D=c[midnight(C)];var E=D.y;if(E==undefined){a.attr("visibility","hidden")}else{a.attr("visibility","visible");a.attr("cy",A.yscale(E))}d3.select("#"+s+"average").text(Math.round(D.y));d3.select("#"+s+"high").text(Math.round(D.max));d3.select("#"+s+"low").text(Math.round(D.min))};p.on("dblclick",function(G,D){log("DOUBLE");var C=d3.svg.mouse(this);var F=C[0];var y=A.xscale.invert(F);var E=new Date();E.setTime(y);log(E);build_dashboard();view_set_date(E);dbd.click_to_detailed(noon(E))});p.on("mouseout",function(y,x){e.attr("stroke","none");d3.selectAll(".mini-highlighter").attr("visibility","hidden")});p.on("mousemove",function(I,F){e.attr("stroke","black");var D=d3.svg.mouse(this);var H=D[0];var C=A.xscale.invert(H);var G=new Date();G.setTime(C);var E;for(E in all_graphs){all_graphs[E].update_highlighter(G)}return;d3.selectAll(".top-highlighter").each(function(M,L){log(G);var K=A.xscale(G);v.attr("x1",K);v.attr("x2",K);a.attr("cx",K);var N=c[midnight(G)].y;if(N==undefined){a.attr("visibility","hidden")}else{a.attr("visibility","visible");a.attr("cy",A.yscale(N))}});return;var C=A.xscale(G);v.attr("x1",C);v.attr("x2",C);a.attr("cx",C);var J=c[midnight(G)].y;if(J==undefined){a.attr("visibility","hidden")}else{a.attr("visibility","visible");a.attr("cy",A.yscale(J))}})}function summary_box(e,E,D,a,I,u,L){var v=label_rect(e,I,E,D,a,"135%",u,"bold");var m=73;var G=2;var t=summary_data_box(e,I,E,D+v+G,a,u);var s=150;var H=D+v+t+2*G;e.append("rect").attr("x",E).attr("y",D+v+t+s+3*G).attr("width",a).attr("height",300).attr("fill",u).attr("opacity",0.75);if(I=="Sugar"){var h=40;var F=270;var A=build_mini_scale(E,H,a,s,h,F);var K=telemetry.mean_BG(A.xrange.min,A.xrange.max);var c=d3.svg.line().x(function(x){return A.xscale(x.x)}).y(function(x){return A.yscale(x.y)}).interpolate("linear");var z=[50,100,150,200,250];var d=function(x){x.append("svg:path").attr("class","bg_summary").attr("stroke","darkgreen").attr("fill","none").attr("opacity",0.8).attr("d",c(K))};var b=map_ts_to_array(K);draw_mini_graph(e,E,H,a,s,u,A,z,"sugar trend",d,b,I);var o=b[daterange.edate];d3.select("#Sugaraverage").text(Math.round(o.y));d3.select("#Sugarhigh").text(Math.round(o.max));d3.select("#Sugarlow").text(Math.round(o.min))}if(I=="Carbs"){var M=0;var r=450;var A=build_mini_scale(E,H,a,s,M,r);var K=telemetry.carb_consumption(A.xrange.min,A.xrange.max);var j=d3.svg.area().x(function(x){return A.xscale(x.x)}).y0(function(x){return A.yscale(0)}).y1(function(x){return A.yscale(x.y)}).interpolate("step-after");var d=function(x){x.append("svg:path").attr("class","carb_summary").attr("stroke","none").attr("fill","red").attr("opacity",0.4).attr("d",j(K))};var b=map_ts_to_array(K);var C=[0,100,200,300,400];draw_mini_graph(e,E,H,a,s,u,A,C,"carb trend",d,b,I)}if(I=="Insulin"){var f=0;var B=65;var A=build_mini_scale(E,H,a,s,f,B);var q=A.xrange.min;var i=A.xrange.max;var l=telemetry.basal_usage(q,i);var g=telemetry.bolus_usage(q,i);if(l.length!=g.length){log("basal and bolus time series need to match");return}var K=[];var J;for(J=0;J<g.length;J++){g[J].y0=l[J].y;K[J]={x:g[J].x,y:(g[J].y+l[J].y)}}var n=d3.svg.area().x(function(x){return A.xscale(x.x)}).y0(function(x){return A.yscale(0)}).y1(function(x){return A.yscale(x.y)}).interpolate("step-after");var p=d3.svg.area().x(function(x){return A.xscale(x.x)}).y0(function(x){return A.yscale(x.y0)}).y1(function(x){return A.yscale(x.y0+x.y)}).interpolate("step-after");var d=function(x){x.append("svg:path").attr("class","insulin_summary").attr("stroke","none").attr("fill","darkblue").attr("opacity",0.4).attr("d",n(l));x.append("svg:path").attr("class","insulin_summary").attr("stroke","none").attr("fill","blue").attr("opacity",0.4).attr("d",p(g))};var w=[0,20,40,60];draw_mini_graph(e,E,H,a,s,u,A,w,"insulin trend",d,map_ts_to_array(K),I)}}function draw_summary(){var a=d3.select("#d3-summary").append("svg").attr("width",920).attr("height",570);a.append("rect").attr("x",2).attr("y",2).attr("width",916).attr("height",550).attr("fill","#f5f5f5");a.append("text").attr("x",20).attr("y",32).attr("font-weight","bold").attr("font-size","165%").text("Electra's Summary (work in progress)");var c=20;var b=(920-4*c)/3;var d=65;all_graphs=[];summary_box(a,c,d,b,"Sugar","lightgreen",{avg:176,low:66,high:412});summary_box(a,2*c+b,d,b,"Insulin","lightblue",{avg:"32u",low:"28u",high:"45u"});summary_box(a,3*c+2*b,d,b,"Carbs","lightpink",{avg:"84g",low:"55g",high:"155g"})};