
FROM registry-name.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build file

FROM registry-name.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/file ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production

EXPOSE 3006

CMD ["node", "dist/main"]
