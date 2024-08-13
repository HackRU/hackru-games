FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM base AS test

ENV NODE_ENV=test
CMD ["npm", "run", "test"]

FROM base AS development

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM base AS production

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]