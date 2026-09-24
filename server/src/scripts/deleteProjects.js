const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const deleteProjects = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Drop the projects collection
    await mongoose.connection.db.collection('projects').deleteMany({});
    console.log('Deleted all projects');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

deleteProjects();
