var debug = require('debug')('loopback-ds-mixin-skeleton');

function skeleton(Model, options) {
  'use strict';
  debug('Skeleton mixin for Model %s with options %o', Model.modelName, options);
}

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Skeleton', skeleton);
};
