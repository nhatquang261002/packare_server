const mongoose = require('mongoose');
const Role = require('../models/role_model');

// Define initial roles
const roles = ['admin', 'user', 'shipper', 'staff'];

// Function to seed roles
const seedRoles = async () => {
  try {
      // Check if roles already exist
      const existingRoles = await Role.find();
        
      if (existingRoles.length === 0) {
          // If roles do not exist, seed them
          const roles = ['admin', 'user', 'shipper', 'staff'];

          for (let roleName of roles) {
              const role = new Role({ rolename: roleName });
              await role.save();
          }

          console.log('Roles seeded successfully');
        }
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

// Seed roles
module.exports = { seedRoles };
