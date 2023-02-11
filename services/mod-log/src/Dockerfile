FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/mod-log /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]