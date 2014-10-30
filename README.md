# Stellar Client

The Stellar client is an AngularJS application that allows users to interact with the Stellar network from their browser.
This client allows users to register for an account, generate a wallet containing cryptographic keys, and submit transactions to the Stellar network.

You can see it in action here: https://launch.stellar.org

## Security

Encrypting secret data:
 - Secret keys are encrypted in the browser before storing them in a [stellar-wallet](https://github.com/stellar/stellar-wallet) server.
 - Wallets are encrypted using 256bit AES in GCM mode.
 - The key used to encrypt/decrypt a wallet is derived from a username and password using [scrypt](http://en.wikipedia.org/wiki/Scrypt).

Signing transactions:
 - Transactions are signed using the [Ed25519 signature system](http://ed25519.cr.yp.to/) implemented in [tweetnacl](http://tweetnacl.cr.yp.to/).
 - Signing keys are generated randomly during registration.
 - Transactions are signed in the browser before submitting them to a [stellard](https://github.com/stellar/stellard) server.

## Setting up your dev server

```bash

# Install bower and gulp
npm install -g bower
npm install -g gulp

# Install dev dependencies
npm install

# Install app dependencies
bower install

# (optional) Install phantomjs for automated testing
brew install phantomjs

```

## Starting your dev server

```bash
gulp develop
```

By default, your client will be running against the `stg` environment, which is connected to the stellar testnet.

## Testing against the production wallet and api services

Switching what service endpoints your client is talking too is as simple as running a gulp task and restarting your dev server.

```bash
gulp config-prd
gulp develop
```

`gulp config-prd` will overwrite app/scripts/config.js with the values from config/prd.js, pointing you at the production apis.

## Public Roadmap

We've created a [public roadmap](https://trello.com/b/Clb1VMP5/platform-roadmap) so that you can see what work is planned, what is in progress, and when features have been released.  You can see previews of designs, give feedback, and up-vote roadmap items.

[![](https://trello.com/b/Clb1VMP5.png)](https://trello.com/b/Clb1VMP5/platform-roadmap)  

## Contributing

 1. [Fork this project](https://github.com/stellar/stellar-client/fork)
 2. Create your feature branch (`git checkout -b my-new-feature`)
 3. Commit your changes (`git commit -am 'Add some feature'`)
 4. Push to the branch (`git push -u origin my-new-feature`)
 5. Create a new Pull Request

If you are wanting to help and not sure what to work on look for issues with the [contribute label](https://github.com/stellar/stellar-client/issues?q=is%3Aopen+is%3Aissue+label%3Acontribute).

## License

Stellar Client is open source and permissively licensed under the ISC license. See the LICENSE file for more details.
