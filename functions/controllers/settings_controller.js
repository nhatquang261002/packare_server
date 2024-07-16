const Settings = require('../models/settings_model');

// Get all settings
const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }


    res.status(200).json({ message: 'Settings retrieved successfully', data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a setting
const updateSetting = async (req, res) => {
  const { key } = req.params; // Extract the key from the URL parameter
  const { value } = req.body; // Extract the value from the request body
  console.log(key);
  try {
    console.log('here');
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    const setting = settings.settings.find(setting => setting.key === key);
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    setting.value = value;
    setting.modified_at = new Date();
    await settings.save();
    
    res.status(200).json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { getAllSettings, updateSetting };
