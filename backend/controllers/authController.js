const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbProvider = require('../db/dbProvider');

// Helper to sign JWT
const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET || 'milkledger_super_secret_jwt_key_2026_xYz',
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  const { name, email, password, businessName } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    let user = await dbProvider.User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await dbProvider.User.create({
      name,
      email,
      password: hashedPassword,
      businessName: businessName || '',
      businessAddress: '',
      gstNumber: '',
      currency: 'INR'
    });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        currency: user.currency
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during registration');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    const user = await dbProvider.User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        currency: user.currency
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during login');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, businessName, newPassword } = req.body;

  try {
    if (!email || !businessName || !newPassword) {
      return res.status(400).json({ msg: 'Please provide email, business name, and new password' });
    }

    const user = await dbProvider.User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User with this email not found' });
    }

    if (user.businessName.toLowerCase() !== businessName.toLowerCase()) {
      return res.status(400).json({ msg: 'Business name does not match our records' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dbProvider.User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ msg: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during password reset');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await dbProvider.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      businessAddress: user.businessAddress,
      gstNumber: user.gstNumber,
      currency: user.currency
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error fetching profile');
  }
};

exports.updateProfile = async (req, res) => {
  const { name, businessName, businessAddress, gstNumber, currency } = req.body;

  try {
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (businessName !== undefined) fieldsToUpdate.businessName = businessName;
    if (businessAddress !== undefined) fieldsToUpdate.businessAddress = businessAddress;
    if (gstNumber !== undefined) fieldsToUpdate.gstNumber = gstNumber;
    if (currency !== undefined) fieldsToUpdate.currency = currency;

    const user = await dbProvider.User.findByIdAndUpdate(req.user.id, fieldsToUpdate);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // fetch updated profile
    const updated = await dbProvider.User.findById(req.user.id);

    res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      businessName: updated.businessName,
      businessAddress: updated.businessAddress,
      gstNumber: updated.gstNumber,
      currency: updated.currency
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error updating profile');
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ msg: 'Please provide both old and new passwords' });
    }

    const user = await dbProvider.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dbProvider.User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error changing password');
  }
};
