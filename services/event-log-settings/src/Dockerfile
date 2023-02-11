FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/event-log-settings --production
WORKDIR /app/services/event-log-settings/src
ENTRYPOINT [ "yarn", "run", "start" ]