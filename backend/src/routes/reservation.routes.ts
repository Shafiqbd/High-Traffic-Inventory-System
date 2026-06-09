import { Router } from 'express';
import reservationController from '../controllers/reservation.controller.js';

const router = Router();

// POST - Create new reservation
router.post('/', reservationController.create.bind(reservationController));

// GET - Get reservation by ID
router.get('/:id', reservationController.getById.bind(reservationController));


// DELETE - Cancel reservation
router.delete('/:id', reservationController.cancel.bind(reservationController));

export default router;
