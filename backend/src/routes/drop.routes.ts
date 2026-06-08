import { Router } from 'express';
import dropController from '../controllers/drop.controller.js';

const router = Router();

// Get all drops
router.get('/', dropController.getAll.bind(dropController));

// Get single drop
router.get('/:id', dropController.getById.bind(dropController));

// PCreate new drop
router.post('/', dropController.create.bind(dropController));

// Update drop
router.put('/:id', dropController.update.bind(dropController));

// Update drop status
router.patch('/:id/status', dropController.updateStatus.bind(dropController));

//Delete drop
router.delete('/:id', dropController.delete.bind(dropController));

export default router;
