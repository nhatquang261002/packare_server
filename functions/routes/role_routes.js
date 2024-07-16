const express = require('express');
const router = express.Router();
const { 
    createRole, 
    getAllRoles, 
    deleteRoleByRolename,
    setUserRoleByUserId
} = require('../controllers/role_controller');
const { authenticateToken } = require('../middlewares/jwt_verify');  // Import the authenticateToken middleware
const { checkRole } = require('../middlewares/check_role');  // Import the checkRole middleware

// Role routes
router.post('/create-role' ,/* authenticateToken, checkRole(['admin']),*/ createRole);  // Create a new role
router.get('/get-roles' ,/* authenticateToken, checkRole(['admin']),*/ getAllRoles);  // Get all roles
router.delete('/delete-role/:rolename' ,/* authenticateToken, checkRole(['admin']),*/ deleteRoleByRolename);
// Set role for a user by user_id
router.put('/set-role/:id' ,/* authenticateToken, checkRole(['admin']),*/  setUserRoleByUserId);

module.exports = router;
