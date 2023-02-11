FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/event-log-settings /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]