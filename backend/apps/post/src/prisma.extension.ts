import { PrismaClient } from '@app/prisma-post';
import { readReplicas } from '@prisma/extension-read-replicas';

export function createExtendedClient(
  primaryUrl: string,
  replicaUrls: string[],
) {
  const replicas = replicaUrls.map(
    (url) =>
      new PrismaClient({
        datasources: {
          db: {
            url,
          },
        },
      }),
  );

  return new PrismaClient({
    datasources: {
      db: {
        url: primaryUrl,
      },
    },
  }).$extends(
    readReplicas({
      replicas,
    }),
  );
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;
