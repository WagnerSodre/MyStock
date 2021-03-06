angular.module('MyStocks.services', [])

.factory('encodeURIService', function() {
  return {
    encode: function(string) {
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
})

.service('modalService', function($ionicModal){
  this.openModal = function(id){
    var _this = this;

    // Create the login modal that we will use later
    if(id==1){
      $ionicModal.fromTemplateUrl('templates/search.html', {
        scope: null,
        controller: 'SearchCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }else if(id==2){
      $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: null,
        controller: 'LoginSearchCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }else if(id==3){
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: null,
        controller: 'LoginSearchCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
  };
  this.closeModal = function(){
    var _this = this;
    if(!_this.modal) return;
    _this.modal.hide();
    _this.modal.remove();
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

.factory('firebaseRef', function($firebase){
  var config = {
    apiKey: "AIzaSyAKliHkCyecWeOvQZIkmkZLMD8BDhcmcp0",
    authDomain: "mystocks-31d14.firebaseapp.com",
    databaseURL: "https://mystocks-31d14.firebaseio.com",
    projectId: "mystocks-31d14",
    storageBucket: "mystocks-31d14.appspot.com",
    messagingSenderId: "255608408059"
  };

  firebase.initializeApp(config);

  var firebaseRef = firebase.database().ref();
  return firebaseRef;
})

.factory('userService', function(firebaseRef, modalService){
  var login = function(user){
    return firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
  };
  var signup = function(user){
    return firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
  };
  var logout = function(){
    return firebase.auth().signOut();
  };
  return{
    login: login,
    signup: signup,
    logout: logout
  };
})

.factory('chartDataCacheService', function(CacheFactory){
  var chartDataCache;
  if(!CacheFactory.get('chartDataCache')){
    chartDataCache=CacheFactory('chartDataCache', {
      maxAge: 60 * 60 * 8 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }else{
    chartDataCache = CacheFactory.get('chartDataCache');
  }
  return chartDataCache;
})

.factory('stockDetailsCacheService', function(CacheFactory){
  var stockDetailsCache;
  if(!CacheFactory.get('stockDetailsCache')){
    stockDetailsCache = CacheFactory('stockDetailsCache', {
      maxAge: 60 * 60 * 8 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }else {
    stockDetailsCache=CacheFactory.get('stockDetailsCache');
  }
  return stockDetailsCache;
})

.factory('notesCacheService', function(CacheFactory){
  var notesCache;
  if(!CacheFactory.get('notesCache')){
    notesCache=CacheFactory('notesCache', {
      storageMode: 'localStorage'
    });
  }else{
    notesCache=CacheFactory.get('notesCache');
  }
  return notesCache;
})

.factory('fillMyStocksCacheService', function(CacheFactory){
  var myStocksCache;
  if (!CacheFactory.get('myStocksCache')){
    myStocksCache = CacheFactory('myStocksCache', {
      storageMode: 'localStorage'
    });
  }else {
    myStocksCache = CacheFactory.get('myStocksCache');
  }
  var fillMyStocksCache = function(){
    var myStocksArray = [
      {ticker: "AAPL"},
      {ticker: "GPRO"},
      {ticker: "FB"},
      {ticker: "NFLX"},
      {ticker: "TSLA"},
      {ticker: "BRK-A"},
      {ticker: "INTC"},
      {ticker: "MSFT"},
      {ticker: "GE"},
      {ticker: "BAC"},
      {ticker: "C"},
      {ticker: "T"}
    ];
    myStocksCache.put('myStocks', myStocksArray);
  };
  return{
    fillMyStocksCache: fillMyStocksCache
  };
})

.factory('myStocksCacheService', function(CacheFactory){
  var myStocksCache = CacheFactory.get('myStocksCache');

  return myStocksCache;
})

.factory('myStocksArrayService', function(fillMyStocksCacheService, myStocksCacheService){
if(!myStocksCacheService.info('myStocks')){
  fillMyStocksCacheService.fillMyStocksCache();
}
  var myStocks = myStocksCacheService.get('myStocks');
  return myStocks;
})

.factory('followStockService', function(myStocksArrayService, myStocksCacheService){
  return{
    follow: function(ticker){
      var stockToAdd = {"ticker": ticker};
      myStocksArrayService.push(stockToAdd);
      myStocksCacheService.put('myStocks', myStocksArrayService);
    },
    unfollow: function(ticker){
      for (var i = 0; i < myStocksArrayService.length; i++) {
        if(myStocksArrayService[i].ticker == ticker){
          myStocksArrayService.splice(i, 1);
          myStocksCacheService.remove('myStocks');
          myStocksCacheService.put('myStocks', myStocksArrayService);
          break;
        }
      }
    },
    checkFollowing: function(ticker){
      for (var i = 0; i < myStocksArrayService.length; i++) {
        if(myStocksArrayService[i].ticker == ticker){
          return true;
        }
      }
      return false;
    }
  };
})

.factory('stockDataService', function($q, $http, encodeURIService, stockDetailsCacheService){

var getDetailsData = function(ticker){
  var deferred = $q.defer(),
  cacheKey = ticker,
  stockDetailsCache=stockDetailsCacheService.get(cacheKey);
  query = 'select * from yahoo.finance.quote where symbol in ("'+ticker+'")';
  url='http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store://datatables.org/alltableswithkeys&q=';
console.log(url);
  if(stockDetailsCache){
    deferred.resolve(stockDetailsCache);
  }else {
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
            stockDetailsCacheService.put(cacheKey, jsonData);
          })
          .error(function(error) {
            console.log("Details data error: " + error);
            deferred.reject();
          });
  }
    return deferred.promise;
};
  return {
    getDetailsData : getDetailsData
  };
})
.factory('chartDataService', function($q, $http, encodeURIService, chartDataCacheService){
  var getHistoricalData = function(ticker, fromDate, todayDate){
    var deferred = $q.defer(),
      cacheKey = ticker,
      chartDataCache = chartDataCacheService.get(cacheKey);


      query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"';
      url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=store://datatables.org/alltableswithkeys&q=';
      if(chartDataCache){
        deferred.resolve(chartDataCache);
      }else {
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
                  chartDataCacheService.put(cacheKey, formattedChartData);
                })
                .error(function(error) {
                  console.log("Chart data error: " + JSON.stringify(error));
                  deferred.reject();
                });
      }
                return deferred.promise;
      };

      return {
        getHistoricalData: getHistoricalData
      };
    })

.factory('notesService', function(notesCacheService){
  return{
    getNotes: function(ticker){
      return notesCacheService.get(ticker);
    },
    addNote: function(ticker, note){
      var stockNotes =[];
      if(notesCacheService.get(ticker)){
        stockNotes = notesCacheService.get(ticker);
        stockNotes.push(note);
      }else{
        stockNotes.push(note);
      }
      notesCacheService.put(ticker, stockNotes);
    },
    deleteNote: function(ticker, index){
      var stockNotes = [];
      stockNotes = notesCacheService.get(ticker);
      stockNotes.splice(index, 1);
      notesCacheService.put(ticker, stockNotes);
    }
  };
})

.factory('newsService', function($q, $http){
  return{
    getNews: function(ticker){
        var deferred = $q.defer(),
        x2js = new X2JS(),
        url="https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + ticker + "&region=US&lang=en-US";
        $http.get(url)
        .success(function(xml){
          var xmlDoc = x2js.parseXmlString(xml),
          json = x2js.xml2json(xmlDoc),
          jsonData = json.rss.channel.item;
          deferred.resolve(jsonData);
        })
        .error(function(error){
          deferred.reject();
          console.log("News error: "+error);
        });
        return deferred.promise;
      }
  };
})

.factory('searchService', function($q, $http){
  return{
    search: function(query){
      var deferred = $q.defer(),
      // sometimes I have to copy and repaste the string below into the
      // url variable for it to work. Not sure why that is.
      // https://s.yimg.com/aq/autoc?query=aapl&region=CA&lang=en-CA
      url = 'https://s.yimg.com/aq/autoc?query='+query+'&region=US&lang=en-US';
      $http.get(url)
        .success(function(data) {
          var jsonData = data.ResultSet.Result;
          deferred.resolve(jsonData);
          console.log("jsonData: "+jsonData);
        })
        .catch(function(error) {
          console.log(JSON.stringify(error));
        });
        return deferred.promise;
      }
  };
})

    ;
