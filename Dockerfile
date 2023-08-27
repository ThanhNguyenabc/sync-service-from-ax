FROM node:latest
WORKDIR /app
COPY . /app
RUN npm install typescript -g
RUN yarn install --network-timeout=60000
# RUN yarn build
CMD [ "yarn", "dev" ]