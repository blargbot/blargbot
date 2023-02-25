FROM rethinkdb:2.4
RUN apt-get update -y && apt-get install -y python3.10 python3-pip && python3 -m pip install rethinkdb
COPY *.sh /
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["rethinkdb", "--bind", "all"]