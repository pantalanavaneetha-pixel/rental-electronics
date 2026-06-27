// Claims & Settlements API Endpoints Routing
// File: routes/claims.js

import express from 'express';
import { processClaim, settleClaim, getSettlementBreakdown, patchSettlement, updateClaimPhoto } from '../controllers/claimsController.js';
import { claimSchema, settlementSchema, validateBody } from '../middlewares/validate.js';

const router = express.Router();

// POST /api/claims/:rentalId/process - Process return and settle security deposit
router.post('/claims/:rentalId/process', validateBody(claimSchema), processClaim);

// POST /api/returns - Process return and settle security deposit (spec alignment)
router.post('/returns', validateBody(claimSchema), processClaim);

// POST /api/settlements - Finalize settlement (legacy — kept for backward compat)
router.post('/settlements', validateBody(settlementSchema), settleClaim);

// GET /api/settlements/:rentalId - Cascading financial receipt breakdown
router.get('/settlements/:rentalId', getSettlementBreakdown);
router.get('/settlements/:id', getSettlementBreakdown);

// PATCH /api/settlements/:rentalId - Close settlement & timestamp approval
router.patch('/settlements/:rentalId', validateBody(settlementSchema), patchSettlement);
router.patch('/settlements/:id', validateBody(settlementSchema), patchSettlement);

// PATCH /api/claims/:rentalId/photo - Update claim damage photo evidence
router.patch('/claims/:rentalId/photo', updateClaimPhoto);
router.patch('/claims/:id/photo', updateClaimPhoto);

export default router;
