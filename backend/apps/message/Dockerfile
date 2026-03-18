
FROM registry_name.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN npx prisma generate --schema apps/message/prisma/schema.prisma
RUN yarn build message

FROM registry_name.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/message ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/libs/prisma-message ./libs/prisma-message
COPY --from=builder /app/apps/message/prisma ./apps/message/prisma

EXPOSE 3004

CMD ["node", "dist/main"]
