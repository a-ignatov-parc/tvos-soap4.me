#!/usr/bin/env sh

echo "Clearing old artifacts..."
rm -rf ./out/

echo "Building..."
./node_modules/.bin/gulp --production
