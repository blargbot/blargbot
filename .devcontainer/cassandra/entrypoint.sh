#!/bin/bash
/configure.sh "$@"
: > /configure.sh
/docker-entrypoint.sh "$@"