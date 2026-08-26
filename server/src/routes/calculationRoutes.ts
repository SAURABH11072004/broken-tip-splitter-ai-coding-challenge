import { Router } from 'express';
import {
  createCalculation,
  getCalculations,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
} from '../controllers/calculationController';

const router = Router();

router.post('/', createCalculation);
router.get('/', getCalculations);
router.get('/:id', getCalculationById);
router.put('/:id', updateCalculation);
router.delete('/:id', deleteCalculation);

export default router;
