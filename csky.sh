#!/bin/bash
set -e
cd "`dirname "$BASH_SOURCE"`"

# xmake clean
# rm .xmake -rf
# rm /home/king/.xmake/packages/l/libtomcrypt/ -rf
# rm /home/king/.xmake/repositories/build-artifacts/packages/l/libtomcrypt/ -rf
# rm /home/king/.xmake/repositories/build-artifacts/packages/l/libtomcrypt/ -rf
# rm /home/king/.xmake/packages/l/libtomcrypt/ -rf
# rm /home/king/.xmake/cache/packages/2503/l/libtomcrypt -rf


xmake f -p linux -a csky -m release --sdk=/home/king/c/csky-linux --cross=csky-linux- 
# xmake -v
xmake
du build/linux/csky/release/ejs -h