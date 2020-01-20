#!/bin/bash

uglifyjs --compress --mangle --output game.min.raw.js -- js/constants.js js/ui.js js/game.js js/animator.js

python correctMin.py
