FROM redis
COPY redis.conf /usr/local/etc/redis/redis.conf
COPY *.sh /
HEALTHCHECK CMD ["/healthcheck.sh"]
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]