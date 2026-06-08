import { Router } from 'express';
import userController from '../controllers/user.controller.js';

const router = Router();

// GET all users
router.get('/', userController.getAll.bind(userController));

// GET user by ID
router.get('/:id', userController.getById.bind(userController));

// POST create new user
router.post('/', userController.create.bind(userController));

export default router;
