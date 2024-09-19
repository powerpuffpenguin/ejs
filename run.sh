#!/bin/bash
set -e
dir="$(cd "`dirname "$BASH_SOURCE"`" && pwd)"


"$dir/build/linux/x86_64/debug/ejs" "$@"