angular.module('MyStock.services', [])
.factory('encodeURIService', function() {
  return {
    encode: function(string) {
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
})
.factory('dateService', function($filter){
  var currentDate = function() {
    var d = new Date();
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  };
  var oneYearAgoDate = function(){
    var d = new Date(new Date().setDate(new Date().getDate()-365));
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  };
  return{
    currentDate: currentDate,
    oneYearAgoDate: oneYearAgoDate
  };
})

.factory('stockDataService', function($q, $http, encodeURIService){

var getDetailsData = function(ticker){
  var deferred = $q.defer(),
  query = 'select * from yahoo.finance.quote where symbol in ("'+ticker+'")';
  url='http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store://datatables.org/alltableswithkeys&q=';
  console.log(url);
  $http.get(url)
        .success(function(json) {
          var date = new Date();
          var currentHours = date.getHours();
          currentHours = ("0" + currentHours).slice(-2);
          var currentMinutes = date.getMinutes();
          currentMinutes = ("0" + currentMinutes).slice(-2);
          var currentSeconds = date.getSeconds();
          currentSeconds = ("0" + currentSeconds).slice(-2);
          var jsonData = json.query.results.quote;
          var change = parseFloat(jsonData.Change);
          var value = parseFloat(jsonData.LastTradePriceOnly);
          jsonData.changePercent = (((change+value)*100)/value)-100;
          jsonData.cTime = currentHours+":"+currentMinutes+":"+currentSeconds;
          deferred.resolve(jsonData);
        })
        .error(function(error) {
          console.log("Details data error: " + error);
          deferred.reject();
        });
    return deferred.promise;
};
  return {
    getDetailsData : getDetailsData
  };
})
.factory('chartDataService', function($q, $http, encodeURIService){
  var getHistoricalData = function(ticker, fromDate, todayDate){
    var deferred = $q.defer();

      query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"';
      url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store://datatables.org/alltableswithkeys&q=';
    $http.get(url)
            .success(function(json) {
              var jsonData = json.query.results.quote;

              var priceData = [],
              volumeData = [];

              jsonData.forEach(function(dayDataObject) {

                var dateToMillis = dayDataObject.Date,
                date = Date.parse(dateToMillis),
                price = parseFloat(Math.round(dayDataObject.Close * 100) / 100).toFixed(3),
                volume = dayDataObject.Volume,

                volumeDatum = '[' + date + ',' + volume + ']',
                priceDatum = '[' + date + ',' + price + ']';

                volumeData.unshift(volumeDatum);
                priceData.unshift(priceDatum);
              });

              var formattedChartData =
                '[{' +
                  '"key":' + '"volume",' +
                  '"bar":' + 'true,' +
                  '"values":' + '[' + volumeData + ']' +
                '},' +
                '{' +
                  '"key":' + '"' + ticker + '",' +
                  '"values":' + '[' + priceData + ']' +
                '}]';

              deferred.resolve(formattedChartData);
            })
            .error(function(error) {
              console.log("Chart data error: " + JSON.stringify(error));
              deferred.reject();
            });
                return deferred.promise;
      };

      return {
        getHistoricalData: getHistoricalData
      };
    });
