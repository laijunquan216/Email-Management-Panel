const crypto = require('crypto');

const WEBUI_COOKIE_NAME = 'webui_auth';

const buildWebuiCookieValue = () => {
  const source = process.env.WEBUI_PASSWORD || '';
  const salt = process.env.WEBUI_AUTH_SALT || 'email-panel';
  return crypto.createHash('sha256').update(`${source}:${salt}`).digest('hex');
};

const isWebuiAuthed = (ctx) => {
  const expectedPassword = process.env.WEBUI_PASSWORD;
  if (!expectedPassword) {
    return true;
  }

  const cookieValue = ctx.cookies.get(WEBUI_COOKIE_NAME);
  return cookieValue && cookieValue === buildWebuiCookieValue();
};

const authParamsMiddleware = async (ctx, next) => {
  const { refresh_token, client_id, email, mailbox } =
    ctx.method === 'GET' ? ctx.query : ctx.request.body;

  if (!refresh_token || !client_id || !email || !mailbox) {
    ctx.status = 400;
    ctx.body = {
      code: '400',
      error: 'Missing required parameters: refresh_token, client_id, email, or mailbox',
    };
    return;
  }

  await next();
};

const webUiAuthRequiredMiddleware = async (ctx, next) => {
  if (isWebuiAuthed(ctx)) {
    await next();
    return;
  }

  ctx.status = 401;
  ctx.body = {
    code: '401',
    error: 'Web UI authentication required',
  };
};

module.exports = {
  WEBUI_COOKIE_NAME,
  buildWebuiCookieValue,
  isWebuiAuthed,
  authParamsMiddleware,
  webUiAuthRequiredMiddleware,
};
