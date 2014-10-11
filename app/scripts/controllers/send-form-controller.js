'use strict';
/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('SendFormController', function($rootScope, $scope, $timeout, $q, StellarNetwork, contacts, whileValid) {

    // This object holds the raw send form data entered by the user.
    $scope.sendFormModel = {};
    // we hold a copy to check for changes after asynchronous calls
    $scope.sendFormModelCopy = {};

    // Populate the send form with parameters from the send action.
    $scope.$on('action-send', function(event, params){
        $scope.openSend();

        $scope.sendFormModel.recipient = params.dest;
        $scope.sendFormModel.amount = Number(params.amount);
        $scope.sendFormModel.currency = params.currency || 'STR';
        if (params.dt) {
            // use a short timeout to allow digest from watchers of above values
            // to run first and call $scope.resetDestinationDependencies() (which overwrites values below)
            $timeout(function () {
                $scope.send.showDestinationTag = true;
                $scope.send.destination.destinationTag =  Number(params.dt);
            }, 100);
        }
    });

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
        if (!newValue || isNaN(newValue)) {
            $scope.resetAmountDependencies();
            return;
        }
        $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);
        updateAmount().then(updatePaths);
    });

    $scope.$watch('sendFormModel.currency', function () {
        $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);

        $scope.resetCurrencyDependencies();
        $scope.send.currency = $scope.sendFormModel.currency;
        updateAmount().then(updatePaths);
    });

    $scope.$watch('send.destination.destinationTag', function (newValue, oldValue) {
        if(newValue && !oldValue) {
            $scope.sendFormModelCopy = angular.copy($scope.sendFormModel);
            updateAmount().then(updatePaths);
        }
    });

    $scope.changeCurrency = function(newCurrency) {
            $scope.sendFormModel.currency = newCurrency;
    };

    $scope.getPathText = function (path) {
        var human = path.to_human();
    };

    //this is because the currency dropdown gets cut-off because the parent container
    //is set to overflow:hidden for the slide animation effect. so we have to
    //set overflow:visible if they click onto the dropdown menu.

    $scope.setOverflowVisible = function(){
            $rootScope.overflowVisible = true;
    };

    $scope.$on('reset', function () {
        $scope.sendFormModel = {};
        $scope.sendFormModel.currency = $scope.send.currencyChoices[0];
    });

    /**
    * Resolves a stellar account from the user's input in the send form.
    */
    function updateDestination() {
        var input = $scope.sendFormModel.recipient;

        clearPaths();

        // parse the raw address/federation name
        var address = webutil.stripRippleAddress(input);
        // parse the dt parameter if it has one
        var destinationTag = webutil.getDestTagFromAddress(input);
        if (destinationTag) {
            $scope.send.destination.destinationTag = Number(destinationTag);
        }

        whileValid(function() {
            if (inputHasChanged()) {
                return $q.reject("not-current");
            }
        })
        .then(function () {
            if (isValidAddress(address)) {
                contacts.fetchContactByAddress(address)
                    .then(function(result) {
                        $scope.send.federatedName = result.destination;
                        showUserFound(result.destination);
                    });

                return address;
            } else {
                return contacts.fetchContactByEmail(address)
                    .then(function (result) {
                        $scope.send.federatedName = address;
                        return result;
                    });
            }
        })
        .then(function (result) {
            if (typeof result === "string") {
                address = result;
            } else if (result) {
                address = result.destination_address;
                $scope.send.destination.destinationTag = result.destination_tag;
            } else {
                // TODO: error, could not successfully find address
                return $q.reject("federation-error");
            }
            return resolveStellarAccount(address);
        })
        .catch(function (error) {
            $scope.resetDestinationDependencies();
            switch (error) {
                case "account-not-found":
                    // Continue sending to the unfunded account.
                    break;
                case "federation-error":
                    showError("account-not-found");
                default:
                    return $q.reject(error);
            }
        })
        .then(function () {
            if(input !== address) {
                showAddressFound($scope.send.destination.address);
            }

            // Get the currency constraints
            return StellarNetwork.request('account_currencies', {account: $scope.send.destination.address});
        })
        .then(function (data) {
            if (data.receive_currencies) {
                // Generate list of accepted currencies
                $scope.send.currencyChoices = _.uniq(data.receive_currencies);
            } else {
                $scope.send.currencyChoices = [];
            }

            // Add STR
            $scope.send.currencyChoices.unshift("STR");
        })
        .then(function () {
            $scope.resetCurrencyDependencies();
            $scope.send.currency = $scope.sendFormModel.currency;
        })
        .then(function () {
            return updateAmount();
        })
        .then(function () {
            return updatePaths();
        });
    }

    function updateAmount() {
        // reset any amount dependencies we have
        $scope.resetAmountDependencies();

        var invalidAmount = !$scope.sendFormModel.amount || isNaN($scope.sendFormModel.amount);
        var invalidCurrency = !$scope.send.currency;
        if (invalidAmount || invalidCurrency) {
            return $q.reject();
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
            $scope.send.str_deficiency = reserve_base.subtract($scope.send.destination.balance);
            $scope.send.fundStatus = "insufficient-str";
            return $q.reject();
        } else {
            $scope.send.fundStatus = "";
            $scope.send.str_deficiency = 0;
        }

        return $q.when();
    }

    function clearPaths() {
        $scope.send.paths = [];

        if($scope.send.findpath) {
            $scope.send.findpath.close();
            delete $scope.send.findpath;
        }
    }

    // Updates our find_path subscription with the current destination and amount.
    function updatePaths() {
        var invalidForm = _.isEmpty($scope.send.destination) || !$scope.send.amount;
        var invalidDT = $scope.send.destination.requireDestinationTag && !$scope.send.destination.destinationTag;

        if (invalidForm || invalidDT) {
            return $q.reject();
        }

        $scope.send.pathStatus = "pending";

        clearPaths();

        var deferred = $q.defer();

        // Start path find
        $scope.send.findpath = StellarNetwork.remote.path_find($rootScope.account.Account, $scope.send.destination.address, $scope.send.amount);
        $scope.send.findpath.on('update', function (result) {
            $scope.$apply(function () {
                if (result.alternatives) {
                    processNewPaths(result);
                }
                $scope.send.pathStatus = !$scope.send.paths.length ? "no-path" : "done";
                deferred.resolve();
            });
        });
        $scope.send.findpath.on('error', function (error) {
            $scope.send.pathStatus = "error";
            deferred.reject('error');
        });

        return deferred.promise;
    }

    // updates the paths the user can use to send
    function processNewPaths(result) {
        $scope.send.paths = _.map(result.alternatives, function (raw, key) {
            var path = {};
            path.amount = Amount.from_json(raw.source_amount);
            path.rate = path.amount.ratio_human($scope.send.amount);
            path.send_max = path.amount.product_human(Amount.from_json('1.01'));
            path.currency_human = path.amount._currency.to_human();
            path.issuer_human = path.amount._issuer.to_json();
            path.paths = raw.paths_computed || raw.paths_canonical;

            // An identifier so that angular can track the elements using ng-repeat's track by
            path.issuer_currency = path.issuer_human + ',' + path.currency_human;

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

        var account = StellarNetwork.remote.account(address);
        account.entry(function (err, data) {
            if (inputHasChanged()) {
                deferred.reject("not-current");
                return;
            }

            $scope.send.destination.address = address;

            var accountFlags = Util.tryGet(data, 'account_data.Flags') || 0;
            $scope.send.destination.requireDestinationTag = !!(accountFlags & stellar.Remote.flags.account_root.RequireDestTag);

            // if we require a dest tag and they haven't set one, show the destination tag box
            if ($scope.send.destination.requireDestinationTag && !$scope.send.destination.destinationTag) {
                $scope.send.showDestinationTag = true;
            }

            var accountBalance = Util.tryGet(data, 'account_data.Balance') || 0;
            $scope.send.destination.balance = accountBalance;

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

    // Returns true if the given address is a valid stellar address
    function isValidAddress(address) {
        return stellar.UInt160.is_valid(address);
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
        var displayAddress = address;
        if($scope.send.destination.destinationTag) {
            displayAddress += '?dt=' + $scope.send.destination.destinationTag;
        }

        Util.showTooltip($('#recipient'), "wallet address found: " + displayAddress, "info", "top");
    }

    function showUserFound(username) {
        Util.showTooltip($('#recipient'), "user found: " + username, "info", "top");
    }
});
