FROM node:lts-alpine as build
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
WORKDIR /app
COPY . .
RUN yarn --immutable --immutable-cache --inline-builds

FROM build as discord-proxy
WORKDIR /app/services/discord-proxy/src
ENTRYPOINT [ "yarn", "run", "start" ]

FROM build as discord-gateway
WORKDIR /app/services/discord-gateway/src
ENTRYPOINT [ "yarn", "run", "start" ]