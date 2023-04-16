FROM node:lts-alpine
COPY --from=blargbot/repo /app/out/services/scheduler-clock /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]