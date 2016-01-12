/**
 * Created by rom on 01/12/16.
 */
var expect = require('chai').expect;

var MultiHandler = require('../../../lib/handlers/multiHandler');

describe("MultiHandler", function () {
  before(function () {
    this.pattern = "BKMD[\.]TEST[\.].*";
  });

  describe('Check Match', function () {
    it('Dict topics', function () {
      var topics = {
        "BKMD.TEST.CREATE": {
          "A": "B",
          "C": "D"
        },
        "BKMD.TEST.UPDATE": {
          "A": "B",
          "C": "D"
        }
      };
      var handler = new MultiHandler("name", this.pattern, topics);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('Array topics', function () {
      var topics = [
        "BKMD.TEST.CREATE",
        "BKMD.TEST.UPDATE"
      ];
      var handler = new MultiHandler("name", this.pattern, topics);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('No topics', function () {
      var handler = new MultiHandler("name", this.pattern);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.true;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('No pattern, only topics', function () {
      var topics = [
        "BKMD.TEST.CREATE",
        "BKMD.TEST.UPDATE"
      ];
      var handler = new MultiHandler("name", "[\.]", topics);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('Everything', function () {
      var handler = new MultiHandler("name", "[\.]");

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.true;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.true;
    });
  });
});