FROM mcr.microsoft.com/devcontainers/typescript-node:26
RUN sudo apt-get update; \
    sudo apt-get -y install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev graphicsmagick; \
    npm i -g yarn
ENTRYPOINT [ "sleep", "infinity" ]