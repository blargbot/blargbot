#!/bin/bash
docker image rm blargbot/repo || true
docker build -t blargbot/repo ..