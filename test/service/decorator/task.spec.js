/**
 * Created by asafdavid on 26/02/2017.
 */
import chai from 'chai';
import Promise from 'bluebird';
import chaiAsPromised from 'chai-as-promised';

import BaseService from '../../../src/service/baseService';
import { Task } from '../../../src/service/decorator';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('taskDecorator', function () {
  describe('validation', function () {
    it('verifies that topic is provided and a string', function () {
      expect(() => Task({})).to.throw(TypeError);
      expect(() => Task({ topic: [1, 2] })).to.throw(TypeError);
      expect(() => Task({ topic: 1 })).to.throw(TypeError);
      expect(() => Task({ topic: 'topic' })).to.be.a.function;
    });

    it('verifies that sync is a boolean', function () {
      expect(() => Task({ topic: 'topic', sync: 'a' })).to.throw(TypeError);
      expect(() => Task({ topic: 'topic', sync: 1 })).to.throw(TypeError);
      expect(() => Task({ topic: 'topic', sync: true })).to.be.a.function;
    });

    it('verifies that description is a string', function () {
      expect(() => Task({ topic: 'topic', description: 1 })).to.throw(TypeError);
      expect(() => Task({ topic: 'topic', description: true })).to.throw(TypeError);
      expect(() => Task({ topic: 'topic', description: 'a' })).to.be.a.function;
    });
  });

  describe('decorator', function () {
    beforeEach(function () {
      this.decorator = Task({ topic: 'DEC1', sync: true });
      this.service = new BaseService('stam');
    });

    it('verifies that target is an instance of BaseService', function () {
      expect(() => this.decorator({}, 'key', {})).to.throw(SyntaxError);
    });

    it('verifies that it applies on a function', function () {
      expect(() => this.decorator(this.service, 'key', { value: 'string' })).to.throw(SyntaxError);
    });

    it('Adds a task to _tasks', function () {
      this.decorator(this.service, 'func', {
        value: () => Promise.resolve(),
      });
      expect(this.service._tasks).to.be.an.object;
      expect(this.service._tasks).to.to.have.all.keys('func');
    });

    it('Adds two tasks to _tasks', function () {
      this.decorator(this.service, 'f1', {
        value: () => Promise.resolve(),
      });
      this.decorator(this.service, 'f2', {
        value: () => Promise.resolve(),
      });
      expect(this.service._tasks).to.be.an.object;
      expect(this.service._tasks).to.to.have.all.keys('f1', 'f2');
    });

    it('Attach the right handler', function (done) {
      this.decorator(this.service, 'f', {
        value: () => Promise.resolve('F'),
      });
      this.decorator(this.service, 'g', {
        value: () => Promise.resolve('G'),
      });
      expect(this.service._tasks.f.handler()).to.eventually.be.equal('F').notify(done);
    });
  });
});
