require('dotenv').config();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const sonu = await User.findOne({ name: 'Sonu' });
  
  if (!sonu) {
    console.log('Sonu not found!');
    process.exit();
  }
  
  const token = jwt.sign(
    {
      id: sonu._id,
      name: sonu.name,
      role: sonu.role,
      organizationId: sonu.organizationId
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' }
  );
  
  console.log('Token generated!');
  
  try {
    const res = await fetch('http://localhost:5000/api/analytics/overview?reportingPeriodId=6ac73e6cd5dd488031c02894', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('API Error:', err.message);
  }
  
  process.exit();
}
main().catch(console.error);
