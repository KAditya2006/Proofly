const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.connect('mongodb://choudharyadityakumar49_db_user:mZXQfxBJYrQdaips@ac-r0myjej-shard-00-00.2fydlar.mongodb.net:27017,ac-r0myjej-shard-00-01.2fydlar.mongodb.net:27017,ac-r0myjej-shard-00-02.2fydlar.mongodb.net:27017/meil_esg360?ssl=true&replicaSet=atlas-ti7ecy-shard-0&authSource=admin&retryWrites=true&w=majority')
.then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Admin@123', salt);
    await mongoose.connection.collection('users').updateOne(
        { email: 'kaditya39546@gmail.com' },
        { $set: { passwordHash: hash, isEmailVerified: true, mustChangePassword: false } }
    );
    console.log('Password reset to Admin@123');
    process.exit(0);
})
.catch(console.error);
