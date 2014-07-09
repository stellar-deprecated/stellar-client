#! /usr/bin/env bash
set -e

npm install

export NODE_ENV=production
export CI=true

./node_modules/.bin/bower install
./node_modules/.bin/gulp dist