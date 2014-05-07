# Stellar Client

The Stellar client is an AngularJS application that allows users to create, use,
and manage their account and wallet.

## Setting up your dev server
**TODO:** Script setup with makefile.

```bash
# Install dependencies
npm install
bower install

# Build dependencies
browserify ./app/bower_components/bs58/lib/bs58.js > ./app/bower_components/bs58/lib/bs58.bundle.js --standalone base58

./app/bower_components/sjcl/configure --with-all
./app/bower_components/sjcl/make
```

## Starting your dev server

```bash
gulp watch
```