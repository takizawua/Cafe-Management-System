const express = require('express');
const connection = require('../connection');
const router = express.Router();

const bcrypt = require('bcryptjs');
const saltRounds = 10; // Number of hashing rounds

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Connection = require('mysql/lib/Connection');
require('dotenv').config();

const auth = require('../services/authentication');
const checkRole = require('../services/checkRole');

/* router.post('/signup',(req,res) =>{
    let user = req.body;
    query = "select email,password,role,status from user where email=?"
    connection.query(query,[user.email],(err,results)=>{
        if(!err){
            if(results.length <=0){
                query = "insert into user(name,contactNumber,email,password,status,role) values(?,?,?,?,'false','user')";
                connection.query(query,[user.name,user.contactNumber,user.email,user.password],(err,results) =>{
                    if(!err){
                        return res.status(200).json({message: "Successfully Registered"});
                    }
                    else{
                        return res.status(500).json(err);
                    }
                })
            }
            else{
                return res.status(400).json({message: "Email Alredy Exist."});
            }
        }
        else{
        return res.status(500).json(err);
    }
    })
}); */

//SignUp Route
router.post('/signup', async (req, res) => {              
    const user = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/; // At least one digit, one lowercase, one uppercase, min 8 chars
    const queryCheckEmail = "SELECT email FROM user WHERE email = ?";
    const queryCheckName = "SELECT name FROM user WHERE name = ?";
    const queryInsert = "INSERT INTO user (name, contactNumber, email, password, status, role) VALUES (?, ?, ?, ?, 'false', 'user')";

    try {
        // Check if email is valid
        if (!emailRegex.test(user.email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        // Check if password meets requirements
        if (!passwordRegex.test(user.password)) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, and one number."
            });
        }

        // Check if email already exists
        connection.query(queryCheckEmail, [user.email], async (err, results) => {
            if (err) return res.status(500).json(err);

            if (results.length > 0) {
                return res.status(400).json({ message: "Email Already Exists." });
            }

            // Check if name already exists
            connection.query(queryCheckName, [user.name], async (err, nameResults) => {
                if (err) return res.status(500).json(err);

                if (nameResults.length > 0) {
                    return res.status(400).json({ message: "Name already exists." });
                }
        
                /* 
                // Hash the password before saving
                const hashedPassword = await bcrypt.hash(user.password, saltRounds); 
                */

                // Insert the new user
                connection.query(queryInsert, [user.name, user.contactNumber, user.email, user.password], (err, results) => {
                    if (err) return res.status(500).json(err);

                    return res.status(200).json({ message: "Successfully Registered" });
                });
            });
        });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ message: "An error occurred during registration", error });
    }
});

/* router.post('/login', (req, res) => {
   const user = req.body;
   query = "select email,password,role,status from user where email=?";
   connection.query(query, [user.email], (err, results) => {
       if (!err) {
           if (results.length <= 0 || results[0].password != user.password) {
               return res.status(401).json({ message: "Incorrect Username or Password" });
           }
           else if (results[0].status === 'false') {
               return res.status(401).json({ message: "Wait for Admin Approval" });
           }
           else if (results[0].password == user.password) {
               const response = { email: results[0].email, role: results[0].role }
               const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' })
               res.status(200).json({ token: accessToken });
           }
           else {
               return res.status(400).json({ message: "Something went wrong. Please try again later" });
           }
       }
       else {
           return res.status(500).json(err);
       }
   })
}) */

//Login Route
router.post('/login', async (req, res) => {
    const user = req.body;
    const query = "SELECT email, password, role, status FROM user WHERE email = ?";

    try {
        connection.query(query, [user.email], async (err, results) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            // Check if the user exists
            if (results.length === 0) {
                return res.status(401).json({ message: "Incorrect username or password" });
            }

            const dbUser = results[0];

            /* // Compare the hashed password with the provided password
            const isMatch = await bcrypt.compare(user.password, dbUser.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect username or password" });
            } */

            // Check if user is approved
            if (dbUser.status === 'false') {
                return res.status(403).json({ message: "Wait for admin approval" });
            }

            // Generate JWT token
            const response = { email: dbUser.email, role: dbUser.role };
            const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' });

            return res.status(200).json({ token: accessToken });
        });
    } catch (error) {
        return res.status(500).json({ message: "An error occurred during login", error });
    }
});

// Mailtransport Route
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,    // Your email
        pass: process.env.PASSWORD  // Your password or app-specific password
    }
});

/* router.post('/forgotPassword', (req, res) => {
    const user = req.body;
    query = "select email,password from user where email=?";
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(200).json({ message: "Password sent successfully to your email." });
            }
            else {
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results[0].email,
                    subject: 'Password by Cafe Management System',
                    html: '<p><b>Your Login details for Cafe Management System</b><br><b>Email: </b>' + results[0].email + '<br><b>Password: </b>' + results[0].password + '<br><a href = "http://localhost:4200/">Click here to login</a></p>'
                };
                transporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                    }
                });
                return res.status(200).json({ message: "Password sent successfully to your email." });
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
}) */

//ForgotPassword Route
router.post('/forgotPassword', (req, res) => {
    const { email } = req.body;
    const query = "SELECT email FROM user WHERE email = ?";

    connection.query(query, [email], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length <= 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a secure token for password reset
        const resetToken = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

        // Save the token to the database or cache (e.g., Redis)
        // Optional: This can also be done without saving by verifying JWT token directly in reset endpoint

        const resetLink = `http://localhost:4200/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset Request for Cafe Management System',
            html: `<p><b>Password Reset Request</b><br>
                   <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
                   <a href="${resetLink}">Reset Password</a></p>`
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: "Error sending reset email" });
            }
            console.log('Email sent:', info.response);
            return res.status(200).json({ message: "Password reset email sent successfully" });
        });
    });
});

// Route to retrieve users with the role 'user'
router.get('/get', auth.authenticateToken, checkRole.checkRole, (res) => {
    const getUsersQuery = `
        SELECT id, name, email, contactNumber, status 
        FROM user 
        WHERE role = 'user'
    `;

    connection.query(getUsersQuery, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "An error occurred while retrieving users",
                error: err.message
            });
        }

        return res.status(200).json(results);
    });
});

// Route to update a user's status using their role and ID
router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const { status, id } = req.body;

    // Input validation
    if (!status || !id) {
        return res.status(400).json({ message: "Status and User ID are required" });
    }

    const updateUserStatus = "UPDATE user SET status = ? WHERE id = ?";

    connection.query(updateUserStatus, [status, id], (err, results) => {
        if (err) {
            // Provide detailed error for internal debugging but not expose all details to the client
            return res.status(500).json({
                message: "An error occurred while updating the user",
                error: err.message
            });
        }

        // Handle case where no rows were affected (user doesn't exist)
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "User ID does not exist" });
        }

        // Successful update response
        return res.status(200).json({ message: "User updated successfully" });
    });
});

// Route to checkToken
router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" });
});

/* router.post('/changePassword', auth.authenticateToken, (req, res) => {
    const user = req.body;
    const email = res.locals.email;
    var query = "select *from user where email = ? and password = ?";
    connection.query(query, [email, user.oldPassword], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(400).json({ message: "Incorrect Old Password" });
            }
            else if (results[0].password == user.oldPassword) {
                query = "update user set password = ? where email = ?";
                connection.query(query, [user.newPassword, email], (err, results) => {
                    if (!err) {
                        return res.status(200).json({ message: "Password Updated Successfully" });
                    }
                    else {
                        return res.status(500).json(err);
                    }
                });
            }
            else {
                return res.status(400).json({ message: "Something went wrong. Please try again later" })
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
}) */

//ChangePassword Route
router.post('/changePassword', auth.authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const email = res.locals.email;

    try {
        // Query to check if the old password matches
        const [results] = await connection.promise().query("SELECT * FROM user WHERE email = ? AND password = ?", [email, oldPassword]);

        if (results.length === 0) {
            return res.status(400).json({ message: "Incorrect Old Password" });
        }

        // Update the user's password
        await connection.promise().query("UPDATE user SET password = ? WHERE email = ?", [newPassword, email]);

        return res.status(200).json({ message: "Password Updated Successfully" });
    } catch (error) {
        console.error("Database error: ", error);
        return res.status(500).json({
            message: "An error occurred while changing the password",
            error: err.message
        });
    }
});

module.exports = router;
