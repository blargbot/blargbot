#!/bin/bash
{
    python3 /configure.py
    : > /configure.py
} &
echo "commandline: $@"
$@