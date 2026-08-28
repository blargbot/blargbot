FROM rabbitmq:4.3.5-management-alpine
COPY config/ /etc/rabbitmq/
COPY plugins/ plugins

HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=5 \
  CMD rabbitmq-diagnostics -q ping || exit 1

RUN rabbitmq-plugins enable rabbitmq_message_deduplication