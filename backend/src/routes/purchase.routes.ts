import { Router } from 'express';
import purchaseController from '../controllers/purchase.controller.js';

const router = Router();

// POST - Create new purchase
router.post('/', purchaseController.create.bind(purchaseController));

export default router;
