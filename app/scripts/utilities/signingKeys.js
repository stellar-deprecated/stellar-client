/**
 * Generates a random stellar wallet or recovers a stellar wallet from its seed.
 *
 * @param {string} [seed] The optional base58 encoded seed.
 * @returns {{seed: {string}, address: {string}}}
 */
var SigningKeys = function(seed){
  if(seed){
    seed = new stellar.Seed().parse_json(seed);
  } else {
    Util.ensureEntropy();
    seed = new stellar.Seed().random();
  }

  var key = seed.get_key();
  var address = key.get_address();

  return {
    secret: seed.to_json(),
    address: address.to_json()
  }
};
