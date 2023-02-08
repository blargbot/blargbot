FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/discord-gateway --production
WORKDIR /app/services/discord-gateway/src
ENTRYPOINT [ "yarn", "run", "start" ]