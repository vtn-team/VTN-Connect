#!/bin/sh

npm install
npx tsc
DB_USER=$1
DB_PWD=$2
node js\main.js