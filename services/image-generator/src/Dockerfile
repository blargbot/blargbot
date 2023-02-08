FROM node:lts-alpine
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
COPY --from=blargbot/repo /app /app
WORKDIR /app
RUN yarn workspaces focus @blargbot/image-generator --production
WORKDIR /app/services/image-generator/src
ENTRYPOINT [ "yarn", "run", "start" ]