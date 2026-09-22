import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BRSRCoreConfig from '../models/BRSRCoreConfig';
import ESGIndicator from '../models/ESGIndicator';

dotenv.config();

const clearBrsr = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string || 'mongodb://localhost:27017/meil_esg360');
    console.log('MongoDB Connected. Removing dummy BRSR data...');

    await BRSRCoreConfig.deleteMany({});
    
    // We only added these 4 dummy indicators
    await ESGIndicator.deleteMany({
      code: { $in: ['E1', 'E2', 'E3', 'E4'] }
    });

    console.log('Dummy BRSR Core Configs and Indicators removed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error removing dummy BRSR data:', error);
    process.exit(1);
  }
};

clearBrsr();
