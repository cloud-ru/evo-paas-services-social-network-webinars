import { SetMetadata } from '@nestjs/common';

export const INVALIDATE_CACHE_KEY = 'cache:invalidate';

/**
 * Declare which cache keys should be deleted after a successful mutation.
 *
 * Supports runtime interpolation of `:id` and `:userId` from the request
 * context (params and authenticated user).
 *
 * Example:
 *   @InvalidateCache('res:post:{id}')
 *   @InvalidateCache('res:user:me:{userId}', 'res:user:profile:{userId}')
 */
export const InvalidateCache = (...keys: string[]) =>
  SetMetadata(INVALIDATE_CACHE_KEY, keys);

/**
 * Retrieve invalidation keys declared on a handler.
 */
export function getInvalidateCacheKeys(target: any): string[] {
  return Reflect.getMetadata(INVALIDATE_CACHE_KEY, target) ?? [];
}

/**
 * Interpolate `{param}` placeholders with actual request values.
 *
 * Supported placeholders:
 *   {id}      — from request.params.id
 *   {userId}  — from request.params.userId or request.user.userId
 *   {recipientId} — inferred from CreateMessageDto.recipientId (handled at call site)
 */
export function interpolateCacheKey(
  template: string,
  params: Record<string, string>,
  userId: string,
): string {
  return template
    .replace(/{([^}]+)}/g, (_, key: string) => {
      if (key === 'userId') return userId;
      return params[key] ?? `{${key}}`;
    });
}
