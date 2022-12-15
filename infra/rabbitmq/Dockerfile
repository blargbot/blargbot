FROM rabbitmq:3.11.2-management-alpine
HEALTHCHECK --interval=30s --timeout=30s --retries=3 CMD rabbitmq-diagnostics -q ping
COPY plugins plugins
COPY config.conf /etc/rabbitmq/rabbitmq.conf
RUN rabbitmq-plugins enable rabbitmq_message_deduplication