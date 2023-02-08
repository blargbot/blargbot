FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/user-settings --production
WORKDIR /app/services/user-settings/src
ENTRYPOINT [ "yarn", "run", "start" ]