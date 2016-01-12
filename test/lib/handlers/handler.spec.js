/**
 * Created by rom on 01/12/16.
 */
var expect = require('chai').expect;

var Handler = require('../../../lib/handlers/handler');

describe("Handler", function () {

  describe('Check Match', function () {
    it('String pattern', function () {
      var pattern = "BKMD.TEST.CREATE";
      var handler = new Handler("name", pattern);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('RegEx pattern', function () {
      var pattern = /BKMD[\.]TEST[\.].*/;
      var handler = new Handler("name", pattern);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.true;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.false;
    });

    it('Dict pattern', function () {
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
      var handler = new Handler("name", topics);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
    });

    it('Array pattern', function () {
      var topics = [
        "BKMD.TEST.CREATE",
        "BKMD.TEST.UPDATE"
      ];
      var handler = new Handler("name", topics);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.false;
    });

    it('Everything', function () {
      var handler = new Handler("name", /[\.]/);

      expect(handler.match("BKMD.TEST.CREATE")).to.be.true;
      expect(handler.match("BKMD.TEST.NEW")).to.be.true;
      expect(handler.match("BKMD.NO_PATTERN.NEW")).to.be.true;
    });
  });
});