/* jshint mocha: true */

var debug = require('debug')('loopback-ds-computed-mixin');
var utils = require('loopback-datasource-juggler/lib/utils');

var loopback = require('loopback');
var lt = require('loopback-testing');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));
require('mocha-sinon');

// Create a new loopback app.
var app = loopback();

// Set up promise support for loopback in non-ES6 runtime environment.
global.Promise = require('bluebird');

// import our Changed mixin.
require('./')(app);

// Connect to db
var dbConnector = loopback.memory();

// Main test
describe('loopback datasource property', function() {

  var Item;
  var now = new Date();

  lt.beforeEach.withApp(app);

  beforeEach(function(done) {

    Item = this.Item = loopback.PersistedModel.extend('item', {
      name: String,
      status: String,
      readonly: Boolean,
      promised: String,
      requestedAt: Date
    }, {
      mixins: {
        Computed: {
          "properties": {
            "readonly": "computedReadonly",
            "requestedAt": "computedRequestedAt",
            "promised": "computedPromised"
          }
        }
      }
    });

    Item.computedReadonly = function computedReadonly(item) {
      return item.status === 'archived';
    };

    Item.computedRequestedAt = function computedRequestedAt(item) {
      return now;
    };

    Item.computedPromised = function computedPromised(item, cb) {
      cb = cb || utils.createPromiseCallback();
      process.nextTick(function() {
        cb(null, 'As promised I get back to you!');
      });
      return cb.promise;
    };

    // Attach model to db
    Item.attachTo(dbConnector);
    app.model(Item);
    app.use(loopback.rest());
    app.set('legacyExplorer', false);
    new lt.TestDataBuilder()
      .define('item1', Item, {
        name: 'Item 1',
        status: 'new'
      })
      .define('item2', Item, {
        name: 'Item 23',
        status: 'archived'
      })
      .buildTo(this, done);
  });


  it('The first item is not readonly', function(done) {
    Item.findById(this.item1.id).then(function(item) {
      expect(item.requestedAt.toString()).to.equal(now.toString());
      expect(item.readonly).to.equal(false);
      expect(item.promised).to.equal('As promised I get back to you!');
      done();
    }).catch(done);
  });

  it('The second item is readonly', function(done) {
    Item.findById(this.item2.id).then(function(item) {
      expect(item.requestedAt.toString()).to.equal(now.toString());
      expect(item.readonly).to.equal(true);
      expect(item.promised).to.equal('As promised I get back to you!');
      done();
    }).catch(done);
  });

});
