FROM registry_name.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build api-gateway

FROM registry_name.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/api-gateway ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production

EXPOSE 3000

CMD ["node", "dist/main"]
