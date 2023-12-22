FROM node:latest as base
USER root
RUN sudo chmod a+w bitnami
RUN sudo chmod a+w logs
WORKDIR /app
# copy all dpendecies
COPY package.json nodemon.json tsconfig.json ./
RUN yarn global add typescript
RUN yarn install --network-timeout=60000
# copy source code
COPY ./src ./src
EXPOSE 3000



FROM base as prod
RUN yarn build
ENV NODE_ENV=production
CMD [ "yarn", "start" ]



FROM base as dev
ENV NODE_ENV=development
CMD [ "yarn", "dev" ]
