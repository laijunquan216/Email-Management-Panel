const Router = require('koa-router');
const apiRoutes = require('./api');
const authRoutes = require('./auth');
const {
  authParamsMiddleware,
  webUiAuthRequiredMiddleware,
} = require('../middlewares/auth.middleware');

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = {
    message: `Welcome to ${process.env.API_NAME || 'MS_OAuth2API_Next'}`,
  };
});

router.use(authRoutes.routes(), authRoutes.allowedMethods());

router.use(
  '/api',
  webUiAuthRequiredMiddleware,
  authParamsMiddleware,
  apiRoutes.routes(),
  apiRoutes.allowedMethods()
);

module.exports = router;
