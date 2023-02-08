FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/discord-reaction-stream --production
WORKDIR /app/services/discord-reaction-stream/src
ENTRYPOINT [ "yarn", "run", "start" ]