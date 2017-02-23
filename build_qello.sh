#!/usr/bin/env sh

echo "Clearing old artifacts..."
rm -rf ./quello/

echo "Building..."
./node_modules/.bin/gulp --production --qello
