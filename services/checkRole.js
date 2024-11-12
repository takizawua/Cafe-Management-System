require('dotenv').config();

function checkRole(req, res, next) {
    const userRole = res.locals.user.role
    
    // Check if the role is 'user' and block non-admins     
    if (userRole === process.env.USER){
        return res.sendStatus(403); // 403 Forbidden for regular users
    }
    
    // If the user is not 'user', proceed (assuming it's 'admin')
    next()
}

module.exports = { checkRole }