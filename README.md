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
cd app/bower_components/sjcl/
./configure --with-all
./make
```

## Starting your dev server

```bash
gulp watch
```