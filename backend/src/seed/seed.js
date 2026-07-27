/* eslint-disable no-console */
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDb } = require('../config/db');
const Org = require('../models/Org');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const ORDER_GAP = 1000;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// A small design studio -- the demo reads like a real book of business, not "Test Contact 1".
const PEOPLE = [
  ['Priya Raval', 'priya@meridianfoods.com', 'Meridian Foods', 'Head of Marketing', 'referral', ['retainer', 'warm']],
  ['Daniel Okafor', 'd.okafor@brightpath.io', 'Brightpath Analytics', 'Founder', 'website', ['saas']],
  ['Hannah Lindqvist', 'hannah@nordlys.se', 'Nordlys Interiors', 'Owner', 'social', ['rebrand']],
  ['Marcus Webb', 'marcus.webb@calderon.law', 'Calderon & Webb', 'Partner', 'referral', ['legal', 'slow-mover']],
  ['Aisha Mahmoud', 'aisha@sunroute.travel', 'Sunroute Travel', 'Ops Director', 'event', ['warm']],
  ['Tom Behrens', 'tom@behrensbuild.com', 'Behrens Build Co', 'Owner', 'cold outreach', ['construction']],
  ['Sofia Marchetti', 'sofia@atelier-marchetti.it', 'Atelier Marchetti', 'Creative Director', 'referral', ['fashion', 'retainer']],
  ['Grace Adeyemi', 'grace@lumenclinic.co.uk', 'Lumen Clinic', 'Practice Manager', 'website', ['healthcare']],
  ['Yusuf Karim', 'yusuf@karimlogistics.ae', 'Karim Logistics', 'COO', 'event', ['enterprise']],
  ['Elena Vasquez', 'elena@verdeorganics.mx', 'Verde Organics', 'Brand Lead', 'social', ['cpg']],
  ['Jack Donnelly', 'jack@harborcoffee.com', 'Harbor Coffee Roasters', 'Owner', 'referral', ['local']],
  ['Nina Petrova', 'nina@stackforge.dev', 'Stackforge', 'CTO', 'website', ['saas', 'technical']],
  ['Rahul Mehta', 'rahul@vistaproperties.in', 'Vista Properties', 'Sales Head', 'cold outreach', ['real-estate']],
  ['Claire Dubois', 'claire@maisonclair.fr', 'Maison Clair', 'Director', 'referral', ['hospitality']],
  ['Owen Fletcher', 'owen@fletchergym.com', 'Fletcher Strength', 'Owner', 'social', ['fitness', 'local']],
  ['Mei Tanaka', 'mei@kotoworks.jp', 'Koto Works', 'Producer', 'event', ['media']],
  ['Samuel Boateng', 'sam@accraprint.gh', 'Accra Print House', 'Manager', 'cold outreach', []],
  ['Laura Kowalski', 'laura@northfieldvet.com', 'Northfield Veterinary', 'Practice Owner', 'website', ['healthcare', 'local']],
];

const DEAL_TITLES = [
  ['Website redesign', 14000], ['Brand identity refresh', 9500], ['Marketing site + CMS', 18000],
  ['Monthly design retainer', 4200], ['E-commerce build', 26000], ['Packaging design', 7800],
  ['Product launch campaign', 12500], ['Booking system build', 16000], ['Logo and style guide', 5400],
  ['Annual report design', 6900], ['Mobile app UI', 22000], ['SEO and content sprint', 8200],
  ['Photography and assets', 3900], ['Dashboard UX audit', 6400], ['Email template system', 3200],
  ['Trade show collateral', 4800], ['Internal portal redesign', 19500], ['Social content package', 5100],
  ['Landing page tests', 4400], ['Rebrand rollout phase 2', 15800],
];

const NOTE_BODIES = [
  'Kick-off call went well. They want to launch before their trade show in the spring.',
  'Budget is tighter than expected — proposed a phased scope instead of one big bill.',
  'Left a voicemail. Their inbox is a black hole, try WhatsApp next time.',
  'Sent the proposal. She said the board reviews it Thursday.',
  'They loved concept B. Concept A is dead, do not bring it back up.',
  'Procurement needs a W-9 and a COI before they can raise the PO.',
  'Referred by Priya at Meridian. Warm intro, mention her name.',
  'Wants to see case studies from the same industry before committing.',
  'Pushed the timeline to Q3 — their internal hire starts in June.',
  'Asked about a retainer after the project wraps. Worth revisiting in a month.',
  'Competitor quoted them 30% lower. Held the price and explained the scope difference.',
  'Signed! Deposit invoice sent, kickoff booked for Monday.',
];

const TASK_TITLES = [
  'Call to confirm scope', 'Send revised proposal', 'Follow up on the invoice',
  'Book the kickoff call', 'Share case studies', 'Check in after the board meeting',
  'Send the contract for signature', 'Chase the missing brand assets',
  'Prepare the pitch deck', 'Confirm the launch date',
];

async function seed() {
  await connectDb();
  console.log('Clearing existing demo data...');
  await Promise.all([
    Org.deleteMany({}),
    User.deleteMany({}),
    Contact.deleteMany({}),
    Deal.deleteMany({}),
    Note.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  const org = await Org.create({
    name: 'Northlight Studio',
    currency: 'USD',
    pipelineStages: Org.defaultStages(),
  });
  const stages = org.pipelineStages;

  const password = await User.hashPassword(env.demo.password);
  const users = await User.create([
    { orgId: org._id, name: 'Ada Whitfield', email: env.demo.email, passwordHash: password, role: 'owner', avatarColor: 'pine' },
    { orgId: org._id, name: 'Leo Marchand', email: 'leo@northlight.co', passwordHash: password, role: 'manager', avatarColor: 'brass' },
    { orgId: org._id, name: 'Ivy Chen', email: 'ivy@northlight.co', passwordHash: password, role: 'rep', avatarColor: 'sky' },
  ]);

  const contacts = await Contact.create(
    PEOPLE.map(([name, email, company, title, source, tags]) => ({
      orgId: org._id,
      name,
      email,
      company,
      title,
      source,
      tags,
      phone: `+1 555 ${String(Math.floor(1000 + Math.random() * 8999))}`,
      ownerId: rand(users)._id,
    }))
  );

  console.log('Building the pipeline...');
  const deals = [];
  const perStage = {};

  for (let i = 0; i < DEAL_TITLES.length; i += 1) {
    const [title, value] = DEAL_TITLES[i];
    const contact = contacts[i % contacts.length];
    // Weight the board toward the early stages, the way a real pipeline looks.
    const stage = stages[Math.min(Math.floor(Math.random() * 5.6), 4)];
    perStage[stage._id] = (perStage[stage._id] || 0) + 1;

    deals.push({
      orgId: org._id,
      title,
      value: Math.round(value * (0.85 + Math.random() * 0.3)),
      currency: 'USD',
      stageId: stage._id,
      order: perStage[stage._id] * ORDER_GAP,
      contactId: contact._id,
      ownerId: contact.ownerId,
      expectedCloseDate: daysFromNow(Math.floor(Math.random() * 70) - 5),
      status: stage.isWon ? 'won' : 'open',
    });
  }

  // A few closed-lost deals so the win rate is not a fake 100%.
  for (let i = 0; i < 4; i += 1) {
    const contact = rand(contacts);
    deals.push({
      orgId: org._id,
      title: rand(['Website refresh', 'Brand sprint', 'Campaign design', 'App redesign']),
      value: Math.round(4000 + Math.random() * 12000),
      currency: 'USD',
      stageId: stages[2]._id,
      order: (i + 1) * ORDER_GAP,
      contactId: contact._id,
      ownerId: contact.ownerId,
      status: 'lost',
      lostReason: rand(['Went with a cheaper agency', 'Budget cut', 'Project postponed', 'No response']),
      updatedAt: daysFromNow(-Math.floor(Math.random() * 25)),
    });
  }

  // Backdate some wins so the 6-month chart has a shape.
  const created = await Deal.create(deals);
  const wonDeals = created.filter((d) => d.status === 'won');
  await Promise.all(
    wonDeals.map((d, i) =>
      Deal.updateOne(
        { _id: d._id },
        { $set: { updatedAt: new Date(Date.now() - (i % 6) * 26 * 24 * 60 * 60 * 1000) } },
        { timestamps: false }
      )
    )
  );

  console.log('Writing notes and follow-ups...');
  const notes = [];
  for (const contact of contacts) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      notes.push({
        orgId: org._id,
        body: rand(NOTE_BODIES),
        entityType: 'contact',
        entityId: contact._id,
        authorId: rand(users)._id,
        createdAt: daysFromNow(-Math.floor(Math.random() * 40)),
      });
    }
  }
  for (const deal of created.slice(0, 12)) {
    notes.push({
      orgId: org._id,
      body: rand(NOTE_BODIES),
      entityType: 'deal',
      entityId: deal._id,
      authorId: rand(users)._id,
      createdAt: daysFromNow(-Math.floor(Math.random() * 20)),
    });
  }
  await Note.insertMany(notes);

  const tasks = [];
  // Overdue, due today, and upcoming -- every filter tab should have something in it.
  const offsets = [-6, -3, -1, 0, 0, 0, 1, 2, 3, 5, 8, 12, 21];
  for (let i = 0; i < offsets.length; i += 1) {
    const target = rand(created.filter((d) => d.status === 'open'));
    tasks.push({
      orgId: org._id,
      title: rand(TASK_TITLES),
      dueDate: (() => {
        const d = daysFromNow(offsets[i]);
        d.setHours(9 + (i % 8), 0, 0, 0);
        return d;
      })(),
      done: false,
      assigneeId: rand(users)._id,
      entityType: 'deal',
      entityId: target._id,
    });
  }
  for (let i = 0; i < 6; i += 1) {
    const contact = rand(contacts);
    tasks.push({
      orgId: org._id,
      title: rand(TASK_TITLES),
      dueDate: daysFromNow(-Math.floor(Math.random() * 20) - 1),
      done: true,
      doneAt: daysFromNow(-Math.floor(Math.random() * 18)),
      assigneeId: rand(users)._id,
      entityType: 'contact',
      entityId: contact._id,
      reminderSent: true,
    });
  }
  await Task.insertMany(tasks);

  const activities = [];
  for (let i = 0; i < 18; i += 1) {
    const deal = rand(created);
    activities.push({
      orgId: org._id,
      actorId: rand(users)._id,
      verb: rand(['created deal', 'moved deal', 'updated deal', 'added follow-up', 'created contact']),
      entityType: 'deal',
      entityId: deal._id,
      meta: { title: deal.title, stage: rand(stages).name },
      createdAt: daysFromNow(-Math.floor(Math.random() * 12)),
    });
  }
  await Activity.insertMany(activities);

  console.log('\nSeeded Northlight Studio');
  console.log(`  ${contacts.length} contacts, ${created.length} deals, ${notes.length} notes, ${tasks.length} follow-ups`);
  console.log(`\n  Demo login: ${env.demo.email} / ${env.demo.password}`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
