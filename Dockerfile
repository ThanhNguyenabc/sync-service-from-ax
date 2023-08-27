FROM node:latest
WORKDIR /app
COPY . /app
RUN yarn install --network-timeout=60000
# RUN yarn build
CMD [ "yarn", "nodemon" ]