FROM rethinkdb:2.4
RUN apt-get update -y
RUN apt-get install -y python3.10
RUN apt-get install -y python3-pip
RUN python3 -m pip install rethinkdb
COPY configure.py /configure.py
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /configure.py
RUN chmod +x /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["rethinkdb", "--bind", "all"]