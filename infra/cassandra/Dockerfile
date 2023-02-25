FROM cassandra:3.11
RUN echo "authenticator: PasswordAuthenticator" >> /etc/cassandra/cassandra.yaml
COPY *.sh /
ENTRYPOINT [ "/entrypoint.sh" ]
HEALTHCHECK CMD ["/healthcheck.sh"]
CMD ["cassandra", "-f"]