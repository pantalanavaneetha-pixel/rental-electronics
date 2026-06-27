// Joi Request Validation Middleware
// File: middlewares/validate.js

import Joi from 'joi';

// Rental Intake Input Schema
export const rentalSchema = Joi.object({
  // User Details
  userName: Joi.string().trim().min(2).max(100)
    .pattern(/^[a-zA-Z\s\-\.]+$/)
    .required()
    .messages({ 
      'string.min': 'User name must be at least 2 characters.',
      'string.pattern.base': 'User name must only contain letters, spaces, hyphens, and periods.'
    }),
  userEmail: Joi.string().trim().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required()
    .messages({ 'string.pattern.base': 'Provide a valid customer email (e.g. user@domain.com).' }),
  userPhone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}(?:\s*\/\s*\+?[1-9]\d{1,14})?$/).required()
    .messages({ 'string.pattern.base': 'Phone number must follow international E.164 format (e.g. +919876543210 or +919876543210 / +918765432109).' }),
  isCorporate: Joi.boolean().default(false),
  kycStatus: Joi.string().valid('Verified', 'Pending', 'Rejected').default('Verified'),

  address: Joi.string().trim().min(5).max(300).required()
    .messages({ 'string.empty': 'Residential/Billing address is required.' }),

  // Device Details
  deviceSerial: Joi.string().trim().min(5).max(30).required()
    .messages({ 'string.min': 'Device serial number must be at least 5 characters.' }),
  deviceCategory: Joi.string().trim().pattern(/^[a-zA-Z0-9\s\-\.]+$/).required()
    .messages({ 'string.pattern.base': 'Device category must only contain letters, numbers, spaces, hyphens, and periods.' }),
  deviceBaseCost: Joi.number().precision(2).min(0).required()
    .messages({ 'number.min': 'Device base cost cannot be negative.' }),

  // Rental Details
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'End date must be chronologically after the start date.' }),
  securityDeposit: Joi.number().precision(2).min(0).required()
    .messages({ 'number.min': 'Security deposit cannot be negative.' }),
  baseTariff: Joi.number().precision(2).min(0).required()
    .messages({ 'number.min': 'Base tariff cannot be negative.' }),
  initialConditionNotes: Joi.string().trim().allow('').max(500).optional()
});

// Claim Intake Input Schema
export const claimSchema = Joi.object({
  rentalId: Joi.string().trim().max(50).optional(),
  daysOverdue: Joi.number().integer().min(0).default(0)
    .messages({ 
      'number.min': 'Days overdue cannot be negative.',
      'number.integer': 'Days overdue must be an integer.'
    }),
  days_overdue: Joi.number().integer().min(0).optional(),
  damages: Joi.array().items(
    Joi.object({
      type: Joi.string().trim().max(100).required(),
      multiplier: Joi.number().min(0).required()
        .messages({ 'number.min': 'Severity multiplier cannot be negative.' }),
      cost: Joi.number().min(0).optional(),
      fixedRepairCost: Joi.number().min(0).optional(),
      severityMultiplier: Joi.number().min(0).optional()
    })
  ).optional(),
  triageFlag: Joi.boolean().optional(),
  flaggedForUrgentTriage: Joi.boolean().optional(),
  photoEvidenceUrl: Joi.string().trim().allow('').optional(),
  photoEvidenceUrls: Joi.string().trim().allow('').optional(),
  customerEmail: Joi.string().trim().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  customer_email: Joi.string().trim().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  securityDepositHeld: Joi.number().min(0).optional(),
  security_deposit_held: Joi.number().min(0).optional(),
  description: Joi.string().trim().allow('').optional(),
  notes: Joi.string().trim().allow('').optional()
}).custom((value, helpers) => {
  // Check if there is physical damage (excluding late return penalty and perfect/none status)
  const hasPhysicalDamage = value.damages && value.damages.some(d => {
    const typeLower = (d.type || '').toLowerCase();
    return !typeLower.includes('late return penalty') && !typeLower.includes('none');
  });

  if (hasPhysicalDamage) {
    const photoUrl = value.photoEvidenceUrl || value.photoEvidenceUrls || '';
    const desc = value.description || value.notes || '';
    
    // A damage report requires at least one photo evidence link or a brief description
    if (!photoUrl.trim() && !desc.trim()) {
      return helpers.message('A damage report requires at least one photo evidence link or a brief description.');
    }
  }
  return value;
}, 'Damage Validation');

// Settlement Input Schema
export const settlementSchema = Joi.object({
  rentalId: Joi.string().trim().max(50).optional(),
  notes: Joi.string().trim().allow('').max(3000).optional(),
  paymentMethod: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid('CLOSED', 'SETTLED', 'Closed', 'Settled').optional(),
  trackingStatus: Joi.string().valid('CLOSED', 'SETTLED', 'Closed', 'Settled').optional(),
  deductionAmount: Joi.number().min(0).optional(),
  adjustedFinalDeduction: Joi.number().min(0).optional()
});

// Rental Update Input Schema
export const updateRentalSchema = Joi.object({
  userName: Joi.string().trim().min(2).max(100)
    .pattern(/^[a-zA-Z\s\-\.]+$/)
    .required()
    .messages({ 
      'string.min': 'User name must be at least 2 characters.',
      'string.pattern.base': 'User name must only contain letters, spaces, hyphens, and periods.'
    }),
  userEmail: Joi.string().trim().pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required()
    .messages({ 'string.pattern.base': 'Provide a valid customer email (e.g. user@domain.com).' }),
  userPhone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}(?:\s*\/\s*\+?[1-9]\d{1,14})?$/).required()
    .messages({ 'string.pattern.base': 'Phone number must follow international E.164 format (e.g. +919876543210 or +919876543210 / +918765432109).' }),
  deviceModel: Joi.string().trim().pattern(/^[a-zA-Z0-9\s\-\.]+$/).required()
    .messages({ 'string.pattern.base': 'Device model must only contain letters, numbers, spaces, hyphens, and periods.' }),
  securityDepositHeld: Joi.number().precision(2).min(0).required()
    .messages({ 'number.min': 'Security deposit cannot be negative.' }),
  endDate: Joi.date().iso().allow(null).optional(),
  address: Joi.string().trim().min(5).max(300).optional()
    .messages({ 'string.min': 'Address must be at least 5 characters.' }),
  kycStatus: Joi.string().valid('Verified', 'Pending', 'Rejected').optional()
    .messages({ 'any.only': 'KYC Status must be either Verified, Pending, or Rejected.' }),
  isCorporate: Joi.boolean().optional()
});


// Dynamic validation middleware runner
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      console.error('Validation Error Details:', errorDetails);

      return res.status(400).json({
        success: false,
        error: 'Validation failed on incoming request parameters.',
        details: errorDetails
      });
    }

    // Replace req.body with sanitized and cast Joi values
    req.body = value;
    next();
  };
};
