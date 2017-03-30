angular.module('MyStock.services', [])
.factory('stockDataService', function($q, $http){

var getDetailsData = function(ticker){
  var deferred = $q.defer(),
  url="http://query.yahooapis.com/v1/public/yql?format=json&env=store://datatables.org/alltableswithkeys&q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20%28%27"+ticker+"%27%29";
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

  return {
    getPriceData : getPriceData,
    getDetailsData : getDetailsData
  };

});
