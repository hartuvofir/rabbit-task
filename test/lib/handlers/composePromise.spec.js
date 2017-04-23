/**
 * Created by asafdavid on 09/03/2017.
 */
import Promise from 'bluebird';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import composePromise from '../../../src/lib/handlers/composePromise';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('ComposePromise', function () {
  it('handles empty functions list', function (done) {
    const middleware = composePromise();
    expect(middleware('hello')).to.eventually.be.equal('hello').notify(done);
  });

  it('handles one function', function (done) {
    const middleware = composePromise(() => Promise.resolve('A'));
    expect(middleware('hello')).to.eventually.be.equal('A').notify(done);
  });

  it('handles two function', function (done) {
    const middleware = composePromise(
      msg => Promise.resolve(msg + msg),
      () => Promise.resolve('A')
    );
    expect(middleware('hello')).to.eventually.be.equal('AA').notify(done);
  });

  it('handles three function', function (done) {
    const middleware = composePromise(
      msg => Promise.resolve(msg + msg),
      msg => Promise.resolve(msg * 10),
      msg => Promise.resolve(Number.parseInt(msg, 10)),
    );
    expect(middleware('7')).to.eventually.be.equal(140).notify(done);
  });

  it('it wraps a handler with pre and post middleware correctly', function (done) {
    const pre = [
      msg => Promise.resolve(3 * msg),
      msg => Promise.resolve(1 + msg),
    ];
    const post = [
      msg => Promise.resolve(3 / msg),
      msg => Promise.resolve(msg - 1),
    ];
    const handle = msg => Promise.resolve(msg);

    const middleware = composePromise(...(post.reverse()), handle, ...pre);
    expect(middleware(0)).to.eventually.be.equal(0).notify(done);
  });

  it('rejects promise if one have failed', function (done) {
    const middleware = composePromise(
      msg => Promise.resolve(msg + msg),
      msg => Promise.reject(msg * 10),
      msg => Promise.resolve(Number.parseInt(msg, 10)),
    );
    expect(middleware('7')).to.eventually.rejected.notify(done);
  });

  it('it wraps a handler with pre and post middleware correctly and rejects', function (done) {
    const pre = [
      () => Promise.reject(),
      msg => Promise.resolve(1 + msg),
    ];
    const post = [
      msg => Promise.resolve(3 / msg),
      msg => Promise.resolve(msg - 1),
    ];
    const handle = msg => Promise.resolve(msg);

    const middleware = composePromise(...(post.reverse()), handle, ...pre);
    expect(middleware(0)).to.eventually.be.equal(0).notify(done);
  });
});
