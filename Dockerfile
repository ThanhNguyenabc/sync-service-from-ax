FROM node:latest
WORKDIR /app
COPY . /app
USER root
RUN mkdir bitnami
RUN chown 1001:1001 /bitnami/kafka
RUN chown 1001:1001 /bitnami/zookeeper

RUN npm install typescript -g
RUN yarn install --network-timeout=60000
# RUN yarn build
CMD [ "yarn", "dev" ]