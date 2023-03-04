FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/timeouts /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]