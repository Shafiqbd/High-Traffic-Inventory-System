import { Request, Response } from 'express';
import userService from '../services/user.service.js';
import type { CreateUserDto, UpdateUserDto, ApiResponse } from '../types/user.types.js';
import type { LoginDto } from '../types/auth.types.js';

class UserController {
  // Login user
  async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDto;
  console.log("body", body)
      // Validation
      if (!body.email || !body.password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        } as ApiResponse<never>);
      }
  
      const user = await userService.verifyPassword(body.email, body.password);

      res.json({
        success: true,
        message: 'Login successful',
        data: user,
      } as ApiResponse<typeof user>);
    } catch (error: any) {
      console.error('Error logging in:', error);

      const message = error.message || 'Failed to login';

      if (message.includes('Invalid')) {
        return res.status(401).json({
          success: false,
          error: message,
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to login',
      } as ApiResponse<never>);
    }
  }

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

  // Create new user (Register)
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

      if (!body.password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required',
        } as ApiResponse<never>);
      }

      if (body.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        } as ApiResponse<never>);
      }

      const user = await userService.create(body);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
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
