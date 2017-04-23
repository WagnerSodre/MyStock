angular.module('MyStocks.controllers', [])

.controller('AppCtrl', ['$scope', 'modalService',
  function($scope, modalService) {
    $scope.modalService=modalService;
}])

.controller('MyStocksCtrl', ['$scope', 'followStockService', 'myStocksArrayService', 'stockDataService', 'stockDetailsCacheService',
function($scope, followStockService, myStocksArrayService, stockDataService, stockDetailsCacheService) {
  $scope.$on("$ionicView.afterEnter", function(){
    $scope.getMyStocksData();
  });
  $scope.getMyStocksData = function(){
    myStocksArrayService.forEach(function(stock){
      var promise = stockDataService.getDetailsData(stock.ticker);
      $scope.myStocksData = [];
      promise.then(function(data){
        $scope.myStocksData.push(stockDetailsCacheService.get(data.symbol));
      });
    });
    $scope.$broadcast('scroll.refreshComplete');
  };
  $scope.unfollowStock=function(ticker){
    followStockService.unfollow(ticker);
    $scope.getMyStocksData();
  };
}])

.controller('StockCtrl', ['$scope', '$stateParams', '$window', '$ionicPopup', '$cordovaInAppBrowser', 'followStockService', 'stockDataService', 'dateService', 'chartDataService', 'notesService', 'newsService',
function($scope, $stateParams, $window, $ionicPopup, $cordovaInAppBrowser, followStockService, stockDataService, dateService, chartDataService, notesService, newsService) {
  $scope.ticker = $stateParams.stockTicker;
  $scope.chartView = 4;
  $scope.oneYearAgoDate = dateService.oneYearAgoDate();
  $scope.todayDate = dateService.currentDate();
  $scope.following = followStockService.checkFollowing($scope.ticker);

  console.log(dateService.currentDate());
  console.log(dateService.oneYearAgoDate());
  $scope.$on("$ionicView.afterEnter", function(){
    getDetailsData();
    getChartData();
    getNews();
    $scope.stockNotes = notesService.getNotes($scope.ticker);
  });

$scope.toggleFollow = function(){
  if($scope.following){
    followStockService.unfollow($scope.ticker);
    $scope.following = false;
  }else{
    followStockService.follow($scope.ticker);
    $scope.following = true;
  }
};

  $scope.openWindow = function(link){
    var inAppBrowserOptions = {
      location: 'yes',
      clearcache: 'yes',
      toolbar: 'yes'
    };
    $cordovaInAppBrowser.open(link, '_blank', inAppBrowserOptions);
  };
  $scope.chartViewFunc = function(n){
    $scope.chartView = n;
  };
  $scope.addNote = function() {
    $scope.note = {title: 'Note', body: '', date: $scope.todayDate, ticker: $scope.ticker};
    var note = $ionicPopup.show({
      template: '<input type="text" ng-model="note.title" id="stock-note-title"><textarea type="text" ng-model="note.body" id="stock-note-body"></textarea>',
      title: 'New Note for '+$scope.ticker,
      scope: $scope,
      buttons: [
        { text: 'Cancel',
          onTap: function(e){
            return;
          }},
        {
          text: '<b>Save</b>',
          type: 'button-balanced',
          onTap: function(e) {
            notesService.addNote($scope.ticker, $scope.note);
            }
          }
      ]
    });
    note.then(function(res) {
      $scope.stockNotes = notesService.getNotes($scope.ticker);
    });
  };
  $scope.openNote = function(index, title, body) {
    $scope.note = {title: title, body: body, date: $scope.todayDate, ticker: $scope.ticker};
    var note = $ionicPopup.show({
      template: '<input type="text" ng-model="note.title" id="stock-note-title"><textarea type="text" ng-model="note.body" id="stock-note-body"></textarea>',
      title: $scope.note.title,
      scope: $scope,
      buttons: [
        { text: 'Delete',
          type: 'button-assertive button-small',
          onTap: function(e){
            notesService.deleteNote($scope.ticker, index);
          }},
        { text: 'Cancel',
          type: 'button-small',
          onTap: function(e){
            return;
          }},
        {
          text: '<b>Save</b>',
          type: 'button-balanced button-small',
          onTap: function(e) {
            notesService.deleteNote($scope.ticker, index);
            notesService.addNote($scope.ticker, $scope.note);
            }
          }
      ]
    });
    note.then(function(res) {
      $scope.stockNotes = notesService.getNotes($scope.ticker);
    });
  };
  function getNews(){
    $scope.newsStories = [];
    var promise = newsService.getNews($scope.ticker);
    promise.then(function(data){
      $scope.newsStories = data;
    });
  }
  function getDetailsData(){
    var promise = stockDataService.getDetailsData($scope.ticker);
    promise.then(function(data){
      $scope.stockDetailsData = data;
      if(data.changePercent >= 0 && data !== null){
        $scope.reactiveColor={'background-color':'#33cd5f', 'border-color': 'rgba(255, 255, 255, .3)'};
      }else if(data.changePercent<0&&data!==null){
        $scope.reactiveColor={'background-color':'#ef473a', 'border-color': 'rgba(0, 0, 0, .2)'};
      }
    });
  }
function getChartData(){
  var promise = chartDataService.getHistoricalData($scope.ticker, $scope.oneYearAgoDate, $scope.todayDate);
  promise.then(function(data){
    $scope.myData = JSON.parse(data)
    	.map(function(series) {
    		series.values = series.values.map(function(d) { return {x: d[0], y: d[1] }; });
    		return series;
    	});
  });
}

  	var xTickFormat = function(d) {
  		var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
  		if (dx > 0) {
        return d3.time.format("%b %d")(new Date(dx));
  		}
  		return null;
  	};

    var x2TickFormat = function(d) {
      var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
      return d3.time.format('%b %Y')(new Date(dx));
    };

    var y1TickFormat = function(d) {
      return d3.format(',f')(d);
    };

    var y2TickFormat = function(d) {
      return d3.format('s')(d);
    };

    var y3TickFormat = function(d) {
      return d3.format(',.2s')(d);
    };

    var y4TickFormat = function(d) {
      return d3.format(',.2s')(d);
    };

    var xValueFunction = function(d, i) {
      return i;
    };

    var marginBottom = ($window.innerWidth / 100) * 10;

  	$scope.chartOptions = {
      chartType: 'linePlusBarWithFocusChart',
      data: 'myData',
      margin: {top: 15, right: 0, bottom: marginBottom, left: 0},
      interpolate: "cardinal",
      useInteractiveGuideline: false,
      yShowMaxMin: false,
      tooltips: false,
      showLegend: false,
      useVeronoi: false,
      xShowMaxMin: false,
      xValue: xValueFunction,
      xAxisTickFormat: xTickFormat,
      x2AxisTickFormat: x2TickFormat,
      y1AxisTickFormat: y1TickFormat,
      y2AxisTickFormat: y2TickFormat,
      y3AxisTickFormat: y3TickFormat,
      y4AxisTickFormat: y4TickFormat,
      transitionDuration: 500,
      y1AxisLabel: 'Price',
      y3AxisLabel: 'Volume',
      noData: 'Loading data...'
  	};
}])

.controller('SearchCtrl', ['$scope', '$state','modalService', 'searchService',
  function($scope, $state, modalService, searchService){
    $scope.closeModal = function(){
      modalService.closeModal();
    };
    $scope.search = function(){
      $scope.searchResults = '';
      startSearch($scope.searchQuery);
    };
    var startSearch = ionic.debounce(function(query){
      searchService.search(query)
        .then(function(data){
          $scope.searchResults = data;
        });
    }, 750);
    $scope.goToStock = function(ticker){
      modalService.closeModal();
      $state.go('app.stock', {stockTicker: ticker});
    };
  }])

.controller('LoginSignupCtrl', ['$scope', '$ionicPopup', 'modalService', 'userService',
  function($scope, $ionicPopup, modalService, userService) {
    $scope.user = {email: '', password: ''};
    $scope.closeModal = function(){
      modalService.closeModal();
    };
    $scope.signup = function(user){
      if(user.password.length>=6&&user.email.includes('@')){
        userService.signup(user);
        $scope.login();
      }else if(user.password.length<6){
        var alertPopup = $ionicPopup.alert({
         title: 'Error',
         template: 'Your password is too weak! Use at least 6 characters'
      });
    }else if(!user.email.includes('@')){
        var alertPopup = $ionicPopup.alert({
          title: 'Error',
          template: 'Please, use a valid email'
        });
      }
    };
    $scope.login = function(user){
      var doLogin = userService.login(user);
      console.log(doLogin);
      //TODO optmize the login confirmation
      if(doLogin.qa!==undefined){
        $scope.closeModal();
      }else{
        var alertPopup = $ionicPopup.alert({
         title: 'Error',
         template: 'Email or Password are wrong'
       });
      $scope.user = {email: '', password: ''};
      }
    };
}])

  ;
