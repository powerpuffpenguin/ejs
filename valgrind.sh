#!/bin/bash
set -e
dir="$(cd "`dirname "$BASH_SOURCE"`" && pwd)"


valgrind --child-silent-after-fork=yes --leak-check=full --show-leak-kinds=all --verbose "$dir/build/linux/x86_64/release/ejs" "$@"
# valgrind --child-silent-after-fork=yes --leak-check=full --show-leak-kinds=all --verbose "$dir/build/linux/x86_64/debug/ejs" "$@"
