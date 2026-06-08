import { Router } from 'express';
import reservationController from '../controllers/reservation.controller.js';

const router = Router();

// POST - Create new reservation
router.post('/', reservationController.create.bind(reservationController));

// GET - Get reservation by ID
router.get('/:id', reservationController.getById.bind(reservationController));

// GET - Get user reservation for a specific drop
router.get('/user', reservationController.getUserReservation.bind(reservationController));

// GET - Get all reservations for a user
router.get('/user/list', reservationController.getUserReservations.bind(reservationController));

// DELETE - Cancel reservation
router.delete('/:id', reservationController.cancel.bind(reservationController));

export default router;
