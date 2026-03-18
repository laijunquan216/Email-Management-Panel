const Router = require('koa-router');
const controller = require('../controllers/auth');

const router = new Router({
  prefix: '/auth',
});

router.post('/login', controller.login);
router.get('/status', controller.status);
router.post('/logout', controller.logout);

module.exports = router;
