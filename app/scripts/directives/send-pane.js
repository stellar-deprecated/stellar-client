'use strict';

var Amount = stellar.Amount;

//var sc = angular.module('stellarClient',['filters']);
var sc = angular.module('stellarClient');

sc.directive('sendPane', function($rootScope,$filter){
    return {
        restrict: 'E',
        replace: true,
        transclude: false,
        scope: {},
        templateUrl: '/templates/send.html',
        controller: function($rootScope, $scope, session, $element){
            //console.log('hello '+$rootScope.tab);

            $scope.mode = "form";


            $scope.send = {
                recipient: '',
                recipient_name: '',
                recipient_address: '',
                recipient_prev: '',
                amount: '',
                amount_prev: new Amount(),
                currency: 'STR - Stellars',
                currency_code: "STR",
                path_status: 'waiting',
                fund_status: 'none',
                type: 'native'
            };

            $scope.str_memory = {};

            $scope.sendErrors = [];

            $scope.cancelSend = function(){
                $rootScope.tab='none';
                $scope.destination='';
                $scope.amount='';
                $scope.mode = "form";
            }

            $scope.check_str_sufficiency = function () {
                //$scope.send.fund_status = "none";

                var recipient = $scope.send.recipient_address;
                //do some remote request to find out the balance, if it's not stored in memory already.
                if ($scope.str_memory.hasOwnProperty(recipient)) {
                    setError();
                } else {
                    $network.remote.request_account_info($scope.send.recipient_address)
                        .on('error', function (e) {
                            $scope.$apply(function () {
                                if (e.remote.error == "actNotFound") {
                                    $scope.str_memory[recipient] = "0";
                                }
                                setError();
                            });
                        })
                        .on('success', function (data) {
                            $scope.$apply(function () {
                                $scope.str_memory[recipient] = data.account_data.Balance;
                                setError();
                            });
                        })
                        .request();
                }
                function setError() {
                    var total = $scope.send.amount_feedback.add($scope.str_memory[recipient]);
                    var reserve_base = $scope.account.reserve_base;
                    if (total.compareTo(reserve_base) < 0) {
                        $scope.send.fund_status = "insufficient-str";
                        $scope.str_deficiency = reserve_base.subtract($scope.str_memory[recipient]);
                    }
                }
            };

            /**
             * N3. Display Confirmation page
             */
            $scope.send_prepared = function () {
                // check if paths are available, if not then it is a direct send
                $scope.send.indirect = $scope.send.alt ? $scope.send.alt.paths.length : false;

                $scope.confirm_wait = false;

                $scope.mode = "confirm";
            };

            /**
             * N4. Waiting for transaction result page
             */
            $scope.send_confirmed = function () {
                var currency = $scope.send.currency.slice(0, 3).toUpperCase();
                var amount = Amount.from_human(""+$scope.send.amount+" "+currency);
                var addr = $scope.send.recipient_address;
                var dt = $scope.send.dt ? $scope.send.dt : webutil.getDestTagFromAddress($scope.send.recipient);

                amount.set_issuer(addr);

                var tx = session.network.remote.transaction();

                // Destination tag
                tx.destination_tag(dt);

                // Source tag
                if ($scope.send.st) {
                    tx.source_tag($scope.send.st);
                }

                tx.payment($id.account, addr, amount.to_json());
                if ($scope.send.alt) {
                    tx.send_max($scope.send.alt.send_max);
                    tx.paths($scope.send.alt.paths);
                } else {
                    if (!amount.is_native()) {
                        tx.build_path(true);
                    }
                }
                tx.on('success', function (res) {
                    $scope.$apply(function () {
                        setEngineStatus(res, false);
                        $scope.sent(tx.hash);

                        // Remember currency and increase order
                        var found;

                        for (var i = 0; i < $scope.currencies_all.length; i++) {
                            if ($scope.currencies_all[i].value.toLowerCase() == $scope.send.amount_feedback.currency().to_human().toLowerCase()) {
                                $scope.currencies_all[i].order++;
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            $scope.currencies_all.push({
                                "name": $scope.send.amount_feedback.currency().to_human().toUpperCase(),
                                "value": $scope.send.amount_feedback.currency().to_human().toUpperCase(),
                                "order": 1
                            });
                        }
                    });
                });
                tx.on('error', function (res) {
                    setImmediate(function () {
                        $scope.$apply(function () {
                            $scope.mode = "error";

                            if (res.error === 'remoteError' &&
                                res.remote.error === 'noPath') {
                                $scope.mode = "status";
                                $scope.tx_result = "noPath";
                            }
                        });
                    });
                });
                tx.submit();

                $scope.mode = "sending";
            };

            /**
             * N6. Sent page
             */
            $scope.sent = function (hash) {
                $scope.mode = "status";
                $network.remote.on('transaction', handleAccountEvent);

                function handleAccountEvent(e) {
                    $scope.$apply(function () {
                        if (e.transaction.hash === hash) {
                            setEngineStatus(e, true);
                            $network.remote.removeListener('transaction', handleAccountEvent);
                        }
                    });
                }
            };

            function setEngineStatus(res, accepted) {
                $scope.engine_result = res.engine_result;
                $scope.engine_result_message = res.engine_result_message;
                switch (res.engine_result.slice(0, 3)) {
                    case 'tes':
                        $scope.tx_result = accepted ? "cleared" : "pending";
                        break;
                    case 'tem':
                        $scope.tx_result = "malformed";
                        break;
                    case 'ter':
                        $scope.tx_result = "failed";
                        break;
                    case 'tep':
                        $scope.tx_result = "partial";
                        break;
                    case 'tec':
                        $scope.tx_result = "claim";
                        break;
                    case 'tef':
                        $scope.tx_result = "failure";
                        break;
                    default:
                        console.warn("Unhandled engine status encountered!");
                }
            }
        }
    };
});