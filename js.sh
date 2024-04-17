#!/bin/bash
set -e
cd "`dirname "$BASH_SOURCE"`"

FIND_DIR=ejs


source scripts/lib/core.sh
source scripts/lib/log.sh
source scripts/lib/time.sh

js_build_min(){
    local src="$1"
    local dst="$2"
    local sumfile="$3"
    local sum
    if [[ -f "$dst" ]] && [[ -f "$sumfile" ]];then
        sum=(`md5sum "$src"`)
        if [[ "$sum" == `cat "$sumfile"` ]];then
            return
        fi
    fi
    google-closure-compiler --language_in ECMASCRIPT5 --language_out ECMASCRIPT5 --js "$src" --js_output_file "$dst"
    if [[ "$sum" == "" ]];then
        sum=(`md5sum "$src"`)
    fi
    echo "$sum" > "$sumfile"
}
js_min(){
    local src=$1
    if [[ $1 == *.min.js ]];then
        local dir=`dirname js/$src`
        if [[ ! -d "$dir" ]];then
            mkdir "$dir" -p
        fi
        cp $src "js/$src"
        return 0;
    fi
    local name=${src%.js}
    local dst=${name}.min.js
    log_info "$src => $dst"
    dst="js/$dst"
    local sumfile="js/$name.sum"
    js_build_min "$src" "$dst" "$sumfile"
}
js_ts_min(){
    local src=$1
    local name=${src%.ts}
    local dst=${name}.min.js
    log_info "$src => $dst"
    dst="js/$dst"

    local js="js/$name.js"
    local cut="js/$name.cut.js"
    local sumfile="js/$name.sum"
    mkdir -p "`dirname "$js"`"

    local line
    local ok=0
    while read -r line || [[ -n $line ]]; do
        if [[ "$ok" == 0 ]] && [[ "$line" == Object.defineProperty* ]];then
            ok=1
            echo "(function(){
\"use strict\";
return (function(exports,__duk,deps){
var __values=__duk.__values;
var __extends=__duk.__extends;
var __awaiter=__duk.__awaiter;
var __generator=__duk.__generator;
var __read=__duk.__read;
var __spreadArray=__duk.__spreadArray;
" > "$cut"
        fi
        echo "$line" >> "$cut"
    done < "$js"
    if [[ $ok == 1 ]];then
        echo "return exports;});})();" >> "$cut"
    else
        cp "$js" "$cut"
    fi
    js_build_min "$cut" "$dst" "$sumfile"
}
js_find(){
    local ifs=$IFS
    IFS=$'\n'
    files=(`find "$1" -name "$2"`)
    IFS=$ifs
}
js_tsc(){
    mkdir -p js
    js_find "$FIND_DIR" "*.ts"
    local sum0="js/tsc.0.sum"
    local sum="js/tsc.sum"
    echo > "$sum0"
    for file in "${files[@]}";do
        md5sum "$file" >> "$sum0"
    done
    if [[ -f "$sum" ]];then
        local v0=(`md5sum "$sum0"`)
        local v1=(`md5sum "$sum"`)
        if [[ "$v0" == "$v1" ]];then
            return
        fi
    fi
    tsc
    cp "$sum0" "$sum"
}
js_cc(){
    local name
    if [[ $1 == *.ts ]];then
        name=${1%.ts}
    elif [[ $1 == *.min.js ]];then
        name=${1%.min.js}
    else 
        name=${1%.js}
    fi
    local dst="$name.h"
    log_info "$1 => $dst"
    local src="js/$name.min.js"
    local once=${dst//\//_}
    once=${once//./_}
    once=${once//-/_}
    echo "#ifndef EMBEDDED_JS_${once}_XXD_H" > "$dst"
    echo "#define EMBEDDED_JS_${once}_XXD_H" >> "$dst"

    xxd -i "$src" >> "$dst"
    echo "#endif // EMBEDDED_JS_${once}_XXD_H" >> "$dst"
}
main(){
    cd src
    
    local tsc=true
    local min=true
    local cc=true
    
    time_unix
    local at=$result
    local used
    local files
    local file

    if [[ $tsc == true ]];then
        log_info "typescript => javascript"
        time_unix
        used=$result
        js_tsc
        time_since $used
        log_info "tsc, used ${result}s"
    fi

    if [[ $min == true ]];then
        time_unix
        used=$result

        js_find "$FIND_DIR" "*.ts"
        for file in "${files[@]}";do
            js_ts_min "$file"
        done
        
        js_find "$FIND_DIR" "*.js"
        for file in "${files[@]}";do
            js_min "$file"
        done
        time_since $used
        log_info "min js, used ${result}s"
    fi

    if [[ $cc == true ]];then
        time_unix
        used=$result

        js_find "$FIND_DIR" "*.ts"
        for file in "${files[@]}";do
            js_cc "$file"
        done
        js_find "$FIND_DIR" "*.js"
        for file in "${files[@]}";do
            js_cc "$file"
        done
        time_since $used
        log_info "js to c header, used ${result}s"
    fi

    time_since $at
    log_info "all success, used ${result}s"
}
main