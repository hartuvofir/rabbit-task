/**
 * Created by matan on 1/9/16.
 */
import { expect } from 'chai';
import Message from '../../../src/lib/handlers/message';
import HandlerResponse from '../../../src/lib/handlers/handlerResponse';

describe('HandlerResponse', function () {
  before(function () {
    this.originalMessage = new Message({
      content: new Buffer(JSON.stringify({ msg: 'msg' })),
      properties: {
        messageId: 'weqdsazrdsaxz',
        replyTo: 'SOME.NAMED.QUEUE',
        headers: {
          topic: 'some_topic',
        },
      },
    });
  });

  describe('Constructor', function () {
    it('No original message, custom headers', function () {
      const handler = new HandlerResponse(
        'message_body',
        undefined,
        { topic: 'some_topic', x: 'y' },
        { prop: 'erty' },
      );

      expect(handler).to.have.property('body').to.equal('message_body');
      expect(handler).to.have.property('headers').to.deep.equal({ topic: 'some_topic', x: 'y' });
      expect(handler).to.have.property('properties').to.deep.equal({ prop: 'erty' });
      expect(handler).to.not.have.property('replyTo');
    });

    it('With original message - no overlap', function () {
      const handler = new HandlerResponse(
        'some_message',
        this.originalMessage,
        { w: 'x', y: 'z' },
        { a: 'b', c: 'd' },
      );

      expect(handler).to.have.property('body').to.equal('some_message');
      expect(handler).to.have.property('headers').to.deep.equal({
        w: 'x',
        y: 'z',
        topic: 'some_topic',
      });
      expect(handler).to.have.property('properties').to.deep.equal({
        a: 'b',
        c: 'd',
        correlationId: 'weqdsazrdsaxz',
      });
      expect(handler).to.have.property('replyTo').to.deep.equal('SOME.NAMED.QUEUE');
    });

    it('With original message - with overlap', function () {
      const handler = new HandlerResponse(
        'a_message',
        this.originalMessage,
        { a: 'b', topic: 'A.TOPIC' },
        { w: 'x', correlationId: 'randomId' }
      );

      expect(handler).to.have.property('body').to.equal('a_message');
      expect(handler).to.have.property('headers').to.deep.equal({ a: 'b', topic: 'A.TOPIC' });
      expect(handler).to.have.property('properties').to.deep.equal({
        w: 'x',
        correlationId: 'randomId',
      });
      expect(handler).to.have.property('replyTo').to.equal('SOME.NAMED.QUEUE');
    });

    it('With replayTo, no original message', function () {
      const handler = new HandlerResponse(
        '__message__',
        undefined,
        { w: 'x', y: 'z' },
        { a: 'b', c: 'd', replyTo: 'a_topic' },
      );

      expect(handler).to.have.property('body').to.equal('__message__');
      expect(handler).to.have.property('headers').to.deep.equal({ w: 'x', y: 'z' });
      expect(handler).to.have.property('properties').to.deep.equal(
        { a: 'b', c: 'd' }
      );
      expect(handler).to.have.property('replyTo').to.equal('a_topic');
    });

    it('With originalMessage & replyTo', function () {
      const handler = new HandlerResponse(
        'MESSAGE',
        this.originalMessage,
        { hello: 'world' },
        { foo: 'bar', replyTo: 'RANDOM.QUEUE' }
      );

      expect(handler).to.have.property('body').to.equal('MESSAGE');
      expect(handler).to.have.property('headers').to.deep.equal({
        hello: 'world',
        topic: 'some_topic',
      });
      expect(handler).to.have.property('properties').to.deep.equal({
        foo: 'bar',
        correlationId: 'weqdsazrdsaxz',
      });
      expect(handler).to.have.property('replyTo').to.deep.equal('RANDOM.QUEUE');
    });
  });
});
