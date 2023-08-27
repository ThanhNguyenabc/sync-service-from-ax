FROM node:latest
WORKDIR /app
COPY . /app
RUN yarn install --network-timeout=30000
# RUN yarn build
CMD [ "yarn", "nodemon" ]