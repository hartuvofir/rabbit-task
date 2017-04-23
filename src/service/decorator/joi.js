/**
 * Created by asafdavid on 12/03/2017.
 */
import Middleware, { NOOP } from './middleware';
import * as JoiHooks from '../../lib/middleware/joiMiddleware';

export default function JoiMiddleware(schema) {
  if (!schema) throw new TypeError('schema is required');
  return Middleware('joi', JoiHooks.pre, NOOP, { schema });
}
