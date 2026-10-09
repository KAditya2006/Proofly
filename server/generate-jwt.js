const jwt = require('jsonwebtoken');
const token = jwt.sign(
    { _id: '6ac6753624c126f910c01cdb', role: 'ADMIN' },
    'meil_esg_super_secret_key_2026',
    { expiresIn: '30d' }
);
console.log('JWT:', token);
