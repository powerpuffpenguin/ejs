#!/bin/bash
set -e
dir="$(cd "`dirname "$BASH_SOURCE"`" && pwd)"


valgrind --leak-check=full --show-leak-kinds=all --verbose "$dir/build/linux/x86_64/release/ejs" "$@"
# valgrind --leak-check=full --show-leak-kinds=all --verbose "$dir/build/linux/x86_64/debug/ejs" "$@"
