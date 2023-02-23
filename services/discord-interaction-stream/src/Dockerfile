FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-interaction-stream /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]