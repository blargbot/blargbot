FROM rabbitmq:3.11.2-management-alpine
COPY plugins plugins
COPY config.conf /etc/rabbitmq/rabbitmq.conf
HEALTHCHECK CMD rabbitmq-diagnostics -q ping
RUN rabbitmq-plugins enable rabbitmq_message_deduplication