FROM node:lts-alpine
ARG APP_NAME
WORKDIR /app
COPY . .
RUN yarn workspaces focus $APP_NAME
ENTRYPOINT [ "yarn", "workspace", "$APP_NAME", "run", "start" ]