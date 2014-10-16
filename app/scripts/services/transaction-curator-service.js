var sc = angular.module('stellarClient');


/**
 * The TransactionCurator service performs transformations and introspections
 * of raw transaction data as reported from stellard.  It produces internal
 * forms of the raw data that can be used consistenly across the codebase
 * 
 * @namespace TransactionCurator
 */
sc.service('TransactionCurator', function(StellarNetwork, FriendlyOffers) {

  /**
   * Given an offer create object, will return a 
   * 
   * @param  {object} tx the raw transaction object from stellard
   * @return {Structs.Offer}
   * @memberOf TransactionCurator
   * @function
   */
  this.offerFromOfferCreate = function(tx) {
    ensureTxType(tx, 'OfferCreate');
    var transaction = getTxTransaction(tx);

    var result       = {};
    result.account   = transaction.Account;
    result.sequence  = transaction.Sequence;
    result.takerPays = StellarNetwork.amount.decode(transaction.TakerPays);
    result.takerGets = StellarNetwork.amount.decode(transaction.TakerGets);

    return result;
  };

  /**
   * Given a raw transaction, returns whether the offer created by the transaction
   * is unfilled, partially filled, or completely filled
   * 
   * @param  {object} tx the raw transaction object from stellard
   * @return {string}    'unfilled', 'filled', or 'partially-filled'
   * @memberOf TransactionCurator
   * @function
   */
  this.offerStateFromOfferCreate = function(tx) {
    ensureTxType(tx, 'OfferCreate');

    var offerFromTx   = this.offerFromOfferCreate(tx);
    var offerId       = _.pick(offerFromTx, 'account', 'sequence');
    var offerFromMeta = _(this.getOffersAffectedByTx(tx, 'CreatedNode')).find(offerId);

    if (!offerFromMeta) {
      // if no Offer node was created in the ledger, 
      // then we were fulfilled immediately
      return 'fulfilled';
    } else {
      // when a node was created
      var requestedTakerPaysValue = new BigNumber(offerFromTx.takerPays.value);
      var storedTakerPaysValue    = new BigNumber(offerFromMeta.takerPays.value);

      // if the stored value is less than the requested value,
      if(storedTakerPaysValue.lt(requestedTakerPaysValue)) {
        // we were partially filled
        return 'partially-filled';
      } else {
        return 'unfilled';
      }

    }
  };

  this.getOffersAffectedByTx = function(tx, diffType) {
    var offerMetas = _(getAffectedNodes(tx, 'Offer'));

    if (diffType) {
      offerMetas = offerMetas.filter({diffType:diffType});
    }

    var offers = offerMetas.map(function (offerMeta) {
      return getOfferFromAffectedNode(offerMeta);
    });

    return offers.value();
  };

  this.getTradeOffers = function(tx) {
    var type = tx.transaction.TransactionType;
    if (type === 'OfferCancel'){ return []; }

    var updatedOffers = this.getOffersAffectedByTx(tx, 'ModifiedNode');
    var deletedOffers = this.getOffersAffectedByTx(tx, 'DeletedNode');
    var tradeOffers   = updatedOffers.concat(deletedOffers);

    return tradeOffers;
  };


  /**
   * Throws an error if the transaction is not of the expected type.
   * 
   * @param  {object} tx           a raw transaction object
   * @param  {string} expectedType the expected type
   * @memberOf TransactionCurator
   * @private
   */
  function ensureTxType(tx, expectedType) {
    var type = getTxTransaction(tx).TransactionType;

    if (type !== expectedType) {
      throw new Error("Unexpected transaction type (" + type + "). Expected " + expectedType);
    }
  }

  /**
   * Since, at present, stellard presents us with two slightly different
   * keys that the tx data will be provided at, we use this method
   * to extract whichever is set
   *   
   * @param  {object} tx the raw tx data from stellard
   * @return {object}    the extracted data
   * @memberOf TransactionCurator
   * @private
   */
  function getTxTransaction(tx) {
    /*jshint camelcase: false */
    return tx.transaction || tx.tx_json || {};
  }

  /**
   * Since, at present, stellard presents us with two slightly different
   * keys that the tx meta data will be provided at, we use this method
   * to extract whichever is set
   *   
   * @param  {object} tx the raw tx data from stellard
   * @return {object}    the extracted metadata
   * @memberOf TransactionCurator
   * @private
   */
  function getTxMeta(tx) {
    return tx.meta || tx.metadata || {};
  }

  function getOfferFromAffectedNode(offerMeta) {
    if(offerMeta.entryType !== "Offer") {
      throw new Error("Cannot build an Offer struct from " + offerMeta.entryType + " meta entry");
    }

    var result       = {};
    result.account   = offerMeta.fields.Account;
    result.sequence  = offerMeta.fields.Sequence;
    result.takerPays = StellarNetwork.amount.decode(offerMeta.fields.TakerPays);
    result.takerGets = StellarNetwork.amount.decode(offerMeta.fields.TakerGets);

    return result;
  }

  /**
   * Extracts and normalizes the affected nodes from the given transaction.
   *
   * We normalize each node using JsonRewriter.processAnode, which does a nice
   * job of flattening and presenting a sane view.
   *
   * @param  {object} tx                    the raw transaction data
   * @param  {string} [nodeType]            an optional node type to filter the result by
   * @return {Array.<Structs.AffectedNode>} the normalized array of results
   */
  function getAffectedNodes(tx, nodeType) {
    var meta = getTxMeta(tx);
    var result = _(meta.AffectedNodes).map(JsonRewriter.processAnode);

    if(nodeType) {
      result = result.filter({entryType: nodeType});
    }

    return result.value();
  }
});