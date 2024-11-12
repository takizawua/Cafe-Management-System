const express = require('express');
const connection = require('../connection');
const router = express.Router();

var auth = require('../services/authentication');
var checkrole = require('../services/checkRole');

// Route to add a new category
router.post('/add', auth.authenticateToken, checkrole.checkRole, (req, res) => {
    const { name } = req.body;

    // Query to insert new category
    const insertCategoryQuery = "INSERT INTO category (name) VALUES (?)";

    connection.query(insertCategoryQuery, [name], (err, results) => {
        if (err) {
            console.error("Database error: ", err); //Log error
            return res.status(500).json({
                message: "An error occurred while adding the category.",
                error: err.message
            });
        }
        
        // Successful response
        return res.status(200).json({ message: "Category added successfully" });
    })
})

// Route to get all categories, ordered by name
router.get('/get', auth.authenticateToken, (req, res) => {

    // Query to select all categories ordered by name
    const fetchCategoriesQuery  = "SELECT * FROM category ORDER BY name";

    // Execute a query to fetch categories 
    connection.query(fetchCategoriesQuery , (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occurred while fetching categories.",
                error: err.message
            });
        }

        // Check if any categories exist
        if (results.length === 0) {
            return res.status(404).json({ message: "No categories found." });
        }

        // Successful response with categories data
        return res.status(200).json(results);
    })
})

// Route to update category name by ID
router.patch('/update', auth.authenticateToken, checkrole.checkRole, (req, res) => {
    const { name, id } = req.body;

    // Query to update category name by ID
    const updateCategoryNameQuery = "update category set name = ? where id = ?";

    // Execute a query to update the category name based on the provided ID
    connection.query(updateCategoryNameQuery, [name, id], (err, results) => {
        if (err){
            console.error("Database error: ", err); 
            return res.status(500).json({
                message: "An error occurred while updating the category.",
                error: err.message
            })
        }
        
        // Check if category ID exists
        if (results.affectedRows == 0){
            return res.status(404).json({message: "Category id not found"});
        }

        // Successful response
        return res.status(200).json({message: "Category Updated Successfully"})
    })
})

module.exports = router;