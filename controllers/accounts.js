const service = require('../services/accounts');
const logger = require('../utils/logger');

const controller = {
  async list(ctx) {
    try {
      const data = await service.listAccounts();
      ctx.body = { code: '200', data, storage: service.getStorageMode() };
    } catch (err) {
      logger.error('Failed to list accounts', err);
      ctx.throw(500, 'Failed to list accounts');
    }
  },

  async sync(ctx) {
    try {
      const list = Array.isArray(ctx.request.body?.list) ? ctx.request.body.list : [];
      const count = await service.replaceAccounts(list);
      ctx.body = { code: '200', message: '同步成功', data: { count }, storage: service.getStorageMode() };
    } catch (err) {
      logger.error('Failed to sync accounts', err);
      ctx.throw(500, 'Failed to sync accounts');
    }
  },
};

module.exports = controller;
