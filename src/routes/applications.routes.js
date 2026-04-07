const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const controller = require('../controllers/applications.controller');
const timelineController = require('../controllers/timeline.controller');

const router = Router();

router.use(auth);

router.get('/stats/overview', controller.stats);

router.get('/', controller.list);

router.get(
  '/:id',
  [param('id').isInt().withMessage('Application ID must be an integer')],
  validate,
  controller.getOne,
);

router.post(
  '/',
  [
    body('company').notEmpty().withMessage('Company is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('status').optional().isIn(['wishlist', 'applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn']).withMessage('Invalid status'),
    body('remote_type').optional().isIn(['onsite', 'hybrid', 'remote']).withMessage('Invalid remote type'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('salary_min').optional().isInt({ min: 0 }).withMessage('Salary min must be a positive integer'),
    body('salary_max').optional().isInt({ min: 0 }).withMessage('Salary max must be a positive integer'),
  ],
  validate,
  controller.create,
);

router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('status').optional().isIn(['wishlist', 'applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn']).withMessage('Invalid status'),
    body('remote_type').optional().isIn(['onsite', 'hybrid', 'remote']).withMessage('Invalid remote type'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  ],
  validate,
  controller.update,
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('Application ID must be an integer')],
  validate,
  controller.remove,
);

router.post(
  '/:id/timeline',
  [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('event_type').notEmpty().withMessage('Event type is required'),
  ],
  validate,
  timelineController.create,
);

module.exports = router;
