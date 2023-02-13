FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-message-cache /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]