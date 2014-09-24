var sc = angular.module('stellarClient');

//TODO:  the transaction history doesn't not show entries for when your offers are filled, 
// meaning your balance can change without an appropriate entry being added into the transaction history

sc.controller('TradeCtrl', function($scope, session, Trading, CurrencyPairs) {
     
  //TODO: we need to dynamically populate a list that is useful to the user
  //TODO: allow a user to manually specify the currency pair to use (see mocks)
  $scope.currencies = [
    {currency:"STR"},
    // {currency:"EUR", issuer: "gnhPFpbYXcYGMkGxfWdQGFfuKEdJoEThVo"},
    // {currency:"BTC", issuer: "gnhPFpbYXcYGMkGxfWdQGFfuKEdJoEThVo"},
    // {currency:"LTC", issuer: "gnhPFpbYXcYGMkGxfWdQGFfuKEdJoEThVo"},
    // {currency:"NOK", issuer: "gnhPFpbYXcYGMkGxfWdQGFfuKEdJoEThVo"},
    {currency:"SCT", issuer: "gKAEHiF5LELZ5eytP4EVZVqqdbuCuHvq9C"},
    {currency:"JED", issuer: "gKAEHiF5LELZ5eytP4EVZVqqdbuCuHvq9C"},
  ];

  $scope.favorites = CurrencyPairs.getFavorites();

  $scope.baseCurrency    = $scope.currencies[2];
  $scope.counterCurrency = $scope.currencies[1];
  $scope.$watch('baseCurrency', switchOrderBookIfNeeded);
  $scope.$watch('counterCurrency', switchOrderBookIfNeeded);

  $scope.currentOrderBook = null;
  $scope.currentOffers    = null;
  $scope.myOffers         = null;
  $scope.currentBids      = [];
  $scope.currentAsks      = [];
  $scope.tradeOperation   = 'Buy';


  $scope.$on("trading:my-offers:partially-filled", function(e, offer) {
    var index = _.findIndex($scope.myOffers, _.pick(offer, 'account', 'sequence'));
    $scope.myOffers[index] = Trading.offer.toFriendlyOffer(offer);
  });

  $scope.$on("trading:my-offers:filled", function(e, offer) {
    var index = _.findIndex($scope.myOffers, _.pick(offer, 'account', 'sequence'));
    $scope.myOffers.splice(index, 1);
  });

  $scope.$on("trading:order-book-updated", function(e, orderBook) {
    if(orderBook === $scope.currentOrderBook) {
      $scope.loadOrderBookData();
    }
  });


  $scope.validOrderBook = function() {
    if (_.isEmpty($scope.baseCurrency)) { return false; } 
    if (_.isEmpty($scope.counterCurrency)) { return false; } 

    if ($scope.baseCurrency === $scope.counterCurrency) { return false; }

    return true;
  };

  $scope.createOffer = function(e) {
    var offerPromise;

    switch($scope.tradeOperation) {
    case "Buy":
      offerPromise = $scope.currentOrderBook.buy($scope.baseCurrencyAmount, $scope.counterCurrencyAmount);
      break;
    case "Sell":
      offerPromise = $scope.currentOrderBook.sell($scope.baseCurrencyAmount, $scope.counterCurrencyAmount);
      break;
    default:
      throw new Error("invalid trade operation: " + $scope.tradeOperation + ", expected buy or sell");
    }

    offerPromise
      .catch(function (e) {
        //TODO: actually show an error
        console.log(e);
      })
      .then(function (result) {
        // show a message!
      })
      .finally(function () {
        $scope.refreshMyOffers();
      });

    return true;
  };

  $scope.refreshMyOffers = function() {
    Trading.myOffers().then(function (offers) {
      $scope.myOffers = _.isEmpty(offers) ? null : offers.map(Trading.offer.toFriendlyOffer);
    });
  };

  $scope.loadOrderBookData = function() {
    if($scope.currentOrderBook){ 
      $scope.currentBids = $scope.currentOrderBook.getPriceLevels('bids');
      $scope.currentAsks = $scope.currentOrderBook.getPriceLevels('asks');
    } else {
      $scope.currentBids = [];
      $scope.currentAsks = [];
    }
  };

  $scope.currencyPairDisplay = function(favorite) {
    //TODO
    return favorite.baseCurrency.currency + ":" + favorite.counterCurrency.currency;
  };

  $scope.addFavorite = function() {
    CurrencyPairs.markFavorite(currentCurrencyPair());

    session.syncWallet("update");
  };

  $scope.removeFavorite = function() {
    CurrencyPairs.unmarkFavorite(currentCurrencyPair());

    session.syncWallet("update");
  };

  $scope.isFavorite = function() {
    return CurrencyPairs.isFavorite(currentCurrencyPair());
  };


  function switchOrderBookIfNeeded() {   
    //TODO: don't switch if not needed
    setCurrentOrderBook();
  }

  function setCurrentOrderBook() {
    if($scope.currentOrderBook) {
      $scope.currentOrderBook.destroy();
    }

    //TODO: canonicali
    if ($scope.validOrderBook()) {
      $scope.currentOrderBook = Trading.getOrderBook(currentCurrencyPair());
      $scope.currentOrderBook.subscribe();
    } else {
      $scope.currentOrderBook = null;
    }

    $scope.loadOrderBookData();
  }

  function currentCurrencyPair() {
    return {
      baseCurrency:    $scope.baseCurrency, 
      counterCurrency: $scope.counterCurrency
    };
  }

  $scope.refreshMyOffers();
  $scope.loadOrderBookData();
});
