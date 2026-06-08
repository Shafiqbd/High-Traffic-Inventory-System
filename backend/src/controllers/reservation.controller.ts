import { Request, Response } from 'express';
import reservationService from '../services/reservation.service.js';
import type { CreateReservationDto, CancelReservationDto, ApiResponse } from '../types/reservation.types.js';

class ReservationController {
  // Create reservation
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateReservationDto;

      console.log('Creating reservation:', body);

      // Validation
      if (!body.dropId || !body.userId) {
        return res.status(400).json({
          success: false,
          error: 'dropId and userId are required',
        } as ApiResponse<never>);
      }

      const result = await reservationService.create(body);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error: any) {
      console.error('Error creating reservation:', error);

      // Handle specific errors
      const message = error.message || 'Failed to create reservation';

      if (
        message.includes('not found') ||
        message.includes('not active') ||
        message.includes('available') ||
        message.includes('already')
      ) {
        return res.status(400).json({
          success: false,
          error: message,
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create reservation',
      } as ApiResponse<never>);
    }
  }

  // Get reservation by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reservationId = typeof id === 'string' ? id : id[0];

      const reservation = await reservationService.findById(reservationId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        data: reservation,
      } as ApiResponse<typeof reservation>);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reservation',
      } as ApiResponse<never>);
    }
  }

  // Get user reservation for a specific drop
  async getUserReservation(req: Request, res: Response) {
    try {
      const { dropId, userId } = req.query;

      if (!dropId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'dropId and userId query parameters are required',
        } as ApiResponse<never>);
      }

      const reservation = await reservationService.findUserReservation(
        dropId as string,
        userId as string
      );

      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'No active reservation found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        data: reservation,
      } as ApiResponse<typeof reservation>);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reservation',
      } as ApiResponse<never>);
    }
  }

  // Cancel reservation
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reservationId = typeof id === 'string' ? id : id[0];
      const body = req.body as CancelReservationDto;

      if (!body.userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        } as ApiResponse<never>);
      }

      const result = await reservationService.cancel(reservationId, body);

      res.json({
        ...result,
      } as ApiResponse<typeof result>);
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);

      const message = error.message || 'Failed to cancel reservation';

      if (
        message.includes('not found') ||
        message.includes('another user') ||
        message.includes('cannot cancel')
      ) {
        return res.status(400).json({
          success: false,
          error: message,
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel reservation',
      } as ApiResponse<never>);
    }
  }

  // Get all reservations for a user
  async getUserReservations(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId query parameter is required',
        } as ApiResponse<never>);
      }

      const reservations = await reservationService.findByUserId(userId as string);

      res.json({
        success: true,
        data: reservations,
        count: reservations.length,
      } as ApiResponse<typeof reservations>);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reservations',
      } as ApiResponse<never>);
    }
  }
}

export default new ReservationController();
