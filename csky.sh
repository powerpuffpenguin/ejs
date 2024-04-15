#!/bin/bash
set -e
cd "`dirname "$BASH_SOURCE"`"

xmake f -p linux -a csky -m release --sdk=/home/king/c/csky-linux --cross=csky-linux- 
xmake
du build/linux/csky/release/hello -h