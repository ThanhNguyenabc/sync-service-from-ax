FROM node:latest
WORKDIR /app
COPY . /app
RUN yarn install --network-timeout=60000\
    && npm install typescript -g

# RUN yarn build
CMD [ "yarn", "dev" ]