// Dashboard Controller
// File: controllers/dashboardController.js

import { query } from '../config/db.js';

/**
 * Retrieves aggregate metrics for dashboard analytics
 */
export const getMetrics = async (req, res, next) => {
  try {
    // 1. Compute Total Active Rentals
    const activeRes = await query("SELECT COUNT(*) AS count FROM rentals WHERE status = 'Active'");
    const totalActiveRentals = parseInt(activeRes.rows[0].count, 10);

    // 2. Compute Total Security Deposits Held (for active rentals)
    const depositRes = await query("SELECT SUM(security_deposit) AS total FROM rentals WHERE status = 'Active'");
    const totalDepositsHeld = parseFloat(depositRes.rows[0].total || 0.00);

    // 3. Compute Total Pending Claims (including emergency Priority_Repair triage)
    const pendingClaimsRes = await query("SELECT COUNT(*) AS count FROM rentals WHERE status IN ('Pending_Claim', 'Priority_Repair')");
    const totalPendingClaims = parseInt(pendingClaimsRes.rows[0].count, 10);

    res.status(200).json({
      success: true,
      data: {
        totalActiveRentals,
        totalSecurityDepositsHeld: parseFloat(totalDepositsHeld.toFixed(2)),
        totalPendingClaims
      }
    });

  } catch (err) {
    next(err);
  }
};
