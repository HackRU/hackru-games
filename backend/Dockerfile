FROM node:20-alpine AS base

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
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