import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BRSRCoreConfig from '../models/BRSRCoreConfig';
import ESGIndicator from '../models/ESGIndicator';

dotenv.config();

const seedBrsr = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg_dev');
    console.log('MongoDB Connected for BRSR Seeding');

    let indicators = await ESGIndicator.find().limit(5);
    if (indicators.length === 0) {
      console.log('No indicators found. Creating dummy indicators...');
      await ESGIndicator.insertMany([
        { name: 'Scope 1 Emissions', code: 'E1', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'tCO2e', status: 'ACTIVE' },
        { name: 'Renewable Energy', code: 'E2', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'MWh', status: 'ACTIVE' },
        { name: 'Total Energy', code: 'E3', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'MWh', status: 'ACTIVE' },
        { name: 'Water Withdrawal', code: 'E4', category: 'ENVIRONMENT', dataType: 'NUMBER', mandatory: true, unit: 'kL', status: 'ACTIVE' }
      ]);
      indicators = await ESGIndicator.find().limit(5);
    }

    const configs = [
      {
        attributeName: 'GHG Emissions',
        description: 'Scope 1 and Scope 2 emissions tracking',
        indicatorIds: [indicators[0]?._id].filter(Boolean),
        status: 'ACTIVE'
      },
      {
        attributeName: 'Energy Management',
        description: 'Total energy consumed from renewable sources',
        indicatorIds: [indicators[1]?._id, indicators[2]?._id].filter(Boolean),
        status: 'ACTIVE'
      },
      {
        attributeName: 'Water & Effluents',
        description: 'Water withdrawal and discharge metrics',
        indicatorIds: [indicators[3]?._id].filter(Boolean),
        status: 'ACTIVE'
      }
    ];

    await BRSRCoreConfig.deleteMany({});
    await BRSRCoreConfig.insertMany(configs);
    console.log('BRSR Core Configs seeded successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error with BRSR seed:', error);
    process.exit(1);
  }
};

seedBrsr();
