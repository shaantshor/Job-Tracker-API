const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const controller = require('../controllers/contacts.controller');

const router = Router();

router.use(auth);

router.post(
  '/applications/:id/contacts',
  [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('name').notEmpty().withMessage('Contact name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  validate,
  controller.create,
);

router.put(
  '/contacts/:id',
  [
    param('id').isInt().withMessage('Contact ID must be an integer'),
  ],
  validate,
  controller.update,
);

router.delete(
  '/contacts/:id',
  [param('id').isInt().withMessage('Contact ID must be an integer')],
  validate,
  controller.remove,
);

module.exports = router;
