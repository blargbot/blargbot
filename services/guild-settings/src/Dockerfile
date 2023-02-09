FROM blargbot/repo
RUN yarn workspaces focus @blargbot/guild-settings --production
WORKDIR /app/services/guild-settings/src
ENTRYPOINT [ "yarn", "run", "start" ]