const bcrypt = require('bcrypt');

// Function to hash a password
async function hashPassword(password) {
  try {
    // Generate a salt to add randomness to the hashing process
    const salt = await bcrypt.genSalt(10);

    // Hash the password using the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  } catch (error) {
    // Handle any errors
    console.error('Error hashing password:', error.message);
    throw new Error('Error hashing password');
  }
}

module.exports = {hashPassword};
