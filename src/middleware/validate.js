const Joi = require('joi');
const { AppError } = require('./errorHandler');

const createJobSchema = Joi.object({
  jobName: Joi.string().trim().min(3).max(100).required(),
  cronExpression: Joi.string().required().messages({
    'any.required': 'cronExpression is required (e.g. "0 9 * * *")'
  }),
  action: Joi.string()
    .valid('send_notification', 'generate_report', 'cleanup', 'token_cleanup', 'custom')
    .required(),
  payload: Joi.object().default({}),
  createdBy: Joi.string().default('api'),
  // Support both cron and one-time jobs
  runAt: Joi.date().iso().optional(), // for one-time delayed jobs
  timezone: Joi.string().default('Africa/Nairobi')
});

const updateJobSchema = Joi.object({
  jobName: Joi.string().trim().min(3).max(100),
  cronExpression: Joi.string(),
  action: Joi.string().valid(
    'send_notification',
    'generate_report',
    'cleanup',
    'token_cleanup',
    'custom'
  ),
  payload: Joi.object(),
  status: Joi.string().valid('active', 'paused', 'cancelled'),
  timezone: Joi.string()
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new AppError(message, 400));
  }

  req.body = value;
  next();
};

module.exports = {
  validateCreateJob: validate(createJobSchema),
  validateUpdateJob: validate(updateJobSchema)
};
