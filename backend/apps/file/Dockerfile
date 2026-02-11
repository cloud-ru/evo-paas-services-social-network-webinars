
FROM registry_name.cr.cloud.ru/social-network-microservices/base-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build file

FROM registry_name.cr.cloud.ru/social-network-microservices/base-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/file ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production

EXPOSE 3006

CMD ["node", "dist/main"]
