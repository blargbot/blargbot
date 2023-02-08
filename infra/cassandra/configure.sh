#!/bin/bash
if [[ -n ${CASSANDRA_USER+x} && -n ${CASSANDRA_PASSWORD+x} ]]; then
    echo "creating new user"
    CQL="CREATE ROLE IF NOT EXISTS $CASSANDRA_USER with SUPERUSER = true AND LOGIN = true and PASSWORD = '$CASSANDRA_PASSWORD';"
    until echo $CQL | cqlsh -u cassandra -p cassandra; do
        echo "cqlsh: Cassandra is unavailable - retry later"
        sleep 2
    done &
else
    CASSANDRA_USER="cassandra"
    CASSANDRA_PASSWORD="cassandra"
fi

if [[ -n ${CASSANDRA_KEYSPACE+x} ]]; then
    # Create default keyspace for single node cluster
    echo "creating keyspace $CASSANDRA_KEYSPACE"
    CQL="CREATE KEYSPACE IF NOT EXISTS $CASSANDRA_KEYSPACE WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};"
    until echo $CQL | cqlsh -u $CASSANDRA_USER -p $CASSANDRA_PASSWORD; do
        echo "cqlsh: Cassandra is unavailable - retry later"
        sleep 2
    done &
fi