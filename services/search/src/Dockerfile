FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/search /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]