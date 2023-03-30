FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/bbtag-variables /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]