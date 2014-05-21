'use strict';

var sc = angular.module('stellarClient');

/**
 * Parse and rewrite transaction data into a more usable format.
 *
 * @param {string} data The JSON encoded transaction data.
 *
 * @returns {Array.<Object>} The rewritten transaction data.
 */
function parseTransactionData(data){
  data = JSON.parse(data);

  return data.result.transactions.map(function(transaction){
    return JsonRewriter.processTxn(transaction.tx, transaction.meta, data.result.account);
  });
}

sc.directive('transactionHistory', function(session, ngTableParams, $filter){
  return {
    restrict: 'E',
    replace: true,
    transclude: false,
    scope: {},
    templateUrl: '/templates/transaction-history.html',

    controller: function($scope, $element){
      // Connect to the Stellar network.
      session.connect();
      var network = session.get('network');

      // Parse and store transaction data in an array as it is sent form the server.
      var transactions = [];
      network.onTransaction(function(data){
        transactions = transactions.concat(parseTransactionData(data));

        // The new transactions my have changed the balance.
        network.updateBalance();
      });

      // Get the user's account balance.
      network.updateBalance();

      $scope.typeIcons = {
        'sent': 'glyphicon glyphicon-upload',
        'received': 'glyphicon glyphicon-download'
      };

      $scope.tableParams = new ngTableParams({
        page: 1,
        count: 10,
        sorting: {
          date: 'asc'
        }
      }, {
        total: transactions.length,
        getData: function($defer, params) {
          var data = params.sorting() ? $filter('orderBy')(transactions, params.orderBy()) : transactions;
          $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      });

      // TODO: Don't spoof transactions.
      var data = '{"id":17,"result":{"account":"rKGTpGDWgoVVuDgS6jCyNYehi45kXaJop8","ledger_index_max":6626379,"ledger_index_min":32570,"limit":10,"transactions":[{"meta":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"16D7D01349CC6C5A118BBE38EC84B08169362CD9F074DFBB4B39690F21288E88","NewFields":{"Account":"rKGTpGDWgoVVuDgS6jCyNYehi45kXaJop8","Balance":"20000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"rGyMA2VfxGA88RkToPc89ByrPQ3mARAD3F","Balance":"1979999988","Flags":0,"OwnerCount":0,"Sequence":2},"LedgerEntryType":"AccountRoot","LedgerIndex":"9AFED558638F135BAB715F5BF724231884392F64C010486757303B7E973CDD91","PreviousFields":{"Balance":"2000000000","Sequence":1},"PreviousTxnID":"10B697FBD37D7DF5BC15E8C635933484A77917D3B25F90FACD8E4A37697A58B3","PreviousTxnLgrSeq":6522906}}],"TransactionIndex":1,"TransactionResult":"tesSUCCESS"},"tx":{"Account":"rGyMA2VfxGA88RkToPc89ByrPQ3mARAD3F","Amount":"20000000","Destination":"rKGTpGDWgoVVuDgS6jCyNYehi45kXaJop8","Fee":"12","Flags":0,"Sequence":1,"SigningPubKey":"02AB48F9F98FAD46C0CF0670F7511D5023101F3E59E81DB7976190899DA24D8579","TransactionType":"Payment","TxnSignature":"304402203F26D85C5F90C972511D99B35F34467D6611B9B4DFAEBA589D9B5C047C01F1D102204B4A9DDDAD1D5A57485DF7A7B5727AF0CB6F7D08CEF3E0302819D86B1B542BD1","date":453253340,"hash":"F28C1F9C6EE3629468FB6F0E638A8100351195B19926E2AEB28DF54A02F10616","inLedger":6594676,"ledger_index":6594676},"validated":true}]},"status":"success","type":"response"}';
      network.remote.emit('net_transaction', data);
    }
  };
});