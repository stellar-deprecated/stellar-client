'use strict';

var Amount = ripple.Amount;

var sc = angular.module('stellarClient');

sc.directive('sendPane', function($rootScope,$filter){
    return {
        restrict: 'E',
        replace: true,
        transclude: false,
        scope: {},
        templateUrl: '/templates/send.html',
        controller: function($rootScope,$scope, $element){
            //console.log('hello '+$rootScope.tab);

            // XXX Most of these variables should be properties of $scope.send.
            //     The Angular devs recommend that models be objects due to the way
            //     scope inheritance works.
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
                fund_status: 'none'
            };

            $scope.str_memory = {};

            $scope.sendErrors = [];

            $scope.cancelSend = function(){
                $rootScope.tab='none';
                $scope.destination='';
                $scope.amount='';
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
                                    $scope.xrp_memory[recipient] = "0";
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

            $scope.attemptSend = function() {
                // Remove any previous error messages.
                $scope.sendErrors = [];

                var validInput = true;

                if(!$scope.amount){
                    validInput = false;
                    $scope.alphaCodeErrors.push('Must enter an amount.');
                }

                if(validInput){
                    var data = {
                        alphaCode: $scope.alphaCode
                    };

                    //$scope.alphaCodeErrors.push('test1');

                    // Submit the registration data to the server.
                    requestAlpha.send(data,
                        // Success
                        function (response) {
                            $scope.$apply(function () {
                                //$scope.alphaCodeErrors.push('test');
                                console.log(response.status);
                                switch(response.status)
                                {
                                    case 'success':
                                        // Save code for the registration page
                                        session.put('alpha', $scope.alphaCode);
                                        $state.go('register');
                                        break;

                                    case 'used':
                                        $scope.alphaCodeErrors.push('Sorry this code has already been used.');
                                        break;

                                    default:
                                        //console.log($scope.alphaCodeErrors[0]);
                                        $scope.alphaCodeErrors.push('Sorry this code is invalid.');  // TODO: why is this not displaying?
                                        //$scope.$apply();
                                        break;
                                }
                            });
                        },
                        // Fail
                        function(){
                            $scope.alphaCodeErrors.push('Something is wrong?');
                        }
                    );
                }
            };
        }
    };
});