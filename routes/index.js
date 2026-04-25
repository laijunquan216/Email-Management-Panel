const Router = require('koa-router');
const apiRoutes = require('./api');
const authRoutes = require('./auth');
const accountRoutes = require('./accounts');
const { webUiAuthRequiredMiddleware } = require('../middlewares/auth.middleware');

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = {
    message: `Welcome to ${process.env.API_NAME || 'MS_OAuth2API_Next'}`,
  };
});

router.use(authRoutes.routes(), authRoutes.allowedMethods());

router.use('/api', webUiAuthRequiredMiddleware, apiRoutes.routes(), apiRoutes.allowedMethods());
router.use('/api', webUiAuthRequiredMiddleware, accountRoutes.routes(), accountRoutes.allowedMethods());

module.exports = router;
