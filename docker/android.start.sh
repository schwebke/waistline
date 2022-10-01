#!/bin/sh
git clone https://github.com/rastafan/cordova-plugin-crop.git || true
cordova platform add android || true
cordova build android
