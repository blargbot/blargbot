FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/discord-proxy --production
WORKDIR /app/services/discord-proxy/src
ENTRYPOINT [ "yarn", "run", "start" ]