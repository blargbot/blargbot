FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-channel-search /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]