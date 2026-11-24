const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const realCust = await mongoose.connection.collection('users').findOne({ role: 'customer' }) || await mongoose.connection.collection('users').findOne();
  if (realCust) {
    const res = await mongoose.connection.collection('contracts').updateMany(
      { customer: 'c1' },
      { $set: { customer: realCust._id } }
    );
    console.log('Fixed invalid customer references:', res.modifiedCount);
  }
  await mongoose.disconnect();
}
fix();
