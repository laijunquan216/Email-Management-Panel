const Router = require('koa-router')
const controller = require('../controllers/api')
const { authParamsMiddleware } = require('../middlewares/auth.middleware')

const router = new Router({
  prefix: '' 
})

router.all('/mail_all', authParamsMiddleware, controller.mail_all);
router.all('/mail_new', authParamsMiddleware, controller.mail_new);
router.all('/process-mailbox', authParamsMiddleware, controller.process_mailbox);
router.all('/test-proxy', controller.test_proxy);

module.exports = router
