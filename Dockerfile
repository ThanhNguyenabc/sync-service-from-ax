FROM node:latest
WORKDIR /www/app
COPY . /www/app
RUN yarn install
RUN yarn build
CMD [ "yarn", "dev" ]