#!/bin/bash
set -e
cd /home/claude/dev/dev
cp src-orig/*.html src/
node patch-ux.js
node patch-hub.js
node patch-brand.js
node build.js
