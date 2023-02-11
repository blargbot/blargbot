FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/user-warnings /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]