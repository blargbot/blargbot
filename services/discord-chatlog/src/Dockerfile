FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/discord-chatlog --production
WORKDIR /app/services/discord-chatlog/src
ENTRYPOINT [ "yarn", "run", "start" ]