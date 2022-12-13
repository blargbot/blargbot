FROM node:lts-alpine as build
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
WORKDIR /app
COPY . .
RUN yarn --immutable --immutable-cache --inline-builds

FROM build as rest-proxy
WORKDIR /app/services/rest-proxy/src
ENTRYPOINT [ "yarn", "run", "start" ]