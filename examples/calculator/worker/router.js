/**
 * Created by meirshalev on 02/02/2017.
 */
const HandlerRouter = require('../../../dist').HandlerRouter;
const CalculatorHandler = require('./calculatorHandler');

const router = new HandlerRouter([
  CalculatorHandler,
]);

module.exports = router;
