FROM node:latest as base
USER root
WORKDIR /app
# copy all dpendecies
COPY package.json nodemon.json tsconfig.json ./
# copy source code
COPY ./src ./src
EXPOSE 3000



FROM base as production
RUN yarn global add typescript
RUN yarn install --network-timeout=60000
RUN yarn build
ENV NODE_ENV=production
CMD [ "yarn", "start" ]



FROM base as dev
ENV NODE_ENV=development
RUN yarn install --network-timeout=60000 
CMD [ "yarn", "dev" ]
