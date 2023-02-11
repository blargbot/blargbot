FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-proxy /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]