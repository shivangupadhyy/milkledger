// Quick script to reset password for SandeepStores683@gmail.com
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const run = async () => {
  const newPassword = 'Sandeep@123';
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);

  const usersPath = path.join(__dirname, '..', 'data', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

  const user = users.find(u => u.email === 'SandeepStores683@gmail.com');
  if (user) {
    user.password = hashed;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('✅ Password for SandeepStores683@gmail.com reset to: Sandeep@123');
  } else {
    console.log('❌ User not found');
  }
};

run();
