/**
 * Created by asafdavid on 10/03/2017.
 */
import { expect } from 'chai';
import Promise from 'bluebird';

import BaseService from '../../../src/service/baseService';
import { Middleware } from '../../../src/service/decorator';

const passThrough = msg => Promise.resolve(msg);
describe('middlewareDecorator', function () {
  describe('validation', function () {
    it('verifies that name is provided', function () {
      expect(() => Middleware()).to.throw(TypeError);
    });

    it('verifies that pre hook is provided', function () {
      expect(() => Middleware('name', {})).to.throw(TypeError);
      expect(() => Middleware('name', 'a')).to.throw(TypeError);
      expect(() => Middleware('name', [])).to.throw(TypeError);
    });

    it('verifies that post hook is provided', function () {
      expect(() => Middleware('name', passThrough, {})).to.throw(TypeError);
      expect(() => Middleware('name', passThrough, 'a')).to.throw(TypeError);
      expect(() => Middleware('name', passThrough, [])).to.throw(TypeError);
    });

    it('accepts valid input', function () {
      expect(() => Middleware('name')).to.be.a.function;
      expect(() => Middleware('name', passThrough)).to.be.a.function;
      expect(() => Middleware('name', passThrough, passThrough)).to.be.a.function;
    });
  });

  describe('decorator', function () {
    beforeEach(function () {
      this.pre = () => Promise.resolve('PRE');
      this.post = () => Promise.resolve('POST');
      this.decorator = Middleware('name', this.pre, this.post, { opt: 'a' });
      this.service = new BaseService('stam');
    });

    it('verifies that target is an instance of BaseService', function () {
      expect(() => this.decorator({}, 'key', {})).to.throw(SyntaxError);
    });

    it('verifies that it applies on a function', function () {
      expect(() => this.decorator(this.service, 'key', { value: 'string' })).to.throw(SyntaxError);
    });

    it('verifies that it applies on a task', function () {
      expect(() => this.decorator(this.service, 'key', { value: msg => msg }))
        .to.throw(SyntaxError);
    });

    it('verifies that it applies on a defined task', function () {
      this.service._tasks = { other: {} };
      expect(() => this.decorator(this.service, 'key', { value: msg => msg }))
        .to.throw(SyntaxError);
    });

    it('it adds a middleware to the right task', function () {
      this.service._tasks = {
        other: { middleware: { pre: [], post: [] }, options: {} },
        key: { middleware: { pre: [], post: [] }, options: {} },
      };
      this.decorator(this.service, 'key', { value: msg => msg });
      expect(this.service._tasks.key.middleware.pre).to.have.length.of(1);
      expect(this.service._tasks.key.middleware.post).to.have.length.of(1);
      expect(this.service._tasks.other.middleware.pre).to.have.length.of(0);
      expect(this.service._tasks.other.middleware.post).to.have.length.of(0);
    });

    it('it adds middleware options to the right place', function () {
      this.service._tasks = {
        other: { middleware: { pre: [], post: [] }, options: {} },
        key: { middleware: { pre: [], post: [] }, options: {} },
      };
      this.decorator(this.service, 'key', { value: msg => msg });
      expect(this.service._tasks.key.options).to.have.all.keys(['name']);
      expect(this.service._tasks.key.options.name).to.have.all.keys(['opt']);
    });
  });
});
