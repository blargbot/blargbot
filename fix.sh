#!/bin/sh
function fixFile {
  for i in `jshint $1 | grep -i "Missing semicolon" \
                      | sed -e 's/\([^0-9]*\)\([0-9]*\)\(.*$\)/\2/'`;
  do
    sed -i $1 -e $i's/\(\s*\)$/;/'
  done
}

fixFile $1
