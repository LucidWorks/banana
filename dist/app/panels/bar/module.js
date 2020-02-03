/*! banana-fusion - v1.6.24 - 2020-02-03
 * https://github.com/LucidWorks/banana/wiki
 * Copyright (c) 2020 Andrew Thanalertvisuti; Licensed Apache-2.0 */

!function(a,b){"use strict";"function"==typeof define&&define.amd?define("panels/bar/d3.tip",["d3"],b):"object"==typeof module&&module.exports?module.exports=function(a){return a.tip=b(a),a.tip}:a.d3.tip=b(a.d3)}(this,function(a){"use strict";return function(){function b(a){v=o(a),w=v.createSVGPoint(),document.body.appendChild(u)}function c(){return"n"}function d(){return[0,0]}function e(){return" "}function f(){var a=q();return{top:a.n.y-u.offsetHeight,left:a.n.x-u.offsetWidth/2}}function g(){var a=q();return{top:a.s.y,left:a.s.x-u.offsetWidth/2}}function h(){var a=q();return{top:a.e.y-u.offsetHeight/2,left:a.e.x}}function i(){var a=q();return{top:a.w.y-u.offsetHeight/2,left:a.w.x-u.offsetWidth}}function j(){var a=q();return{top:a.nw.y-u.offsetHeight,left:a.nw.x-u.offsetWidth}}function k(){var a=q();return{top:a.ne.y-u.offsetHeight,left:a.ne.x}}function l(){var a=q();return{top:a.sw.y,left:a.sw.x-u.offsetWidth}}function m(){var a=q();return{top:a.se.y,left:a.e.x}}function n(){var b=a.select(document.createElement("div"));return b.style({position:"absolute",top:0,opacity:0,"pointer-events":"none","box-sizing":"border-box"}),b.node()}function o(a){return a=a.node(),"svg"===a.tagName.toLowerCase()?a:a.ownerSVGElement}function p(){return null===u&&(u=n(),document.body.appendChild(u)),a.select(u)}function q(){for(var b=x||a.event.target;"undefined"==typeof b.getScreenCTM&&"undefined"===b.parentNode;)b=b.parentNode;var c={},d=b.getScreenCTM(),e=b.getBBox(),f=e.width,g=e.height,h=e.x,i=e.y;return w.x=h,w.y=i,c.nw=w.matrixTransform(d),w.x+=f,c.ne=w.matrixTransform(d),w.y+=g,c.se=w.matrixTransform(d),w.x-=f,c.sw=w.matrixTransform(d),w.y-=g/2,c.w=w.matrixTransform(d),w.x+=f,c.e=w.matrixTransform(d),w.x-=f/2,w.y-=g/2,c.n=w.matrixTransform(d),w.y+=g,c.s=w.matrixTransform(d),c}var r=c,s=d,t=e,u=n(),v=null,w=null,x=null;b.show=function(){var a=Array.prototype.slice.call(arguments);a[a.length-1]instanceof SVGElement&&(x=a.pop());var c,d=t.apply(this,a),e=s.apply(this,a),f=r.apply(this,a),g=p(),h=z.length,i=document.documentElement.scrollTop||document.body.scrollTop,j=document.documentElement.scrollLeft||document.body.scrollLeft;for(g.html(d).style({opacity:1,"pointer-events":"all"});h--;)g.classed(z[h],!1);return c=y.get(f).apply(this),g.classed(f,!0).style({top:c.top+e[0]+i+"px",left:c.left+e[1]+j+"px"}),b},b.hide=function(){var a=p();return a.style({opacity:0,"pointer-events":"none"}),b},b.attr=function(c,d){if(arguments.length<2&&"string"==typeof c)return p().attr(c);var e=Array.prototype.slice.call(arguments);return a.selection.prototype.attr.apply(p(),e),b},b.style=function(c,d){if(arguments.length<2&&"string"==typeof c)return p().style(c);var e=Array.prototype.slice.call(arguments);return a.selection.prototype.style.apply(p(),e),b},b.direction=function(c){return arguments.length?(r=null==c?c:a.functor(c),b):r},b.offset=function(c){return arguments.length?(s=null==c?c:a.functor(c),b):s},b.html=function(c){return arguments.length?(t=null==c?c:a.functor(c),b):t},b.destroy=function(){return u&&(p().remove(),u=null),b};var y=a.map({n:f,s:g,e:h,w:i,nw:j,ne:k,sw:l,se:m}),z=y.keys();return b}}),define("panels/bar/module",["angular","app","underscore","jquery","kbn","d3","./d3.tip"],function(a,b,c,d,e,f,g){"use strict";var h=a.module("kibana.panels.bar",[]);b.useModule(h),h.controller("bar",["$scope","querySrv","dashboard","filterSrv",function(b,d,e,f){b.panelMeta={modals:[{description:"Inspect",icon:"icon-info-sign",partial:"app/partials/inspector.html",show:b.panel.spyable}],editorTabs:[{title:"Queries",src:"app/partials/querySelect.html"}],status:"Experimental",description:"Display the D3 Bar Chart with Tooltip."};var g={queries:{mode:"all",query:"*:*",custom:""},field:"",size:10,spyable:!0,show_queries:!0,error:""};c.defaults(b.panel,g),b.init=function(){b.hits=0,b.$on("refresh",function(){b.get_data()}),b.get_data()},b.get_data=function(){if(0!==e.indices.length){delete b.panel.error,b.panelMeta.loading=!0;var g,h;b.sjs.client.server(e.current.solr.server+e.current.solr.core_name),g=b.sjs.Request().indices(e.indices),b.panel.queries.ids=d.idsByMode(b.panel.queries),b.inspector=a.toJson(JSON.parse(g.toString()),!0);var i="";f.getSolrFq()&&""!==f.getSolrFq()&&(i="&"+f.getSolrFq());var j="&wt=json",k="&rows=0",l="&facet=true&facet.field="+b.panel.field+"&facet.limit="+b.panel.size;b.panel.queries.query=d.getORquery()+j+k+i+l,g=null!=b.panel.queries.custom?g.setQuery(b.panel.queries.query+b.panel.queries.custom):g.setQuery(b.panel.queries.query),h=g.doSearch(),h.then(function(a){if(!c.isUndefined(a.error))return void(b.panel.error=b.parse_error(a.error.msg));var d=0,e=0;b.panelMeta.loading=!1,b.hits=a.response.numFound,b.data=[],b.maxRatio=0,b.yaxis_min=0,c.each(a.facet_counts.facet_fields,function(a){for(var c=0;c<a.length;c++){var f=a[c];c++;var g=a[c];if(d+=g,null===f)e=g;else{if(0===g)continue;var h={letter:f,frequency:g};g/b.hits>b.maxRatio&&(b.maxRatio=g/b.hits),b.data.push(h)}}}),b.$emit("render")})}},b.build_search=function(a){a&&(f.set({type:"terms",field:b.panel.field,value:a,mandate:"must"}),e.refresh())},b.set_refresh=function(a){b.refresh=a,"count"===b.panel.mode&&(b.panel.decimal_points=0)},b.close_edit=function(){b.refresh&&b.get_data(),b.refresh=!1,b.$emit("render")}}]),h.directive("barChart",function(){return{restrict:"A",link:function(b,c){function d(){c.html("");var a=c.parent().width(),d=parseInt(b.row.height),e={top:40,right:20,bottom:60,left:40};a=a-e.left-e.right,d=d-e.top-e.bottom;var h=f.format(".0"),i=f.scale.ordinal().rangeRoundBands([15,a],.1),j=f.scale.linear().range([d,0]),k=f.svg.axis().scale(i).orient("bottom"),l=f.svg.axis().scale(j).orient("left").tickFormat(h),m=f.select(c[0]).append("svg").attr("width",a+e.left+e.right).attr("height",d+e.top+e.bottom).append("g").attr("transform","translate("+e.left+","+e.top+")"),n=g().attr("class","d3-tip").offset([-10,0]).html(function(a){return"<strong>Frequency:</strong> <span style='color:red'>"+a.frequency+"</span>"});m.call(n),i.domain(b.data.map(function(a){return a.letter})),j.domain([0,f.max(b.data,function(a){return a.frequency})]),m.append("g").attr("class","x axis").attr("transform","translate(0,"+d+")").call(k).selectAll("text").style("text-anchor","end").attr("dx","-.8em").attr("dy","-.55em").attr("transform","rotate(-60)"),m.append("g").attr("class","y axis").call(l).append("text").attr("transform","rotate(-90)").attr("y",6).attr("dy",".71em").style("text-anchor","end").text("Frequency"),m.selectAll(".bar").data(b.data).enter().append("rect").attr("class","d3bar").attr("x",function(a){return i(a.letter)}).attr("width",i.rangeBand()).attr("y",function(a){return j(a.frequency)}).attr("height",function(a){return d-j(a.frequency)}).on("mouseover",n.show).on("mouseout",n.hide).on("click",function(a){n.hide(),b.build_search(a.letter)})}b.$on("render",function(){d()}),a.element(window).bind("resize",function(){d()})}}})});