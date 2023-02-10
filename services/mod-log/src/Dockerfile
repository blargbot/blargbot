FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/mod-log --production
WORKDIR /app/services/mod-log/src
ENTRYPOINT [ "yarn", "run", "start" ]