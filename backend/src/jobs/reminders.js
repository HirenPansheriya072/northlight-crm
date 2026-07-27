const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const User = require('../models/User');
const env = require('../config/env');

let transporter = null;
function getTransporter() {
  if (!env.mail.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
    });
  }
  return transporter;
}

async function sendReminder(task, user) {
  const due = new Date(task.dueDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const subject = `Follow-up due: ${task.title}`;
  const text = `${task.title}\nDue ${due}\n\nOpen the CRM to mark it done.`;

  const mailer = getTransporter();
  if (!mailer) {
    // No SMTP configured -- log it so the job is still observable in development.
    console.log(`[reminder] would email ${user.email}: ${subject}`);
    return;
  }
  await mailer.sendMail({ from: env.mail.from, to: user.email, subject, text });
}

/**
 * Runs every 15 minutes and emails the assignee once per task.
 * reminderSent is the idempotency guard -- without it a restart would re-send everything.
 */
async function runReminderSweep() {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000);

  const due = await Task.find({
    done: false,
    reminderSent: false,
    dueDate: { $lte: soon },
  }).limit(200);

  if (due.length === 0) return;

  for (const task of due) {
    try {
      const user = task.assigneeId ? await User.findById(task.assigneeId) : null;
      if (user) await sendReminder(task, user);
      task.reminderSent = true;
      await task.save();
    } catch (err) {
      console.error(`reminder failed for task ${task._id}:`, err.message);
    }
  }
  console.log(`[reminder] processed ${due.length} task(s)`);
}

function startReminderCron() {
  cron.schedule('*/15 * * * *', runReminderSweep);
  console.log('Reminder job scheduled (every 15 minutes)');
}

module.exports = { startReminderCron, runReminderSweep };
