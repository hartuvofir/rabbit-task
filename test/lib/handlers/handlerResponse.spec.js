/**
 * Created by matan on 1/9/16.
 */
var expect = require('chai').expect;

var HandlerResponse = require('../../../lib/handlers/handlerResponse');

describe("HandlerResponse", function () {
  before(function () {
    this.originalMessage = {
      properties: {
        messageId: 'weqdsazrdsaxz',
        replyTo: 'SOME.NAMED.QUEUE',
        headers: {
          topic: 'some_topic'
        }
      }
    };
  });

  describe('Constructor', function () {
    it('No optional fields', function () {
      var handler = new HandlerResponse('message_body', {topic: 'some_topic', x: 'y'}, {prop: 'erty'});

      expect(handler).to.have.property('messageBody').to.equal('message_body');
      expect(handler).to.have.property('headers').to.deep.equal({topic: 'some_topic', x: 'y'});
      expect(handler).to.have.property('properties').to.deep.equal({prop: 'erty'});
      expect(handler).to.not.have.property('replyTo');
    });

    it('With original message - no overlap', function () {
      var handler = new HandlerResponse('some_message', {w: 'x', y: 'z'}, {a: 'b', c: 'd'}, this.originalMessage);

      expect(handler).to.have.property('messageBody').to.equal('some_message');
      expect(handler).to.have.property('headers').to.deep.equal({w: 'x', y: 'z', topic: 'some_topic'});
      expect(handler).to.have.property('properties').to.deep.equal({a: 'b', c: 'd', correlationId: 'weqdsazrdsaxz'});
      expect(handler).to.have.property('replyTo').to.deep.equal('SOME.NAMED.QUEUE');
    });

    it('With original message - with overlap', function () {
      var handler = new HandlerResponse('a_message', {a: 'b', topic: 'A.TOPIC'}, {w: 'x', correlationId: 'randomId'},
        this.originalMessage);

      expect(handler).to.have.property('messageBody').to.equal('a_message');
      expect(handler).to.have.property('headers').to.deep.equal({a: 'b', topic: 'A.TOPIC'});
      expect(handler).to.have.property('properties').to.deep.equal({w: 'x', correlationId: 'randomId'});
      expect(handler).to.have.property('replyTo').to.equal('SOME.NAMED.QUEUE');
    });

    it('With replayTo, no original message', function () {
      var handler = new HandlerResponse('__message__', {w: 'x', y:'z'}, {a: 'b', c: 'd'}, null, 'a_topic');

      expect(handler).to.have.property('messageBody').to.equal('__message__');
      expect(handler).to.have.property('headers').to.deep.equal({w: 'x', y: 'z'});
      expect(handler).to.have.property('properties').to.deep.equal({a: 'b', c: 'd'});
      expect(handler).to.have.property('replyTo').to.equal('a_topic');
    });

    it('With originalMessage & replyTo', function () {
      var handler = new HandlerResponse('MESSAGE', {hello: 'world'}, {foo: 'bar'},
        this.originalMessage, "RANDOM.QUEUE");

      expect(handler).to.have.property('messageBody').to.equal('MESSAGE');
      expect(handler).to.have.property('headers').to.deep.equal({hello: 'world', topic: 'some_topic'});
      expect(handler).to.have.property('properties').to.deep.equal({foo: 'bar', correlationId: 'weqdsazrdsaxz'});
      expect(handler).to.have.property('replyTo').to.deep.equal('RANDOM.QUEUE');
    })
  });
});