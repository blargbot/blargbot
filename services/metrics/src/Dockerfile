FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/metrics /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]