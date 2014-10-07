#!/bin/bash

sh ./seleniumServer/grid/kill.sh &
sh ./seleniumServer/grid/setup.sh &

node /seleniumServer/server/app.js &
node /service/app.js &