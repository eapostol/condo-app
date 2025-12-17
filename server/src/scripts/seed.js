import '../config/db.js';
import CondoUnit from '../models/CondoUnit.js';
import WorkOrder from '../models/WorkOrder.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await Promise.all([
      CondoUnit.deleteMany({}),
      WorkOrder.deleteMany({}),
      Payment.deleteMany({}),
      User.deleteMany({})
    ]);

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

    const managerPassword = await bcrypt.hash('Password123!', 10);
    const boardPassword = await bcrypt.hash('Password123!', 10);

    await User.insertMany([
      {
        name: 'Manager User',
        email: 'manager@example.com',
        username: 'manager1',
        passwordHash: managerPassword,
        role: 'manager',
        provider: 'local'
      },
      {
        name: 'Board User',
        email: 'board@example.com',
        username: 'board1',
        passwordHash: boardPassword,
        role: 'board',
        provider: 'local'
      }
    ]);

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
