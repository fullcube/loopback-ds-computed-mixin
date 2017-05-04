'use strict'

const deprecate = require('depd')('loopback-ds-computed-mixin')
const computed = require('./computed')

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define = deprecate.function(app.loopback.modelBuilder.mixins.define,
    'app.modelBuilder.mixins.define: Use mixinSources instead')
  app.loopback.modelBuilder.mixins.define('Computed', computed)
}
