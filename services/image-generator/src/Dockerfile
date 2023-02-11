FROM node:lts-alpine
RUN apk add make g++ jpeg-dev cairo-dev giflib-dev pango-dev libtool autoconf automake graphicsmagick imagemagick
COPY --from=blargbot/repo /app/out/services/image-generator /app/
WORKDIR /app
ENTRYPOINT [ "npm", "run", "start" ]