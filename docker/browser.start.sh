#!/bin/sh
git clone https://github.com/rastafan/cordova-plugin-crop.git || true
cordova platform add browser || true
cordova run browser
