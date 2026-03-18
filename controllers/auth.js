const {
  WEBUI_COOKIE_NAME,
  buildWebuiCookieValue,
  isWebuiAuthed,
} = require('../middlewares/auth.middleware');

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  overwrite: true,
  maxAge: 24 * 60 * 60 * 1000,
};

const controller = {
  async login(ctx) {
    const expectedPassword = process.env.WEBUI_PASSWORD;
    const { password } = ctx.request.body || {};

    if (!expectedPassword) {
      ctx.body = { code: '200', message: 'WEBUI password disabled' };
      return;
    }

    if (!password || password !== expectedPassword) {
      ctx.status = 401;
      ctx.body = { code: '401', error: '密码错误' };
      return;
    }

    ctx.cookies.set(WEBUI_COOKIE_NAME, buildWebuiCookieValue(), cookieOptions);
    ctx.body = { code: '200', message: '登录成功' };
  },

  async status(ctx) {
    ctx.body = {
      code: '200',
      data: {
        required: Boolean(process.env.WEBUI_PASSWORD),
        authenticated: isWebuiAuthed(ctx),
      },
    };
  },

  async logout(ctx) {
    ctx.cookies.set(WEBUI_COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
    ctx.body = { code: '200', message: '已退出登录' };
  },
};

module.exports = controller;
