import { Request, Response } from 'express';
import type { ApiResponse } from '../types/reservation.types.js';
import { CreatePurchaseDto } from '../types/purchase.types.js';
import purchaseService from '../services/purchase.service.js';

class PurchaseController {
  // Complete purchase from active reservation
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreatePurchaseDto;

      console.log('Completing purchase:', body);

      // Validation
      if (!body.dropId || !body.userId) {
        return res.status(400).json({
          success: false,
          error: 'dropId and userId are required',
        } as ApiResponse<never>);
      }

      const result = await purchaseService.create(body);

      res.status(201).json({
        success: true,
        message: 'Purchase completed successfully',
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error: any) {
      console.error('Error completing purchase:', error);

      // Handle specific errors
      const message = error.message || 'Failed to complete purchase';

      if (
        message.includes('No reservation found') ||
        message.includes('not active') ||
        message.includes('expired')
      ) {
        return res.status(400).json({
          success: false,
          error: message,
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to complete purchase',
      } as ApiResponse<never>);
    }
  }
}

export default new PurchaseController();
