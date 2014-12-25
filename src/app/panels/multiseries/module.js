/*

  ## Multiseries Panel

*/
define([
    'angular',
    'app',
    'underscore',
    'jquery',
    'd3'
], function(angular, app, _, $, d3) {
    'use strict';

    var module = angular.module('kibana.panels.multiseries', []);
    app.useModule(module);

    module.controller('multiseries', function ($scope, dashboard, querySrv, filterSrv) {
        $scope.panelMeta = {
            modals: [
                {
                    description: "Inspect",
                    icon: "icon-info-sign",
                    partial: "app/partials/inspector.html",
                    show: $scope.panel.spyable
        }
      ],
            editorTabs: [
                {
                    title: 'Queries',
                    src: 'app/partials/querySelect.html'
        }
      ],
            status: "Experimental",
            description: "Multiseries Chart panel draws charts related to your dataset, but fields to be plotted together must be from the same type (for now). You have to define your own fl of fields to be plotted. Now data must have X-Axis as Date and Y-Axis must have values, if not it will be discarded"
        };

        // default values
        var _d = {
            queries: {
                mode: 'all',
                ids: [],
                query: '*:*',
                custom: ''
            },
            size: 1000,
            max_rows: 10000, // maximum number of rows returned from Solr
            field: 'timestamp',
            // xAxis: 'Date',  // TODO: remove it, does not seem to get used.
            yAxis: 'Rates',
            right_yAxis: 'Volume (10K)',
            fl: 'open,high,low,close',
            right_fl: 'volume', // TODO: need to remove hard coded field (volume).
            spyable: true,
            show_queries: true,
            interpolate: 'basis',
            right_interpolate: 'basis',
            rightYEnabled: false
        };

        _.defaults($scope.panel, _d);

        $scope.init = function() {
            $scope.$on('refresh', function() {
                $scope.get_data();
            });
            $scope.get_data();
        };

        $scope.get_data = function() {
            // Show progress by displaying a spinning wheel icon on panel
            $scope.panelMeta.loading = true;

            var request, results;
            // Set Solr server
            $scope.sjs.client.server(dashboard.current.solr.server + dashboard.current.solr.core_name);

            // -------------------- TODO: REMOVE ALL ELASTIC SEARCH AFTER FIXING SOLRJS --------------
            $scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);
            // This could probably be changed to a BoolFilter
            var boolQuery = $scope.sjs.BoolQuery();
            _.each($scope.panel.queries.ids, function(id) {
                boolQuery = boolQuery.should(querySrv.getEjsObj(id));
            });

            request = $scope.sjs.Request();

            request = request.query(
                    $scope.sjs.FilteredQuery(
                        boolQuery,
                        filterSrv.getBoolFilter(filterSrv.ids)
                    ))
                .size($scope.panel.size); // Set the size of query result

            $scope.populate_modal(request);
            // --------------------- END OF ELASTIC SEARCH PART ---------------------------------------

            // Construct Solr query
            var fq = '';
            if (filterSrv.getSolrFq() && filterSrv.getSolrFq() != '') {
                fq = '&' + filterSrv.getSolrFq();
            }
            var wt_json = '&wt=json';
            // var fl = '&fl=date,' + $scope.panel.field + ',' + $scope.panel.fl + ',' + $scope.panel.rightAxis;
            // NOTE: $scope.panel.field is the time field for x-Axis
            // TODO: need to rename to $scope.panel.timefield
            var fl = '&fl=' + $scope.panel.field + ',' + $scope.panel.fl + ',' + $scope.panel.right_fl;
            var rows_limit = '&rows=' + $scope.panel.max_rows;
            var sort = '&sort=' + $scope.panel.field + ' asc';

            $scope.panel.queries.query = querySrv.getQuery(0) + fq + fl + wt_json + rows_limit + sort;

            // Set the additional custom query
            if ($scope.panel.queries.custom != null) {
                request = request.setQuery($scope.panel.queries.query + $scope.panel.queries.custom);
            } else {
                request = request.setQuery($scope.panel.queries.query);
            }

            // Execute the search and get results
            results = request.doSearch();

            // Populate scope when we have results
            results.then(function (results) {
                // build $scope.data array
                $scope.data = results.response.docs;
                $scope.render();
            });

            // Hide the spinning wheel icon
            $scope.panelMeta.loading = false;
        };

        $scope.set_refresh = function(state) {
            $scope.refresh = state;
        };

        $scope.close_edit = function() {
            if ($scope.refresh) {
                $scope.get_data();
            }
            $scope.refresh = false;
            $scope.$emit('render');
        };

        $scope.render = function() {
            $scope.$emit('render');
        };

        $scope.populate_modal = function(request) {
            $scope.inspector = angular.toJson(JSON.parse(request.toString()), true);
        };

        $scope.pad = function(n) {
            return (n < 10 ? '0' : '') + n;
        };

    });

    module.directive('multiseriesChart', function() {
        return {
            restrict: 'E',
            link: function(scope, element) {

                scope.$on('render', function() {
                    render_panel();
                });

                angular.element(window).bind('resize', function() {
                    render_panel();
                });

                // Function for rendering panel
                function render_panel() {
                    element.html("");

                    var el = element[0];

                    // deepcopy of the data in the scope
                    var data;
                    data = jQuery.extend(true, [], scope.data); // jshint ignore: line

                    if (d3.keys(data[0]).indexOf(scope.panel.field) === -1) {
                        return;
                    }

                    var parent_width = $("#multiseries").width(),
                        aspectRatio = 400 / 600;

                    var margin = {
                            top: 20,
                            right: 80,
                            bottom: 30,
                            left: 50
                        },
                        width = parent_width - margin.left - margin.right,
                        height = (parent_width * aspectRatio) - margin.top - margin.bottom;

                    // The need for two date parsers is that sometimes solr removes the .%L part if it equals 000
                    // So double checking to make proper parsing format and cause no error
                    var parseDate = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");
                    var parseDate2 = d3.time.format.utc("%Y-%m-%dT%H:%M:%SZ");

                    var isDate = false;
                    // Check if x is date or another type
                    if (data && data.length > 0) {
                        var sample_date = data[0][scope.panel.field];
                        isDate = parseDate.parse(String(sample_date)) || parseDate2.parse(String(sample_date));
                    }

                    // d3 stuffs
                    var x;
                    if (isDate) {
                        x = d3.time.scale().range([0, width]);
                    } else {
                        x = d3.scale.linear().range([0, width]);
                    }

                    var y = d3.scale.linear().range([height, 0]);
                    //                var y1 = d3.scale.linear().range([height, 0]);

                    var color = d3.scale.category10();
                    var xAxis = d3.svg.axis().scale(x).orient("bottom");
                    var yAxis = d3.svg.axis().scale(y).orient("left");

                    //                var colorY1 = d3.scale.category20();
                    //                var yAxis1 = d3.svg.axis().scale(y1).orient("right");

                    var line = d3.svg.line()
                        .interpolate(scope.panel.interpolate) // interpolate option
                        .x(function(d) {
                            return x(d.xValue);
                        })
                        .y(function(d) {
                            return y(d.yValue);
                        });

                    //                var line2 = d3.svg.line()
                    //                    .interpolate("basis")
                    //                    .x(function(d) { return x(d.xValue); })
                    //                    .y(function(d) { return y1(d.yValue); });

                    var svg = d3.select(el).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .attr("viewBox", "0 0 " + parent_width + " " + (parent_width * aspectRatio))
                        .attr("preserveAspectRatio", "xMidYMid")
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    // Colors domain must be the same count of fl
                    var fl = scope.panel.fl.split(',');
                    color.domain(d3.keys(data[0]).filter(function(key) {
                        return (fl.indexOf(key) !== -1);
                    }));

                    var y_right,y_right_color,yAxis_right,line_right,rightAxisList;

                    if(scope.panel.rightYEnabled) {
                        y_right = d3.scale.linear().range([height, 0]);
                        y_right_color = d3.scale.category20();
                        yAxis_right = d3.svg.axis().scale(y_right).orient("right");
                        line_right = d3.svg.line()
                                    .interpolate(scope.panel.right_interpolate)
                                    .x(function(d) { return x(d.xValue); })
                                    .y(function(d) { return y_right(d.yValue); });
                        var rightAxisList = scope.panel.right_fl.split(',');
                        y_right_color.domain(d3.keys(data[0]).filter(function(key){
                           return (rightAxisList.indexOf(key) !== -1);
                        }));
                    }

                    if (isDate) {
                        // That in case x-axis was date, what if not?
                        data.forEach(function(d) {
                            var newDate = parseDate.parse(String(d[scope.panel.field]));
                            d[scope.panel.field] = newDate !== null ? newDate : parseDate2.parse(String(d[scope.panel.field]));
                        });
                    }

                    var yFields = color.domain().map(function(name) {
                        return {
                            name: name,
                            values: data.map(function(d) {
                                return {
                                    xValue: d[scope.panel.field],
                                    yValue: +d[name]
                                };
                            })
                        };
                    });

                    // remove NaN values and let d3 to perform the interpolation
                    yFields.forEach(function(c) {
                        c.values = c.values.filter(function(d) {
                            return !isNaN(d.yValue);
                        });
                    });

                    x.domain(d3.extent(data, function(d) {
                        return d[scope.panel.field];
                    }));

                    y.domain([
                        d3.min(yFields, function(c) {
                            return d3.min(c.values, function(v) {
                                return v.yValue;
                            });
                        }),
                        d3.max(yFields, function(c) {
                            return d3.max(c.values, function(v) {
                                return v.yValue;
                            });
                        })
                    ]);

                    //                y1.domain([
                    //                    d3.min(volumes, function(c) { return d3.min(c.values, function(v) { return v.yValue; }); }),
                    //                    d3.max(volumes, function(c) { return d3.max(c.values, function(v) { return v.yValue; }); })
                    //                ]);

                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);

                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis)
                        .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .text(scope.panel.yAxis);

                    var yFields_right;
                    if(scope.panel.rightYEnabled) {
                        yFields_right = y_right_color.domain().map(function(name) {
                            return {
                               name: name,
                               values: data.map(function(d) {
                                   return {xValue: d[scope.panel.field], yValue: +d[name]};
                               })
                            };
                        }); 

                        y_right.domain([
                            d3.min(yFields_right, function(c) { return d3.min(c.values, function(v) { return v.yValue; }); }),
                            d3.max(yFields_right, function(c) { return d3.max(c.values, function(v) { return v.yValue; }); })
                        ]);

                        svg.append("g")
                           .attr("class", "y axis")
                           .attr("transform", "translate(" + width + " ,0)")   
                           .style("fill", "blue") 
                           .call(yAxis_right)
                           .append("text")
                           .attr("transform", "rotate(-90)")
                           .attr("y", 6)
                           .attr("dy", "-1.2em")
                           .style("text-anchor", "end")
                           .text(scope.panel.right_yAxis); // TODO: make it defined in panel
                    }

                    var yfield = svg.selectAll(".yfield")
                        .data(yFields)
                        .enter().append("g")
                        .attr("class", "yfield");

                    yfield.append("path")
                        .attr("class", "line")
                        .attr("d", function(d) {
                            return line(d.values);
                        })
                        .style("stroke", function(d) {
                            return color(d.name);
                        })
                        .style("fill", "transparent");

                    yfield.append("text")
                        .datum(function(d) {
                            return {
                                name: d.name,
                                value: d.values[d.values.length - 1]
                            };
                        })
                        .attr("transform", function(d) {
                            return "translate(" + x(d.value.xValue) + "," + y(d.value.yValue) + ")";
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name;
                        });

                    var yfield_right;
                    if(scope.panel.rightYEnabled) {
                       yfield_right = svg.selectAll(".yfield_right")
                                     .data(yFields_right)
                                     .enter().append("g")
                                     .attr("class", "yfield_right");
                       
                       yfield_right.append("path")
                           .attr("class", "line")
                           .attr("d", function(d) { return line_right(d.values); })
                           .style("stroke", function(d) { return y_right_color(d.name + 10); })
                           .style("fill", "transparent")
        
                       yfield_right.append("text")
                           .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
                           .attr("transform", function(d) { return "translate(" + x(d.value.xValue) + "," + y(d.value.yValue) + ")"; })
                           .attr("x", 3)
                           .attr("dy", ".35em")
                           .text(function(d) { return d.name; });
                    }
                }

                render_panel();
            }
        };
    });
});