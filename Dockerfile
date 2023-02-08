FROM node:lts-alpine as build
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
WORKDIR /app
COPY . .
RUN yarn --immutable --immutable-cache
RUN yarn build

FROM node:lts-alpine as out
WORKDIR /app
COPY --from=build /app .
