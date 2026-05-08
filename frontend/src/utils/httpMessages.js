/**
 * Plain-language messages for HTTP errors (non-technical users).
 */
export function friendlyHttpMessage(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const serverMsg = typeof data?.message === 'string' ? data.message : '';

  if (status === 401) {
    return 'Login required. Please sign in again.';
  }
  if (status === 403) {
    return 'Access denied. You may not have permission for this.';
  }
  if (status === 404) {
    return 'This information could not be found.';
  }
  if (status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'The service is temporarily unavailable. Please try again later.';
  }
  if (serverMsg && !/^(4|5)\d{2}\b|unauthorized|forbidden/i.test(serverMsg)) {
    return serverMsg;
  }
  return 'Something went wrong. Please try again.';
}
