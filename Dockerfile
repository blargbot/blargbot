FROM node:lts-alpine as find-packages
WORKDIR /app
COPY . .
RUN find -type f ! \( -path "*/package.json" -or -path "./.yarn*" -or -path "./yarn.lock" \) -print | xargs rm -rf

FROM node:lts-alpine as link
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
WORKDIR /app
COPY --from=find-packages /app /app
RUN YARN_NODE_LINKER=node-modules YARN_NM_HOISTING_LIMITS=workspaces yarn --immutable --immutable-cache

FROM node:lts-alpine as pack
WORKDIR /app
COPY --from=link /app /app
COPY . .
RUN yarn build && node build/build.mjs

FROM node:lts-alpine as build
WORKDIR /app
COPY --from=pack /app/out /app/out
COPY --from=pack /app/definitions /app/definitions
COPY --from=pack /app/node_modules /app/node_modules
COPY --from=pack /app/package.json /app/config.json.d.ts /app/tsconfig.json /app/
