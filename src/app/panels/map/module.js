/*
  ## Map

  ### Parameters
  * map :: 'world', 'us' or 'europe'
  * colors :: an array of colors to use for the regions of the map. If this is a 2
              element array, jquerymap will generate shades between these colors
  * size :: How big to make the facet. Higher = more countries
  * exclude :: Exlude the array of counties
  * spyable :: Show the 'eye' icon that reveals the last Solr query
  * index_limit :: This does nothing yet. Eventually will limit the query to the first
                   N indices
*/

define([
  'angular',
  'app',
  'underscore',
  'jquery',
  './lib/jquery.jvectormap.min'
],
function (angular, app, _, $) {
  'use strict';

  var module = angular.module('kibana.panels.map', []);
  app.useModule(module);

  module.controller('map', function($scope, $rootScope, querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      editorTabs : [
        {title:'Queries', src:'app/partials/querySelect.html'}
      ],
      modals : [
        {
          description: "Inspect",
          icon: "fa fa-info",
          partial: "app/partials/inspector.html",
          show: $scope.panel.spyable
        }
      ],
      status  : "Stable",
      description : "Displays a map of shaded regions using a field containing a 2 letter country code or US state code. Regions with more hits are shaded darker. It uses Solr faceting, so it is important that you set field values to the appropriate 2-letter codes at index time. Recent additions provide the ability to compute mean/max/min/sum of a numeric field by country or state."
    };

    // Set and populate defaults
    var _d = {
      queries     : {
        mode        : 'all',
        ids         : [],
        query       : '*:*',
        custom      : ''
      },
      mode  : 'count', // mode to tell which number will be used to plot the chart.
      field : '',
      stats_field : '',
      decimal_points : 0, // The number of digits after the decimal point
      map     : "world",
      backgroundColor: null,
      fillColor: '#8c8c8c',
      colors  : ['#A0E2E2', '#265656'],
      size    : 100,
      exclude : [],
      spyable : true,
      isLegendDisplayed: false,
      isZoomControlEnabled: false,
      isZoomOnScrollEnabled: false,
      normalizeFunction: 'polynomial',
      min_value: null,
      max_value: null,
      index_limit : 0,
      show_queries:true,
    };
    _.defaults($scope.panel,_d);


    $scope.init = function() {
      // $scope.testMultivalued();
      $scope.listOfColors = $scope.panel.colors.join(',');
      $scope.functions = ['polynomial', 'linear'];
      $scope.$on('refresh',function(){$scope.get_data();});
      $scope.get_data();
    };

    $scope.testMultivalued = function() {
      if($scope.panel.field && $scope.fields.typeList[$scope.panel.field].schema.indexOf("M") > -1) {
        $scope.panel.error = "Can't proceed with Multivalued field";
        return;
      }
      if($scope.panel.stats_field && $scope.fields.typeList[$scope.panel.stats_field].schema.indexOf("M") > -1) {
        $scope.panel.error = "Can't proceed with Multivalued field";
        return;
      }
    };

    $scope.set_refresh = function (state) {
      $scope.refresh = state;
      // if 'count' mode is selected, set decimal_points to zero automatically.
      if ($scope.panel.mode === 'count') {
        $scope.panel.decimal_points = 0;
      }
    };

    $scope.close_edit = function() {
      if ($scope.refresh) {
        // $scope.testMultivalued();
        $scope.get_data();
      }
      $scope.refresh = false;
    };

    $scope.get_data = function() {
      // Make sure we have everything for the request to complete
      if(dashboard.indices.length === 0) {
        return;
      }
      $scope.panelMeta.loading = true;
      delete $scope.panel.error;

      // Solr
      $scope.sjs.client.server(dashboard.current.solr.server + dashboard.current.solr.core_name);

      var request;
      request = $scope.sjs.Request().indices(dashboard.indices);

      $scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);
      // This could probably be changed to a BoolFilter
      var boolQuery = $scope.ejs.BoolQuery();
      _.each($scope.panel.queries.ids,function(id) {
        boolQuery = boolQuery.should(querySrv.getEjsObj(id));
      });

      // Then the insert into facet and make the request
      request = request
        .facet($scope.ejs.TermsFacet('map')
          .field($scope.panel.field)
          .size($scope.panel.size)
          .exclude($scope.panel.exclude)
          .facetFilter($scope.ejs.QueryFilter(
            $scope.ejs.FilteredQuery(
              boolQuery,
              filterSrv.getBoolFilter(filterSrv.ids)
              )))).size(0);

      $scope.populate_modal(request);

      // Build Solr query
      var fq = '';
      if (filterSrv.getSolrFq() && filterSrv.getSolrFq() != '') {
        fq = '&' + filterSrv.getSolrFq();
      }
      var wt_json = '&wt=json';
      var rows_limit = '&rows=0'; // for map module, we don't display results from row, but we use facets.
      var facet = '';

      if ($scope.panel.mode === 'count') {
        facet = '&facet=true&facet.field=' + $scope.panel.field + '&facet.limit=' + $scope.panel.size;
      } else {
        // if mode != 'count' then we need to use stats query
        facet = '&stats=true&stats.facet=' + $scope.panel.field + '&stats.field=' + $scope.panel.stats_field;
      }

      // Set the panel's query
      $scope.panel.queries.query = querySrv.getORquery() + wt_json + fq + rows_limit + facet;

      // Set the additional custom query
      if ($scope.panel.queries.custom != null) {
        request = request.setQuery($scope.panel.queries.query + $scope.panel.queries.custom);
      } else {
        request = request.setQuery($scope.panel.queries.query);
      }

      var results = request.doSearch();

      // Populate scope when we have results
      results.then(function(results) {
        $scope.panelMeta.loading = false;
        // Check for error and abort if found
        if(!(_.isUndefined(results.error))) {
          $scope.panel.error = $scope.parse_error(results.error.msg);
          return;
        }
        $scope.data = {}; // empty the data for new results
        var terms = [];

        if (results.response.numFound) {
          $scope.hits = results.response.numFound;
        } else {
          // Undefined numFound or zero, clear the map.
          $scope.$emit('render');
          return false;
        }

        if ($scope.panel.mode === 'count') {
          terms = results.facet_counts.facet_fields[$scope.panel.field];
        } else { // stats mode
          _.each(results.stats.stats_fields[$scope.panel.stats_field].facets[$scope.panel.field], function(stats_obj,facet_field) {
            terms.push(facet_field, stats_obj[$scope.panel.mode]);
          });
        }

        if ($scope.hits > 0) {
          for (var i=0; i < terms.length; i += 2) {
            // Skip states with zero count to make them greyed out in the map.
            if (terms[i+1] > 0) {
              // if $scope.data[terms] is undefined, assign the value to it
              // otherwise, we will add the value. This case can happen when
              // the data contains both uppercase and lowercase state letters with
              // duplicate states (e.g. CA and ca). By adding the value, the map will
              // show correct counts for states with mixed-case letters.
              var value = terms[i+1];
              if ($scope.panel.min_value != null &&
                  $scope.panel.max_value != null &&
                  (
                    value < $scope.panel.min_value ||
                    $scope.panel.max_value < value)
              ) {
                // Ignore the value
                console.warn(terms[i].toUpperCase() +
                    ' with value ' + value +
                    ' rejected because out of bound [' +
                  $scope.panel.min_value + ' - ' +
                  $scope.panel.max_value + ']');
              } else {
                if (!$scope.data[terms[i].toUpperCase()]) {
                  $scope.data[terms[i].toUpperCase()] = value;
                } else {
                  $scope.data[terms[i].toUpperCase()] += value;
                }
              }
            }
          }
          if ($scope.panel.min_value != null &&
            $scope.panel.max_value != null) {
            $scope.data.boundminvalue = $scope.panel.min_value;
            $scope.data.boundmaxvalue = $scope.panel.max_value;
          }
        }

        $scope.$emit('render');
      });
    };

    // I really don't like this function, too much dom manip. Break out into directive?
    $scope.populate_modal = function(request) {
      $scope.inspector = angular.toJson(JSON.parse(request.toString()),true);
    };

    $scope.build_search = function(field,value) {
      var querystringObj = filterSrv.getByType("querystring");
      _.forEach(querystringObj, function (obj) {
        if ( obj.query.startsWith($scope.panel.field)
              && obj['mandate'] == "must" ) {
          filterSrv.remove(obj.id);
        }
      });

      // Set querystring to both uppercase and lowercase state values with double-quote around the value
      // to prevent query error from state=OR (Oregon)
      filterSrv.set({type:'querystring',mandate:'must',query:field+':"'+value.toUpperCase()+'" OR '+field+':"'+value.toLowerCase()+'"'});
      dashboard.refresh();
    };


    $scope.updateColors = function (newValue, oldValue) {
      if (newValue !== oldValue) {
        $scope.panel.colors = newValue.split(',');
        $scope.$emit('render');
      }
    };
  });

  module.directive('map', function() {
    return {
      restrict: 'A',
      link: function(scope, elem) {

        elem.html('<center><img src="img/load_big.gif"></center>');

        // Receive render events
        scope.$on('render',function(){
          render_panel();
        });

        function render_panel() {
          elem.text('');
          //$('.jvectormap-zoomin,.jvectormap-zoomout,.jvectormap-label').remove();
          require(['./panels/map/lib/map.'+scope.panel.map], function () {

            var regionConfig = {
              values: scope.data,
              scale: scope.panel.colors,
              normalizeFunction: scope.panel.normalizeFunction || 'polynomial'
            };

            if (scope.panel.isLegendDisplayed) {
              regionConfig.legend =  {
                vertical: true,
                labelRender: function(v){
                  return v.toFixed(scope.panel.decimal_points);
                }
              };
            }

            elem.vectorMap({
              map: scope.panel.map,
              regionStyle: {initial: {fill: scope.panel.fillColor || '#8c8c8c'}},
              zoomOnScroll: scope.panel.isZoomOnScrollEnabled,
              backgroundColor: scope.panel.backgroundColor || null,
              series: {
                regions: [regionConfig]
              },
              onRegionTipShow: function(event, el, code){
                var count = _.isUndefined(scope.data[code]) ? 0 : scope.data[code];
                el.html(el.html() + " (" +
                      code + "): " +
                      count.toFixed(scope.panel.decimal_points));
              },
              onRegionClick: function(event, code) {
                var count = _.isUndefined(scope.data[code]) ? 0 : scope.data[code];
                scope.build_search(scope.panel.field,code);
                /*if (count !== 0) {
                  scope.build_search(scope.panel.field,code);
                }*/
              }
            });
          });
        }
      }
    };
  });
});
