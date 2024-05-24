#!/bin/bash
set -e
dir="$(cd "`dirname "$BASH_SOURCE"`" && pwd)"

valgrind --leak-check=full --show-leak-kinds=all --verbose "$@"
