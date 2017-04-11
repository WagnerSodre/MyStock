angular.module('MyStock.services', [])
.factory('encodeURIService', function(){
  return{
    encode: function(string){
      console.log(string);
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
    .success(function(json){
      var jsonData = json.query.results.quote;
      deferred.resolve(jsonData);
    })
    .error(function(error) {
      console.log("Details data error: "+error);
      deferred.reject();
    });
    return deferred.promise;
};
/*
var getPriceData = function(ticker){

    var deferred = $q.defer(),
    url="http://query.yahooapis.com/v1/public/yql?format=json&env=store://datatables.org/alltableswithkeys&q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20%28%27"+ticker+"%27%29";

    $http.get(url)
      .success(function(json){
        var jsonData = json.query.results.quote;
        deferred.resolve(jsonData);
      })
      .error(function(error) {
        console.log("Price data error: "+error);
        deferred.reject();
      });
      return deferred.promise;
  };
  */
  return {
    //getPriceData : getPriceData,
    getDetailsData : getDetailsData
  };

});
