FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/discord-message-stream --production
WORKDIR /app/services/discord-message-stream/src
ENTRYPOINT [ "yarn", "run", "start" ]