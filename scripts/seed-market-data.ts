
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Zone from '../src/models/Zone';
import Lock from '../src/models/Lock';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI or MONGO_URL environment variable inside .env');
  process.exit(1);
}

const zonesData = [
  {
    name: 'โซน A (หน้าโครงการ)',
    description: 'พื้นที่ทำเลทอง ติดถนนหลัก คนเดินพลุกพล่านที่สุด เหมาะสำหรับร้านแบรนด์เนมหรือร้านที่ต้องการความโดดเด่น',
    pricing: { daily: 500, weekly: 3000, monthly: 10000 },
    prefix: 'A'
  },
  {
    name: 'โซน B (อาหารและเครื่องดื่ม)',
    description: 'โซนใจกลางตลาด ใกล้ที่นั่งพักผ่อนและจุดถ่ายรูป มีระบบน้ำและไฟรองรับการทำอาหาร',
    pricing: { daily: 350, weekly: 2000, monthly: 7500 },
    prefix: 'B'
  },
  {
    name: 'โซน C (แฟชั่นและไลฟ์สไตล์)',
    description: 'โซนสินค้าทั่วไป เสื้อผ้า เครื่องประดับ กิ๊ฟช็อป บรรยากาศร่มรื่น เดินสบาย',
    pricing: { daily: 250, weekly: 1500, monthly: 5000 },
    prefix: 'C'
  },
  {
    name: 'โซน D (สินค้าเกษตรและของสด)',
    description: 'โซนพื้นที่กว้างขวาง เหมาะสำหรับพ่อค้าแม่ค้าขายส่ง ผัก ผลไม้ หรือของสดจากไร่',
    pricing: { daily: 150, weekly: 900, monthly: 3000 },
    prefix: 'D'
  }
];

async function seedMarketData() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // 1. Clear existing data (Optional - depending on if you want to keep old data)
    // For test data, it's often better to start fresh
    const confirm = true; // Set to true to clear
    if (confirm) {
      await Zone.deleteMany({});
      await Lock.deleteMany({});
      console.log('Cleared existing Zones and Locks');
    }

    for (const z of zonesData) {
      // Create Zone
      const zone = await Zone.create({
        name: z.name,
        description: z.description,
        isActive: true,
        images: [`https://picsum.photos/seed/${z.prefix}/800/600`]
      });

      console.log(`Created Zone: ${zone.name}`);

      // Create 5-8 locks per zone
      const numLocks = Math.floor(Math.random() * 4) + 5; // 5-8 locks
      
      for (let i = 1; i <= numLocks; i++) {
        const lockNumber = `${z.prefix}-${i.toString().padStart(3, '0')}`;
        
        // Randomly decide pricing types (daily is always required per schema)
        const hasWeekly = Math.random() > 0.3;
        const hasMonthly = Math.random() > 0.5;

        await Lock.create({
          lockNumber,
          zone: zone._id,
          size: {
            width: 2 + Math.floor(Math.random() * 2), // 2-3m
            length: 2 + Math.floor(Math.random() * 2), // 2-3m
            unit: 'm'
          },
          pricing: {
            daily: z.pricing.daily,
            weekly: hasWeekly ? z.pricing.weekly : undefined,
            monthly: hasMonthly ? z.pricing.monthly : undefined
          },
          status: Math.random() > 0.8 ? 'maintenance' : 'available',
          description: `พื้นที่เช่าทำเลดี รหัส ${lockNumber} ใน${z.name}`,
          features: ['มีปลั๊กไฟ', 'ใกล้ทางเดินหลัก'].slice(0, Math.floor(Math.random() * 2) + 1),
          images: [`https://picsum.photos/seed/${lockNumber}/800/600`]
        });
      }
      console.log(`  - Created ${numLocks} locks for ${zone.name}`);
    }

    console.log('\nSeed completed successfully!');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedMarketData();
