
FROM registry_name.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN npx prisma generate --schema apps/user/prisma/schema.prisma
RUN yarn build user

FROM registry_name.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/user ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/libs/prisma-user ./libs/prisma-user
COPY --from=builder /app/apps/user/prisma ./apps/user/prisma

EXPOSE 3003

CMD ["node", "dist/main"]
