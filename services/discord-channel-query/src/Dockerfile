FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-channel-query /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]