#!/bin/bash
set -e
cd "`dirname "$BASH_SOURCE"`"

xmake f \
    -p linux -a x86_64 -m debug
xmake
du build/linux/x86_64/debug/ejs -h