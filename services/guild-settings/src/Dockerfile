FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/guild-settings /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]