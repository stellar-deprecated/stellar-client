'use strict';

var sc = angular.module('stellarClient');

sc.controller('SendFormController', function($rootScope, $scope, $timeout, $q, stNetwork, contacts) {

    // This object holds the raw send form data entered by the user.
    $scope.sendFormModel = {};
    // we hold a copy to check for changes after asynchronous calls
    $scope.sendFormModelCopy = {};

    /**
    * We set up watches on each input in the send form to
    * 1) update our models in real time
    * 2) save a copy of the form to check for changes after asynchronous calls
    */
    var updateDestinationTimeout;
    $scope.$watch('sendFormModel.recipient', function (newValue) {
        // first reset any current dependencies we have on the destination
        $scope.resetDestinationDependencies();
        // reset the error tooltip
        resetError();

        if (!newValue) {
            return;
        }

        $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);

        if (updateDestinationTimeout) {
            $timeout.cancel(updateDestinationTimeout);
        }
        updateDestinationTimeout = $timeout(updateDestination, 500);
    });

    $scope.$watch('sendFormModel.amount', function (newValue) {
        if (!newValue || $scope.sendForm.amount.$invalid) {
            $scope.resetAmountDependencies();
            return;
        }
        $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);
        updateAmount();
    });

    $scope.$watch('sendFormModel.currency', function () {
        $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);
        updateCurrency();
    });

    $scope.changeCurrency = function(newCurrency) {
            $scope.sendFormModel.currency = newCurrency;
    };

    $scope.getPathText = function (path) {
        var human = path.to_human();
    }

    //this is because the currency dropdown gets cut-off because the parent container
    //is set to overflow:hidden for the slide animation effect. so we have to
    //set overflow:visible if they click onto the dropdown menu.

    $scope.setOverflowVisible = function(){
            $rootScope.overflowVisible = true;
    }

    $scope.$on('reset', function () {
        $scope.sendFormModel = {};
        $scope.sendFormModel.currency = $scope.send.currencyChoices[0];
    });

    /**
    * Resolves a stellar account from the user's input in the send form.
    */
    function updateDestination() {
        var input = $scope.sendFormModel.recipient;

        // parse the raw address/federation name
        var address = webutil.stripRippleAddress(input);
        // parse the dt parameter if it has one
        var destinationTag = webutil.getDestTagFromAddress(input);
        if (destinationTag) {
            $scope.send.destination.destinationTag = destinationTag;
        }

        isFederatedAddress(address)
        .then(function (federated) {
            // check we're still current
            if (inputHasChanged()) {
                return $q.reject("not-current");;
            }
            if (federated) {
                return contacts.fetchContactByEmail(address)
                    .then(function (result) {
                        $scope.send.federatedName = address;
                        return result;
                    });
            } else {
                return address;
            }
        })
        .then(function (result) {
            // check we're still current
            if (inputHasChanged()) {
                return $q.reject("not-current");;
            }
            if (typeof result === "string") {
                address = result;
            } else if (result) {
                address = result.destination_address;
            } else {
                // TODO: error, could not successfully find address
                return $q.reject("federation-error");
            }
            return resolveStellarAccount(address)
        })
        .then(function () {
            // check we're still current
            if (inputHasChanged()) {
                return $q.reject("not-current");
            }

            showAddressFound($scope.send.destination.address);

            updateCurrencyConstraints();
        })
        .then(function () {
            updateCurrency();
        })
        .catch(function (error) {
            $scope.resetDestinationDependencies();
            switch (error) {
                case "federation-error":
                    showError("account-not-found");
                case "account-not-found":
                    showError("account-not-found");
            }
        })
    }

    // Updates the available currencies the current $scope.destination can receive
    function updateCurrencyConstraints() {
        if (_.isEmpty($scope.send.destination)) {
            return;
        }
        var deferred = $q.defer();

        // Check allowed currencies for this address
        stNetwork.remote.request_account_currencies($scope.send.destination.address)
            .on('success', function (data) {
                if (data.receive_currencies) {
                    $scope.$apply(function () {
                        // Generate list of accepted currencies
                        $scope.send.currencyChoices = _.uniq(_.compact(_.map(data.receive_currencies, function (currency) {
                            return currency;
                        })));
                        // Add STR
                        $scope.send.currencyChoices.unshift("STR");
                    });
                }
                return deferred.resolve();
            })
            .on('error', function () {
                return deferred.reject("error");
            })
            .request();

        return deferred.promise;
    }

    function updateCurrency() {
        $scope.resetCurrencyDependencies();
        $scope.send.currency = $scope.sendFormModel.currency;
        updateAmount();
    }

    var pathUpdateTimeout;
    // Updates the amount we're sending
    function updateAmount() {
        // reset any amount dependencies we have
        $scope.resetAmountDependencies();

        if (!$scope.sendFormModel.amount || $scope.sendForm.amount.$invalid) {
            return;
        }
        if (!$scope.send.currency) {
            return;
        }
        var currency = $scope.sendFormModel.currency;
        var formatted = "" + $scope.sendFormModel.amount + " " + $scope.send.currency;
        var amount = $scope.send.amount = Amount.from_human(formatted);
        if (!amount.is_native()) {
            // set issuer to recipient to resolve issuer to their trustlines automatically
            amount.set_issuer($scope.send.destination.address);
        }

        // check to make sure the destination has enough stellar
        var total = amount.add($scope.send.destination.balance);
        var reserve_base = $rootScope.account.reserve_base;
        if (total.compareTo(reserve_base) < 0) {
            // TODO: destination account doesn't meet reserve, send this much more to fund it
            var str_deficiency = reserve_base.subtract($scope.send.destination.balance);
            $scope.send.fundStatus = "insufficient-str";
            return;
        }

        if (pathUpdateTimeout) {
            $timeout.cancel(pathUpdateTimeout);
        }
        pathUpdateTimeout = $timeout(updatePaths, 500);
    }

    // Updates our find_path subscription with the current destination and amount.
    function updatePaths() {
        if (_.isEmpty($scope.send.destination) || !$scope.send.amount) {
            return;
        }
        if ($scope.send.destination.requireDestinationTag && !$scope.send.destination.destinationTag) {
            return;
        }
        $scope.send.pathStatus = "pending";
        // Start path find
        var findpath = stNetwork.remote.path_find($rootScope.account.Account, $scope.send.destination.address, $scope.send.amount);
        $scope.send.findpath = findpath;
        findpath.on('update', function (result) {
            if (inputHasChanged()) {
                return;
            }
            $scope.$apply(function () {
                if (result.alternatives) {
                    processNewPaths(result);
                }
                $scope.send.pathStatus = !$scope.send.paths.length ? "no-path" : "done";
            });
        })
        findpath.on('error', function (error) {
            $scope.send.pathStatus = "error";
        })
    }

    // updates the paths the user can use to send
    function processNewPaths(result) {
        console.log(result);
        $scope.send.paths = _.map(result.alternatives, function (raw, key) {
            var path = {};
            path.amount = Amount.from_json(raw.source_amount);
            path.rate = path.amount.ratio_human($scope.send.amount);
            path.send_max = path.amount.product_human(Amount.from_json('1.01'));
            path.amount_human = path.amount.to_human();
            path.currency_human = path.amount._currency.to_human();
            path.issuer_human = path.amount._issuer.to_json();
            path.paths = raw.paths_computed
                        ? raw.paths_computed
                        : raw.paths_canonical;
            return path;
        })

        // check if we're trying to send more stellars than we have
        var overspend = $scope.send.amount.is_native()
            && $rootScope.account.max_spend
            && $rootScope.account.max_spend.to_number() > 1
            && $rootScope.account.max_spend.compareTo($scope.send.amount) < 0;

        if ($scope.send.amount.is_native() && !overspend) {
            var path = createNativePath($scope.send.amount);
            $scope.send.paths.unshift(path);
        }
    }

    // Gets the remote account from the network and populates the $scope.destination object
    function resolveStellarAccount(address) {
        var deferred = $q.defer();

        var account = stNetwork.remote.account(address);
        account.entry(function (err, data) {
            if (inputHasChanged()) {
                deferred.reject("not-current");
            }
            if (err) {
                deferred.reject("account-not-found");
            }
            $scope.send.destination.address = address;
            $scope.send.destination.requireDestinationTag = !!(data.account_data.Flags & stellar.Remote.flags.account_root.RequireDestTag);
            // if we require a dest tag and they haven't set one, show the destination tag box
            if ($scope.send.destination.requireDestinationTag && !$scope.send.destination.destinationTag) {
                $scope.send.showDestinationTag = true;
            }
            $scope.send.destination.balance = data.account_data.Balance;
            deferred.resolve();
        });

        return deferred.promise;
    }

    // returns a path object for the given amount in stellars
    function createNativePath(amount) {
        var path = {};
        path.amount = amount;
        path.amount_human = path.amount.to_human();
        path.currency_human = path.amount._currency.to_human();
        return path;
    }

    // Returns true if the user has changd the input in the send form, false otherwise
    function inputHasChanged() {
        return !angular.equals($scope.sendFormModel, $scope.sendFormModelCopy);
    }

    // Returns true if the given address is a federated name, false otherwise
    function isFederatedAddress(address) {
        var deferred = $q.defer();
        $timeout(function () {
            deferred.resolve(("string" === typeof address) && !stellar.UInt160.is_valid(address));
        })
        return deferred.promise;
    }

    function resetError() {
        $('#recipient').tooltip('destroy');
    }

    function showError(error) {
        switch (error) {
            case "account-not-found":
                Util.showTooltip($('#recipient'), "Account not found", "error", "top");
        }
    }

    function showAddressFound(address) {
        Util.showTooltip($('#recipient'), "wallet address found: " + address, "info", "top");
    }
});