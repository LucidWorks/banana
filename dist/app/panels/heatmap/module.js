/*! banana-fusion - v1.6.26 - 2020-09-01
 * https://github.com/LucidWorks/banana/wiki
 * Copyright (c) 2020 Andrew Thanalertvisuti; Licensed Apache-2.0 */

define("panels/heatmap/module",["angular","app","underscore","jquery","d3","require"],function(a,b,c,d,e,f){"use strict";var g=a.module("kibana.panels.heatmap",[]);b.useModule(g),g.controller("heatmap",["$scope","dashboard","querySrv","filterSrv",function(b,e,g,h){b.panelMeta={modals:[{description:"Inspect",icon:"icon-info-sign",partial:"app/partials/inspector.html",show:b.panel.spyable}],editorTabs:[{title:"Queries",src:"app/partials/querySelect.html"}],status:"Experimental",description:"Heat Map for Representing Pivot Facet Counts",rotate:!0};var i={queries:{mode:"all",ids:[],query:"*:*",custom:""},size:0,row_field:"start_station_name",col_field:"gender",row_size:300,editor_size:0,color:"gray",spyable:!0,transpose_show:!0,transposed:!1,show_queries:!0};c.defaults(b.panel,i),b.requireContext=f,b.init=function(){b.panel.editor_size=b.panel.row_size,b.generated_id="tooltip_"+b.randomNumberRange(1,1e6),b.$on("refresh",function(){b.get_data()}),b.get_data()},b.randomNumberRange=function(a,b){return Math.floor(Math.random()*(b-a+1)+a)},b.get_data=function(){b.panelMeta.loading=!0,delete b.panel.error;var a,d;b.sjs.client.server(e.current.solr.server+e.current.solr.core_name),b.panel.queries.ids=g.idsByMode(b.panel.queries);var f=b.sjs.BoolQuery();c.each(b.panel.queries.ids,function(a){f=f.should(g.getEjsObj(a))}),a=b.sjs.Request(),a=a.query(b.sjs.FilteredQuery(f,h.getBoolFilter(h.ids))).size(b.panel.size),b.populate_modal(a);var i="";h.getSolrFq()&&(i="&"+h.getSolrFq());var j="&wt=json",k="&rows="+b.panel.size,l="&facet=true",m="&facet.pivot="+b.panel.row_field+","+b.panel.col_field,n="&facet.limit="+b.panel.row_size,o="&facet.pivot.mincount=0";b.panel.queries.query=g.getORquery()+i+j+k+l+m+n+o,a=null!=b.panel.queries.custom?a.setQuery(b.panel.queries.query+b.panel.queries.custom):a.setQuery(b.panel.queries.query),d=a.doSearch(),d.then(function(a){if(!c.isUndefined(a.error))return b.panel.error=b.parse_error(a.error.msg),b.init_arrays(),void b.render();var d=a.facet_counts.facet_pivot,e=Object.keys(d)[0];b.facets=d[e],b.init_arrays(),b.formatData(b.facets,b.panel.transposed),b.render()}),b.panelMeta.loading=!1},b.init_arrays=function(){b.data=[],b.row_labels=[],b.col_labels=[],b.hcrow=[],b.hccol=[],b.internal_sum=[],b.domain=[Number.MAX_VALUE,0]},b.formatData=function(a,d){b.init_arrays(),c.each(a,function(a,e){d?(b.col_labels.push(a.value),b.hccol.push(b.col_labels.length)):(b.row_labels.push(a.value),b.hcrow.push(b.row_labels.length)),c.each(a.pivot,function(a){var c,f={},g=a.value;d?(b.row_labels.indexOf(g)===-1&&(b.row_labels.push(g),b.hcrow.push(b.row_labels.length)),c=b.row_labels.indexOf(g),b.internal_sum[c]+=a.count,f.col=e+1,f.row=c+1):(b.internal_sum.push(0),b.col_labels.indexOf(g)===-1&&(b.col_labels.push(g),b.hccol.push(b.col_labels.length)),c=b.col_labels.indexOf(g),b.internal_sum[c]+=a.count,f.row=e+1,f.col=c+1),f.value=a.count,b.domain[0]=Math.min(b.domain[0],a.count),b.domain[1]=Math.max(b.domain[1],a.count),b.data.push(f)})})},b.flip=function(){b.panel.transposed=!b.panel.transposed,b.formatData(b.facets,b.panel.transposed),b.render()},b.set_refresh=function(a){b.refresh=a},b.close_edit=function(){var a=b.validateLimit();a&&b.refresh?(b.panel.row_size=b.panel.editor_size,b.get_data(),b.formatData(b.facets,b.panel.transposed),b.render()):a||alert("invalid rows number"),b.refresh=!1},b.render=function(){b.$emit("render")},b.populate_modal=function(c){b.inspector=a.toJson(JSON.parse(c.toString()),!0)},b.validateLimit=function(){var a=d("#rows_limit"),c=+a.attr("min"),e=+a.attr("max"),f=+a.attr("value"),g=f>=c&&f<=e;return g||a.attr("value",b.panel.row_size),g}}]),g.directive("heatmapChart",function(){return{restrict:"E",link:function(b,f){function g(){function a(a){return a>=0?e.hsl(v).darker(s(a)):e.hsl(v).brighter(s(-a))}function g(a,c,d){for(var f=E.transition().duration(1200),g=[],h=0;h<x;h++)g.push(0);var i;e.selectAll(".c"+a+c+"_"+b.generated_id).filter(function(b){"r"===a?g[b.col-1]=b.value:g[b.row-1]=b.value}),"r"===a?(i=e.range(x).sort(function(a,b){var c;return d?(c=g[b]-g[a],c=isNaN(c)?1/0:c):(c=g[a]-g[b],c=isNaN(c)?1/0:c),c}),f.selectAll(".cell_"+b.generated_id).attr("x",function(a){return i.indexOf(a.col-1)*w}),f.selectAll(".colLabel_"+b.generated_id).attr("y",function(a,b){return i.indexOf(b)*w})):(i=e.range(y).sort(function(a,b){var c;return d?(c=g[b]-g[a],c=isNaN(c)?1/0:c):(c=g[a]-g[b],c=isNaN(c)?1/0:c),c}),f.selectAll(".cell_"+b.generated_id).attr("y",function(a){return i.indexOf(a.row-1)*w}),f.selectAll(".rowLabel_"+b.generated_id).attr("y",function(a,b){return i.indexOf(b)*w}))}f.html('<div id="'+b.generated_id+'" class="popup hidden"><p><span id="value"></p></div>');var h=f[0],i=jQuery.extend(!0,[],b.data),j=[],k=e.scale.linear().domain(b.domain).range([0,10]);c.each(b.internal_domain,function(a){var b=e.scale.linear().domain(a).range([0,10]);j.push(b)}),i=c.map(i,function(a){return{row:+a.row,col:+a.col,value:+k(a.value)}});var l,m,n,o,p={top:70,right:10,bottom:20,left:100},q=!1,r=!1,s=e.scale.linear().domain([0,300]).range([0,3]),t=e.range(11),u=e.scale.linear().domain([0,10]).range([-255,255]),v=b.panel.color;l=jQuery.extend(!0,[],b.hcrow),m=jQuery.extend(!0,[],b.hccol),n=jQuery.extend(!0,[],b.row_labels),o=jQuery.extend(!0,[],b.col_labels);var w=15,x=o.length,y=n.length,z=w*x,A=w*y,B=[];c.each(t,function(b){B.push(a(u(b)).toString())});var C=e.scale.quantile().domain([0,10]).range(B),D=d("<div>"),E=e.select(h).append("svg").attr("width",z+p.left+p.right).attr("height",A+p.top+p.bottom).append("g").attr("transform","translate("+p.left+","+p.top+")");E.append("g").selectAll(".rowLabelg").data(n).enter().append("text").text(function(a){return a.length>8?a.substring(0,8)+"..":a}).attr("x",0).attr("y",function(a,b){return l.indexOf(b+1)*w}).style("text-anchor","end").attr("transform","translate(-6,"+w/1.5+")").attr("class",function(a,c){return"rowLabel_"+b.generated_id+" mono r"+c}).on("mouseover",function(a){e.select(this).classed("text-hover",!0),D.html(a).place_tt(e.event.pageX,e.event.pageY)}).on("mouseout",function(){e.select(this).classed("text-hover",!1),e.select(this).classed("cell-hover",!1),e.selectAll(".rowLabel_"+b.generated_id).classed("text-highlight",!1),e.selectAll(".colLabel_"+b.generated_id).classed("text-highlight",!1),D.detach()}).on("click",function(a,b){q=!q,g("r",b,q)}),E.append("g").selectAll(".colLabelg").data(o).enter().append("text").text(function(a){return a.length>6?a.substring(0,6)+"..":a}).attr("x",0).attr("y",function(a,b){return m.indexOf(b+1)*w}).style("text-anchor","left").attr("transform","translate("+w/2+",-6) rotate (-90)").attr("class",function(a,c){return"colLabel_"+b.generated_id+" mono c"+c}).on("mouseover",function(a){e.select(this).classed("text-hover",!0),D.html(a).place_tt(e.event.pageX,e.event.pageY)}).on("mouseout",function(){e.select(this).classed("text-hover",!1),e.select(this).classed("cell-hover",!1),e.selectAll(".rowLabel_"+b.generated_id).classed("text-highlight",!1),e.selectAll(".colLabel_"+b.generated_id).classed("text-highlight",!1),D.detach()}).on("click",function(a,b){r=!r,g("c",b,r)}),E.append("g").attr("class","g3").selectAll(".cellg").data(i,function(a){return a.row+":"+a.col}).enter().append("rect").attr("x",function(a){return m.indexOf(a.col)*w}).attr("y",function(a){return l.indexOf(a.row)*w}).attr("class",function(a){return"cell_"+b.generated_id+" cell-border cr"+(a.row-1)+"_"+b.generated_id+" cc"+(a.col-1)+"_"+b.generated_id}).attr("width",w).attr("height",w).style("fill",function(a){return C(a.value)}).on("mouseover",function(a,c){e.select(this).classed("cell-hover",!0),e.selectAll(".rowLabel_"+b.generated_id).classed("text-highlight",function(b,c){return c===a.row-1}),e.selectAll(".colLabel_"+b.generated_id).classed("text-highlight",function(b,c){return c===a.col-1}),D.html(n[a.row-1]+","+o[a.col-1]+" ("+b.data[c].value+")").place_tt(e.event.pageX,e.event.pageY)}).on("mouseout",function(){e.select(this).classed("cell-hover",!1),e.selectAll(".rowLabel_"+b.generated_id).classed("text-highlight",!1),e.selectAll(".colLabel_"+b.generated_id).classed("text-highlight",!1),D.detach()})}b.$on("render",function(){g()}),a.element(window).bind("resize",function(){g()})}}})});