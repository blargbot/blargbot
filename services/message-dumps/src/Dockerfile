FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/message-dumps /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]