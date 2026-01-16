import '../config/db.js';
import CondoUnit from '../models/CondoUnit.js';
import WorkOrder from '../models/WorkOrder.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Seed-once: only seeds if the database looks empty.
 *
 * Why: the existing seed.js intentionally DELETES all data before inserting demo rows.
 * That is great for development resets, but not safe to run automatically every time.
 */
async function seedOnce() {
  try {
    const existingUsers = await User.countDocuments({});
    if (existingUsers > 0) {
      console.log(`[seed-once] Skipping: found ${existingUsers} existing user(s).`);
      process.exit(0);
    }

    console.log('[seed-once] No users found. Seeding demo data...');

    const units = await CondoUnit.insertMany([
      {
        unitNumber: '101',
        ownerName: 'Alice Manager',
        email: 'alice@example.com',
        floor: 1,
        bedroomCount: 1,
        isRented: false
      },
      {
        unitNumber: '202',
        ownerName: 'Bob Board',
        email: 'bob@example.com',
        floor: 2,
        bedroomCount: 2,
        isRented: true
      }
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await WorkOrder.insertMany([
      {
        title: 'Leaky faucet',
        description: 'Kitchen faucet leaking',
        unit: units[0]._id,
        status: 'open',
        priority: 'high',
        reportedBy: 'Alice Manager',
        category: 'Plumbing'
      },
      {
        title: 'Hallway light',
        description: 'Light flickering',
        unit: units[1]._id,
        status: 'in-progress',
        priority: 'medium',
        reportedBy: 'Bob Board',
        category: 'Electrical'
      }
    ]);

    await Payment.insertMany([
      {
        unit: units[0]._id,
        amount: 500,
        type: 'maintenance',
        paidAt: monthStart
      },
      {
        unit: units[1]._id,
        amount: 700,
        type: 'special',
        paidAt: monthStart
      }
    ]);

    const passwordHash = await bcrypt.hash('Password123!', 10);

    await User.insertMany([
      {
        name: 'Manager User',
        email: 'manager@example.com',
        username: 'manager1',
        passwordHash,
        role: 'manager',
        provider: 'local'
      },
      {
        name: 'Board User',
        email: 'board@example.com',
        username: 'board1',
        passwordHash,
        role: 'board',
        provider: 'local'
      }
    ]);

    console.log('[seed-once] Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('[seed-once] Seed error', err);
    process.exit(1);
  }
}

seedOnce();
