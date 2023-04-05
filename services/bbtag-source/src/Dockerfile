FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/domain-whitelist /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]