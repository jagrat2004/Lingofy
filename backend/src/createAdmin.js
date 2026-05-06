const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User Schema (Simplified for script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, default: 'user' }
});

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/lingofy');
    console.log('Connected to MongoDB');

    const email = 'admin123@gmail.com';
    const plainPassword = 'admin@123';
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    if (user) {
      user.password = hashedPassword;
      user.role = 'admin';
      await user.save();
      console.log('Updated existing user to Admin');
    } else {
      await User.create({
        name: 'Admin',
        email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Created new Admin user');
    }

    console.log('Admin login: admin123@gmail.com / admin@123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdmin();
