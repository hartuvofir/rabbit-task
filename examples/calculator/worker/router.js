/**
 * Created by meirshalev on 02/02/2017.
 */
var HandlerRouter = require('../../../lib/handlers/router');
var CalculatorHandler = require('./calculatorHandler');

var router = new HandlerRouter([
  CalculatorHandler
]);

module.exports = router;