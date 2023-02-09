FROM node:lts-alpine as find-packages
WORKDIR /app
COPY . .
RUN find -type f ! \( -path "*/package.json" -or -path "./.yarn*" -or -path "./yarn.lock" -or -path "./.pnp.*" \) -print | xargs rm -rf

FROM node:lts-alpine as packages
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
WORKDIR /app
COPY --from=find-packages /app .
RUN yarn --immutable --immutable-cache

FROM node:lts-alpine as build
WORKDIR /app
COPY . .
COPY --from=packages /app .
RUN yarn build

FROM node:lts-alpine as out
WORKDIR /app
COPY --from=build /app .
