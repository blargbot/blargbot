FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/user-settings /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]