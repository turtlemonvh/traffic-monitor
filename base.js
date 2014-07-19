var trafficPlots = angular.module('trafficPlots', ['flow']);

trafficPlots.constant('_', window._ );
trafficPlots.constant('d3', window.d3 );
trafficPlots.constant('crossfilter', window.crossfilter );
trafficPlots.constant('dc', window.dc );

trafficPlots.factory('msgBus', ['$rootScope', function($rootScope) {
  var msgBus = {};
  msgBus.emitMsg = function(msg, data) {
    data = data || {};
    $rootScope.$emit(msg, data);
  };
  msgBus.onMsg = function(msg, func, scope) {
    var unbind = $rootScope.$on(msg, func);
    if (scope) {
      scope.$on('$destroy', unbind);
    }
    return unbind;
  };
  return msgBus;
}]);

// d3.csv.parseRows
trafficPlots.service('dataFilter', ['d3', 'crossfilter', 'msgBus', '$filter', '$q',
function(d3, crossfilter, msgBus, $filter, $q) {
    var self = this;

    this.filter = {};
    this.dimensions = {};

    var dataLoaded = $q.defer();
    this.dataLoadComplete = dataLoaded.promise;

    this.parseFile = function() {
        if (!self.file) {
            alert('Problem parsing - no csv set');
        }
        var reader = new FileReader();
        msgBus.emitMsg('fileupload:status', {
          status: "File added"
        });

        msgBus.emitMsg('fileupload:status', {
          status: "Start reading"
        });
        reader.readAsText(self.file);

        reader.onload = function(){
            // Parsing status
            msgBus.emitMsg('fileupload:status', {
              status: "Start parsing"
            });

            // Format for parsing dates
            // https://github.com/mbostock/d3/wiki/Time-Formatting
            // (e.g.) 20130523 10:15:00
            var dateFormat = d3.time.format("%Y%m%d %X");

            // Date manipulation
            // DOY function from: http://javascript.about.com/library/bldayyear.htm
            var nminPerBin = 10; // 10 min bins
            var zeroTime = new Date(2014,0,1,0,0); // midnight on Jan 1st
            function getDOY(dateObj) {
                var onejan = new Date(dateObj.getFullYear(),0,1);
                return Math.ceil((dateObj - onejan) / 86400000);
            }
            function DOYtoDate(ndays) {
                return new Date(zeroTime.getTime() + ndays*24*60*60*1000);
            }
            function getMinutesBin(dateObj) {
                var nminutes = nminPerBin*Math.round((dateObj.getHours()*60 + dateObj.getMinutes())/nminPerBin)
                return new Date(zeroTime.getTime() + nminutes*60*1000);
            }

            self.data = d3.csv.parseRows(reader.result, function(row){
                var date = dateFormat.parse(row[1] + " " + row[3] + ":00");
                return {
                    route: row[0], // string
                    date: date,
                    dayOfWeek: +row[2], // integer; 0 is Monday
                    dayOfYear: DOYtoDate(getDOY(date)), // date object
                    timeOfDay: getMinutesBin(date), // date object
                    duration: +row[4] // integer time
                }
            });

            var nrows = $filter('number')(self.data.length, 0);

            // End parsing status
            msgBus.emitMsg('fileupload:status', {
                status: "Done parsing: " + nrows + " rows"
            });

            self.createFilters();

            // console.log(self.data)
        };
    }

    this.createFilters = function(){
        // Set up crossfilter
        self.filter = crossfilter(self.data);

        // Set up dimensions
        self.dimensions.all = self.filter.groupAll();

        self.dimensions.routesByDuration = self.filter.dimension(function(d) { return d.duration; });
        self.dimensions.durationGroup = self.dimensions.routesByDuration.group();

        self.dimensions.routesByDayOfWeek = self.filter.dimension(function(d) {
            var day = d.dayOfWeek;
            var name = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
            return day + "." + name[day];
        });
        self.dimensions.dayOfWeekGroup = self.dimensions.routesByDayOfWeek.group();

        self.dimensions.routesByDayOfYear = self.filter.dimension(function(d) { return d.dayOfYear; });
        self.dimensions.dayOfYearGroup = self.dimensions.routesByDayOfYear.group();

        self.dimensions.routesByTimeOfDay = self.filter.dimension(function(d) { return d.timeOfDay; });
        self.dimensions.timeOfDayGroup = self.dimensions.routesByTimeOfDay.group();


        var nrows = $filter('number')(self.filter.size(), 0);
        msgBus.emitMsg('fileupload:status', {
            status: "Filter inititalized: " + nrows + " rows"
        });

        // Notify that its done
        dataLoaded.resolve();
    }
}]);


trafficPlots.controller('baseCtrl', ['$scope', 'dataFilter', 'msgBus', 
function($scope, dataFilter, msgBus){
    $scope.uploadedFile = {};
    $scope.progress = "Waiting for file";
    $scope.dataFilter = dataFilter;

    msgBus.onMsg('fileupload:status', function(event, data) {
        $scope.progress = data.status;
        $scope.$digest();
    });

    $scope.addFile = function($file, $event) {
        // FlowFile object
        // https://github.com/flowjs/flow.js#flowfile
        $scope.uploadedFile = $file;

        // HTML5 file object
        // http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-reading-files
        if (!$file.file.name.match(/.*(csv)$/)) {
            alert('Invalid file type uploaded')
            $scope.uploadedFile = {};
            return;
        }

        // Set file and read in data
        dataFilter.file = $file.file;
        dataFilter.parseFile();
    }

}]);

trafficPlots.directive('trafficCharts', ['dataFilter', 'dc',
function(dataFilter, dc){
    return {
        restrict: 'E',
        templateUrl: 'dataViz.html',
        link: function(scope, element, attrs) {
            // eventually use scope to switch which route to use

            // See example
            // http://dc-js.github.io/dc.js/docs/stock.html
            // Data should stay in service so table and other features can be managed with angular
            // e.g. update current avg # display with angular

            // Bar charts and row charts
            // https://github.com/dc-js/dc.js/blob/master/web/docs/api-1.6.0.md#bar-chart
            var timeOfDayChart = dc.barChart("#time-of-day");
            var timeOfYearChart = dc.barChart("#time-of-year");
            var dayOfWeekChart = dc.rowChart("#day-of-week");
            var timeDistributionChart = dc.barChart("#time-distribution");
            var totalCount = dc.dataCount("#total-count");

            // Formatters
            var numberFormat = d3.format(".2f");
            var dayOfYearformat = d3.time.format("%B %e");
            var timeOfYearFormat = d3.time.format("%b");
            var timeOfDayformat = d3.time.format("%I:%M %p");

            dataFilter.dataLoadComplete.then(function(){
                // Grab local versions of all dimensions for convenience with naming
                var dayOfWeekGroup = dataFilter.dimensions.dayOfWeekGroup;
                var routesByDayOfWeek = dataFilter.dimensions.routesByDayOfWeek;

                var timeOfDayGroup = dataFilter.dimensions.timeOfDayGroup;
                var routesByTimeOfDay = dataFilter.dimensions.routesByTimeOfDay;

                var dayOfYearGroup = dataFilter.dimensions.dayOfYearGroup;
                var routesByDayOfYear = dataFilter.dimensions.routesByDayOfYear;

                var durationGroup = dataFilter.dimensions.durationGroup;
                var routesByDuration = dataFilter.dimensions.routesByDuration;

                // Charts
                totalCount
                    .dimension(dataFilter.filter)
                    .group(dataFilter.dimensions.all);

                dayOfWeekChart.width(300)
                    .height(180)
                    .margins({top: 20, left: 10, right: 10, bottom: 20})
                    .group(dayOfWeekGroup)
                    .dimension(routesByDayOfWeek)
                    .label(function (d) {
                        return d.key.split(".")[1];
                    })
                    .elasticX(true)
                    .xAxis().ticks(4);

                timeOfDayChart.width(600)
                    .height(180)
                    .margins({top: 10, right: 50, bottom: 30, left: 60})
                    .dimension(routesByTimeOfDay)
                    .group(timeOfDayGroup)
                    .elasticY(true)
                    .x(d3.time.scale().domain([new Date(2014,0,1,0,0), new Date(2014,0,1,23,59)]))
                    .round(d3.time.minute.round)
                    .xUnits(d3.time.minutes)
                    .xAxisLabel('Time of Day')
                    .yAxisLabel('# Trips')
                    .renderHorizontalGridLines(true)
                    .filterPrinter(function (filters) {
                        var filter = filters[0],
                            s = "";
                        s += timeOfDayformat(filter[0]) + " -> " + timeOfDayformat(filter[1]);
                        return s;
                    });
                timeOfDayChart.yAxis().ticks(5);
                timeOfDayChart.xAxis().ticks(d3.time.hour, 3);
                timeOfDayChart.xAxis().tickFormat(function(v){
                    return timeOfDayformat(v);
                });

                timeOfYearChart.width(600)
                    .height(180)
                    .margins({top: 10, right: 50, bottom: 30, left: 60})
                    .dimension(routesByDayOfYear)
                    .group(dayOfYearGroup)
                    .elasticY(true)
                    .x(d3.time.scale().domain([new Date(2014,0,1,0,0), new Date(2014,11,31,0,0)]))
                    .round(d3.time.day.round)
                    .xUnits(d3.time.days)
                    .xAxisLabel('Time of Year')
                    .yAxisLabel('# Trips')
                    .renderHorizontalGridLines(true)
                    .filterPrinter(function (filters) {
                        var filter = filters[0],
                            s = "";
                        s += dayOfYearformat(filter[0]) + " -> " + dayOfYearformat(filter[1]);
                        return s;
                    });
                timeOfYearChart.yAxis().ticks(4);
                timeOfYearChart.xAxis().ticks(d3.time.month, 1);
                timeOfYearChart.xAxis().tickFormat(function(v){
                    return timeOfYearFormat(v);
                });

                timeDistributionChart.width(600)
                    .height(300)
                    .margins({top: 10, right: 50, bottom: 30, left: 60})
                    .dimension(routesByDuration)
                    .group(durationGroup)
                    .elasticY(true)
                    .x(d3.scale.linear().domain([0,240])) // up to 4 hours
                    .renderHorizontalGridLines(true)
                    .xAxisLabel('Duration (min)')
                    .yAxisLabel('# Trips')
                    .filterPrinter(function (filters) {
                        var filter = filters[0],
                            s = "";
                        s += numberFormat(filter[0]) + " min -> " + numberFormat(filter[1]) + " min";
                        return s;
                    });
                timeDistributionChart.yAxis().ticks(5);

                // Kick it off
                dc.renderAll();
                dc.redrawAll();
            });

        }
    }
}])
