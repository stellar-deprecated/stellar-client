#! /usr/bin/env bash
set -e

export NODE_ENV=production

npm install -g gulp
npm install
bower install
gulp dist