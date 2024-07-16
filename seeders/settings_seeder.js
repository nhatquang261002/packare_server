const Settings = require('../models/settings_model');

const seedSettings = async () => {
  try {
    // Check if there are any existing settings
    const existingSettings = await Settings.findOne();
    if (existingSettings) {
      return;
    }

    // Define default settings
    const defaultSettings = [
      {
        key: 'current_order_limit',
        value: 3
      },
      {
        key: 'recommend_order_limit',
        value: 5
      },
      {
        key: 'order_percent_fee',
        value: 0.1
      },
      {
        key: 'first_km_price',
        value: 8000
      },
      {
        key: 'next_half_km_price',
        value: 3000
      }
    ];

    // Create settings document
    await Settings.create({ settings: defaultSettings });
    console.log('Settings seeded successfully.');
  } catch (error) {
    console.error('Error seeding settings:', error);
  }
};

module.exports = { seedSettings };
