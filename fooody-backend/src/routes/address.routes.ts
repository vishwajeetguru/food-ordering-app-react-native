import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAddressSchema, updateAddressSchema, addressIdParamSchema } from '../validators/address.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);
router.get('/', addressController.list);
router.post('/', validate(createAddressSchema), addressController.create);
router.patch('/:id', validate(addressIdParamSchema, 'params'), validate(updateAddressSchema), addressController.update);
router.delete('/:id', validate(addressIdParamSchema, 'params'), addressController.delete);
export default router;
