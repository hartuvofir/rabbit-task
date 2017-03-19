/**
 * Created by asafdavid on 13/03/2017.
 */
import Joi from 'joi';

const AddressSchema = Joi.object().keys({
  address: Joi.string().required(),
});

export default AddressSchema;
