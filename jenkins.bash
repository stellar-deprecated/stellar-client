#! /usr/bin/env bash
set -e

export NODE_ENV=production
export CI=true

npm install
./node_modules/.bin/bower install
./node_modules/.bin/gulp dist