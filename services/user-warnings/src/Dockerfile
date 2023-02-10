FROM node:lts-alpine
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/user-warnings --production
WORKDIR /app/services/user-warnings/src
ENTRYPOINT [ "yarn", "run", "start" ]