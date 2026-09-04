import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAddressSchema, updateAddressSchema, addressIdParamSchema, reverseGeocodeSchema, geocodeSearchSchema } from '../validators/address.validator';
import { noCache } from '../middleware/cache.middleware';

const router = Router();
router.use(authenticate, noCache);
// Geocode helpers (must be before /:id to avoid param clash)
router.post('/reverse-geocode', validate(reverseGeocodeSchema), addressController.reverseGeocode);
router.get('/geocode/search', validate(geocodeSearchSchema, 'query'), addressController.geocodeSearch);

// Default
router.get('/default', addressController.getDefault);

// CRUD
router.get('/', addressController.list);
router.post('/', validate(createAddressSchema), addressController.create);
router.patch('/:id/default', validate(addressIdParamSchema, 'params'), addressController.setDefault);
router.patch('/:id', validate(addressIdParamSchema, 'params'), validate(updateAddressSchema), addressController.update);
router.delete('/:id', validate(addressIdParamSchema, 'params'), addressController.delete);
export default router;
