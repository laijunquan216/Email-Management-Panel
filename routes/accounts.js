const Router = require('koa-router');
const controller = require('../controllers/accounts');

const router = new Router({
  prefix: '',
});

router.get('/accounts', controller.list);
router.post('/accounts/sync', controller.sync);

module.exports = router;
