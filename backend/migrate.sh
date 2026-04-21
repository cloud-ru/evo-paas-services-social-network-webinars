#!/bin/sh
set -e

echo "Starting migrations..."

echo "Migrating Auth service..."
npx prisma migrate deploy --schema apps/auth/prisma/schema.prisma

echo "Migrating User service..."
npx prisma migrate deploy --schema apps/user/prisma/schema.prisma

echo "Migrating Message service..."
npx prisma migrate deploy --schema apps/message/prisma/schema.prisma

echo "Migrating Post service..."
npx prisma migrate deploy --schema apps/post/prisma/schema.prisma

echo "All migrations completed successfully!"
