import { Request, Response } from 'express';
import dropService from '../services/drop.service.js';
import type {  CreateDropDto, UpdateDropDto, UpdateDropStatusDto, DropQuery } from '../types/drop.types.js';
import { ApiResponse } from '../types/common.type.js';

class DropController {
  // Get all drops
  async getAll(req: Request, res: Response) {
    try {
      const drops = await dropService.findAll();
      res.json({
        success: true,
        data: drops,
        count: drops.length,
      } as ApiResponse<typeof drops>);
    } catch (error) {
      console.error('Error fetching drops:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch drops',
      } as ApiResponse<never>);
    }
  }

  // Get single drop by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Route params can be string | string[], ensure we have a string
      const dropId = typeof id === 'string' ? id : id[0];
      const drop = await dropService.findById(dropId);

      if (!drop) {
        return res.status(404).json({
          success: false,
          error: 'Drop not found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        data: drop,
      } as ApiResponse<typeof drop>);
    } catch (error) {
      console.error('Error fetching drop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch drop',
      } as ApiResponse<never>);
    }
  }

  // Create new drop
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateDropDto;

      // Validation
      if (!body.name || !body.price || !body.initialStock) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, price, initialStock are required',
        } as ApiResponse<never>);
      }

      const priceNum = typeof body.price === 'string' ? parseFloat(body.price) : body.price;
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a valid positive number',
        } as ApiResponse<never>);
      }

      if (!Number.isInteger(body.initialStock) || body.initialStock < 0) {
        return res.status(400).json({
          success: false,
          error: 'initialStock must be a non-negative integer',
        } as ApiResponse<never>);
      }

      const drop = await dropService.create(body);

      res.status(201).json({
        success: true,
        message: 'Drop created successfully',
        data: drop,
      } as ApiResponse<typeof drop>);
    } catch (error) {
      console.error('Error creating drop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create drop',
      } as ApiResponse<never>);
    }
  }

  // Update drop
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dropId = typeof id === 'string' ? id : id[0];
      const body = req.body as UpdateDropDto;

      const drop = await dropService.update(dropId, body);

      if (!drop) {
        return res.status(404).json({
          success: false,
          error: 'Drop not found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        message: 'Drop updated successfully',
        data: drop,
      } as ApiResponse<typeof drop>);
    } catch (error) {
      console.error('Error updating drop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update drop',
      } as ApiResponse<never>);
    }
  }

  // Update drop status
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dropId = typeof id === 'string' ? id : id[0];
      const { status } = req.body as UpdateDropStatusDto;

      if (!status || !['UPCOMING', 'ACTIVE', 'ENDED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be UPCOMING, ACTIVE, or ENDED',
        } as ApiResponse<never>);
      }

      const drop = await dropService.updateStatus(dropId, { status });

      if (!drop) {
        return res.status(404).json({
          success: false,
          error: 'Drop not found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        message: 'Drop status updated successfully',
        data: drop,
      } as ApiResponse<typeof drop>);
    } catch (error) {
      console.error('Error updating drop status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update drop status',
      } as ApiResponse<never>);
    }
  }

  // Delete drop
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dropId = typeof id === 'string' ? id : id[0];

      try {
        await dropService.delete(dropId);
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: err.message,
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        message: 'Drop deleted successfully',
      } as ApiResponse<never>);
    } catch (error) {
      console.error('Error deleting drop:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete drop',
      } as ApiResponse<never>);
    }
  }
}

export default new DropController();
