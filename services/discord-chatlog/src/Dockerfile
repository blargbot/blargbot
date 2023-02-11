FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/discord-chatlog /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]