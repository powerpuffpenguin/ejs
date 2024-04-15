#!/bin/bash
set -e
cd "`dirname "$BASH_SOURCE"`"

xmake f -p linux -a x86_64 -m release
xmake install -o third_party/xmake