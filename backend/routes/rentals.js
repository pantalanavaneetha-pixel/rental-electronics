// Rentals API Endpoints Routing
// File: routes/rentals.js

import express from 'express';
import { createRental, listRentals, resetDatabase, listRentalsRaw, checkUserKyc, updateRental, toggleTriage, getRentalDetail } from '../controllers/rentalsController.js';
import { rentalSchema, updateRentalSchema, validateBody } from '../middlewares/validate.js';

const router = express.Router();

// 1. POST /api/rentals - Create a rental contract (Validated)
router.post('/rentals', validateBody(rentalSchema), createRental);

// 2. GET /api/rentals - List rentals with query filters
router.get('/rentals', listRentals);

// 3. POST /api/reset - Reset and seed database
router.post('/reset', resetDatabase);

// 4. GET /api/records - Get flat list of rentals for UI components
router.get('/records', listRentalsRaw);

// 4.5. GET /api/rentals/:id - Fetch detailed rental record with joins and history
router.get('/rentals/:id', getRentalDetail);

// 5. GET /api/users/check-kyc - Check customer KYC verification status
router.get('/users/check-kyc', checkUserKyc);

// 6. PUT /api/rentals/:id - Update rental details (Validated)
router.put('/rentals/:id', validateBody(updateRentalSchema), updateRental);

// 7. PATCH /api/rentals/:id/triage - Toggle emergency triage / resolve triage
router.patch('/rentals/:id/triage', toggleTriage);

export default router;


