const loopback = require('loopback')
const lt = require('loopback-testing')
const chai = require('chai')
const expect = chai.expect

global.Promise = require('bluebird')

// Create a new loopback app.
const app = loopback()

// import our mixin.
require('../lib')(app)

// Connect to db.
const dbConnector = loopback.memory()

const now = new Date()

const Item = loopback.PersistedModel.extend('item', {
  name: String,
  status: String,
  readonly: Boolean,
  promised: String,
  requestedAt: Date,
}, {
  mixins: {
    Computed: {
      properties: {
        readonly: 'computedReadonly',
        requestedAt: 'computedRequestedAt',
        promised: 'computedPromised',
      },
    },
  },
})

// Define computed property callbacks.
Item.computedReadonly = item => Boolean(item.status === 'archived')
Item.computedRequestedAt = () => now
Item.computedPromised = item => Promise.resolve(`${item.name}: As promised I get back to you!`)

// Attach model to db.
Item.attachTo(dbConnector)
app.model(Item)
app.use(loopback.rest())
app.set('legacyExplorer', false)

describe('loopback computed property', function() {

  lt.beforeEach.withApp(app)

  before(function(done) {
    new lt.TestDataBuilder()
      .define('item1', Item, {
        name: 'Item 1',
        status: 'archived',
      })
      .define('item2', Item, {
        name: 'Item 2',
        status: 'new',
      })
      .buildTo(this, done)
  })

  before(function() {
    return Promise.join(Item.findById(this.item1.id), Item.findById(this.item2.id), (item1, item2) => {
      this.item1 = item1
      this.item2 = item2
    })
  })

  it('should set the model property to the value returned by the defined callback', function() {
    expect(this.item1.requestedAt.toString()).to.equal(now.toString())
    expect(this.item1.readonly).to.equal(true)
    expect(this.item2.requestedAt.toString()).to.equal(now.toString())
    expect(this.item2.readonly).to.equal(false)
  })

  it('should set the model property to the value resolved by the defined callback\'s promise', function() {
    expect(this.item1.promised).to.equal('Item 1: As promised I get back to you!')
    expect(this.item2.promised).to.equal('Item 2: As promised I get back to you!')
  })
})
