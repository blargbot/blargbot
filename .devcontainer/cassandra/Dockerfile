FROM cassandra:3.11
RUN echo "authenticator: PasswordAuthenticator" >> /etc/cassandra/cassandra.yaml
COPY configure.sh /configure.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /configure.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["cassandra", "-f"]