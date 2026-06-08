import { Request, Response } from 'express';
import userService from '../services/user.service.js';
import type { CreateUserDto, UpdateUserDto, ApiResponse } from '../types/user.types.js';

class UserController {
  // Get all users
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.findAll();

      res.json({
        success: true,
        data: users,
        count: users.length,
      } as ApiResponse<typeof users>);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      } as ApiResponse<never>);
    }
  }

  // Get user by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = typeof id === 'string' ? id : id[0];

      const user = await userService.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        } as ApiResponse<never>);
      }

      res.json({
        success: true,
        data: user,
      } as ApiResponse<typeof user>);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
      } as ApiResponse<never>);
    }
  }

  // Create new user
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateUserDto;

      // Validation
      if (!body.email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        } as ApiResponse<never>);
      }

      const user = await userService.create(body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      } as ApiResponse<typeof user>);
    } catch (error: any) {
      console.error('Error creating user:', error);

      const message = error.message || 'Failed to create user';

      if (message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          error: message,
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create user',
      } as ApiResponse<never>);
    }
  }

}

export default new UserController();
