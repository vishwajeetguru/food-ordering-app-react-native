import { z } from 'zod';

const labelEnum = z.enum(['Home','Work','Other']);
const pincodeRegex = /^[0-9]{4,10}$/;

export const createAddressSchema = z.object({
  label: labelEnum,
  customLabel: z.string().min(1).max(30).optional(),
  address: z.string().min(5).max(500),
  fullAddress: z.string().min(5).max(500).optional(),
  houseFlat: z.string().max(120).optional(),
  floor: z.string().max(50).optional(),
  landmark: z.string().max(150).optional(),
  area: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(pincodeRegex, 'Invalid pincode').optional(),
  details: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
  receiverName: z.string().max(100).optional(),
  receiverPhone: z.string().max(20).optional(),
}).superRefine((data, ctx) => {
  if (data.label === 'Other' && data.customLabel && data.customLabel.trim().length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'customLabel cannot be empty', path: ['customLabel'] });
  }
});

export const updateAddressSchema = z.object({
  label: labelEnum.optional(),
  customLabel: z.string().min(1).max(30).optional(),
  address: z.string().min(5).max(500).optional(),
  fullAddress: z.string().min(5).max(500).optional(),
  houseFlat: z.string().max(120).optional(),
  floor: z.string().max(50).optional(),
  landmark: z.string().max(150).optional(),
  area: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(pincodeRegex, 'Invalid pincode').optional(),
  details: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
  receiverName: z.string().max(100).optional(),
  receiverPhone: z.string().max(20).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

export const addressIdParamSchema = z.object({
  id: z.string().min(1).max(128),
});

export const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const geocodeSearchSchema = z.object({
  q: z.string().min(2).max(200),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});
