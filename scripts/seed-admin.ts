import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI or MONGO_URL environment variable inside .env');
  process.exit(1);
}

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminEmail = process.env.ADMIN_USERNAME || 'admin@markethub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin with email ${adminEmail} already exists`);
    } else {
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        name: adminName,
        role: 'superadmin',
        isActive: true,
        emailVerified: true,
      });

      await adminUser.save();
      console.log('SuperAdmin created successfully!');
      console.log('Name:', adminName);
      console.log('Email:', adminEmail);
      console.log('Password:', Buffer.from(adminPassword).fill('*').toString()); // Hide password in logs
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
