const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Not a valid id');
const optionalObjectId = z.union([objectId, z.literal(''), z.null()]).optional();

const registerSchema = z.object({
  name: z.string().min(2, 'Use at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  orgName: z.string().min(2, 'Name the business'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

const contactSchema = z.object({
  name: z.string().min(2, 'Use at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  source: z.enum(['referral', 'website', 'cold outreach', 'event', 'social', 'other']).optional(),
  tags: z.array(z.string()).optional(),
  ownerId: optionalObjectId,
});

const dealSchema = z.object({
  title: z.string().min(2, 'Give the deal a title'),
  value: z.coerce.number().min(0, 'Value cannot be negative').optional(),
  stageId: objectId,
  contactId: optionalObjectId,
  ownerId: optionalObjectId,
  expectedCloseDate: z.coerce.date().optional().nullable(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  lostReasonCategory: z.enum(['Price', 'Competitor', 'Features', 'Timing', 'Other', '']).optional(),
  lostReason: z.string().optional().or(z.literal('')),
});

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['manager', 'rep']).optional(),
});

const interactionSchema = z.object({
  entityType: z.enum(['contact', 'deal']),
  entityId: objectId,
  type: z.enum(['call', 'email', 'meeting', 'sms']),
  notes: z.string().min(1, 'Write some details about the interaction'),
  outcome: z.enum(['connected', 'no-answer', 'left-voicemail', 'completed']),
  duration: z.coerce.number().min(0).default(0),
});

const playbookSchema = z.object({
  name: z.string().min(1, 'Name the playbook'),
  triggerType: z.enum(['contact_created', 'deal_stage_entered']),
  triggerValue: z.string().optional().or(z.literal('')),
  tasks: z.array(
    z.object({
      title: z.string().min(1, 'Task title is required'),
      dueDaysAfter: z.coerce.number().min(0).default(1),
    })
  ).min(1, 'Add at least one task to the playbook'),
});

const moveDealSchema = z.object({
  stageId: objectId,
  // ids of the cards that will sit above / below after the drop
  beforeId: optionalObjectId,
  afterId: optionalObjectId,
});

const noteSchema = z.object({
  body: z.string().min(1, 'Write something first'),
  entityType: z.enum(['contact', 'deal']),
  entityId: objectId,
});

const taskSchema = z.object({
  title: z.string().min(2, 'Describe the follow-up'),
  dueDate: z.coerce.date(),
  assigneeId: optionalObjectId,
  entityType: z.enum(['contact', 'deal', 'none']).optional(),
  entityId: optionalObjectId,
  done: z.boolean().optional(),
});

const stagesSchema = z.object({
  stages: z
    .array(
      z.object({
        _id: objectId.optional(),
        name: z.string().min(1, 'Name the stage'),
        color: z.string().optional(),
        isWon: z.boolean().optional(),
      })
    )
    .min(1, 'Keep at least one stage'),
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  ownerId: z.string().optional(),
  source: z.string().optional(),
  sort: z.string().optional(),
});

const taskQuerySchema = z.object({
  filter: z.enum(['all', 'today', 'overdue', 'upcoming', 'done']).default('all'),
  assigneeId: z.string().optional(),
});

const idParams = z.object({ id: objectId });

module.exports = {
  registerSchema,
  loginSchema,
  contactSchema,
  dealSchema,
  moveDealSchema,
  noteSchema,
  taskSchema,
  stagesSchema,
  listQuerySchema,
  taskQuerySchema,
  idParams,
  inviteSchema,
  interactionSchema,
  playbookSchema,
};
