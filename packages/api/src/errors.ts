/** Error codes the app maps to copy. Anything else surfaces as `unknown`. */
export type ApiErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'not_authenticated'
  | 'not_found'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  override readonly cause?: unknown;

  constructor(code: ApiErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.cause = cause;
  }
}

type PgLikeError =
  { code?: string; message?: string; status?: number; name?: string } | null | undefined;

/** Maps Supabase/PostgREST/Postgres/Auth errors to a stable ApiErrorCode. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const e = error as PgLikeError;
  const code = e?.code ?? '';
  const message = e?.message ?? 'Unexpected error';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return new ApiError('invalid_credentials', message, error);
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    /already registered/i.test(message)
  ) {
    return new ApiError('email_taken', message, error);
  }
  if (code === 'weak_password') return new ApiError('weak_password', message, error);
  if (code === '42501' || code === 'PGRST301' || e?.status === 401)
    return new ApiError('forbidden', message, error);
  if (code === 'P0002' || code === 'PGRST116') return new ApiError('not_found', message, error);
  if (code === '23505') return new ApiError('conflict', message, error);
  if (code === '23514' || code === '22023' || code === '22P02' || code === '23502') {
    return new ApiError('validation', message, error);
  }
  if (
    e?.name === 'AuthRetryableFetchError' ||
    /network request failed|fetch failed/i.test(message)
  ) {
    return new ApiError('network', message, error);
  }
  return new ApiError('unknown', message, error);
}

/** Throws a mapped ApiError when a Supabase response carries an error; returns data otherwise. */
export function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw toApiError(result.error);
  return result.data;
}

/** Same as unwrap, but also fails with not_found when data is null. */
export function unwrapOne<T>(result: { data: T; error: unknown }, what: string): NonNullable<T> {
  const data = unwrap(result);
  if (data === null || data === undefined) throw new ApiError('not_found', `${what} not found`);
  return data;
}
