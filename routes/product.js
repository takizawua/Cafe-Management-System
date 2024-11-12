const express = require('express');
const connection = require('../connection');
const router = express.Router();

const auth = require('../services/authentication');
const checkRole = require('../services/checkRole');

// Route to add a new product
router.post('/add', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const { name, categoryId, description, price } = req.body;

    // Input validation
    if (!name || !categoryId || !description || price === undefined) {
        return res.status(400).json({ message: "All fields (name, categoryId, description, price) are required." });
    }

    // Query to add product details
    const addProductQuery = "insert into product (name, categoryId, description, price, status) values(?,?,?,?, 'true')";

    connection.query(addProductQuery, [name, categoryId, description, price], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occurred while adding product",
                error: err.message
            });
        }

        // Successful response
        return res.status(201).json({ message: "Product added successfully"});
    })
})

// Route to get all products with their associated category names
router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    
    // Query to fetch product details along with their associated category names using an INNER JOIN on categoryId.
    const query = `
        SELECT p.id, p.name, p.description, p.price, p.status, 
               c.id as categoryId, c.name as categoryName 
        FROM product AS p 
        INNER JOIN category AS c 
        ON p.categoryId = c.id`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occurred while fetching products",
                error: err.message
            });
        }

        // Check if there are no products returned
        if (results.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        // Successful response with products data
        return res.status(200).json(results);
    });
});

// Route to get products by category ID
router.get('/getByCategory/:id', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const categoryid = req.params.id;

    // Query to select products by category ID and status
    const fetchProductQuery = "select id, name from product where categoryId = ? and status = 'true'";

    connection.query(fetchProductQuery, [categoryid], (err, results) => {
        if (err) {
            console.error("Database error: ", err)
            return res.status(500).json({
                message: "An error occurred while fetching categoryId",
                error: err.message
            })
        }

        // Check if no products are found for the given category ID
        if (results.length === 0) {
            return res.status(404).json({ message: "No products found for the specified category ID." });
        }

        // Successful response with products data
        return res.status(200).json(results);
    })
})

// Route to get product details using ID
router.get('/getById/:id', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const productId = req.params.id;

    // Query to fetch product details by ID
    const fetchProductQuery = "SELECT id, name, description, price FROM product WHERE id = ?";

    connection.query(fetchProductQuery, [productId], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occurred while fetching the product",
                error: err.message
            });
        }

        // Check if product ID exists
        if (results.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Successful response with product details
        return res.status(200).json(results[0]);
    })
})

// Route to update product details
router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const { name, categoryId, description, price, id } = req.body

    // Query to update product details
    const updateProductQuery = "update product set name = ?, categoryId =?, description = ?, price = ? where id = ?";

    connection.query(updateProductQuery, [name, categoryId, description, price, id], (err, results) => {
        if (err) {
            console.log("Database: error ", err);
            return res.status(500).json({
                message: "An error occured when updating the product",
                error: err.message
            })
        }

        // Check if Product ID exists
        if (results.affectedRows === 0) {
            return res.status(404).json({message: "Product ID not found"})
        }

        // Successful response
        return res.status(200).json({ message: "Product Updated Successfully" })
    })
})

// Route to delete product details using ID
router.delete('/delete/:id', auth.authenticateToken, checkRole.checkRole, (req,res) => {
    const productId = req.params.id;

    // Query to delete product by ID
    const deleteProductQuery = "delete from product where id = ?";

    connection.query(deleteProductQuery, [productId], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An erorr occured while deleting product",
                error: err.message
            });
        }

        // Check if the product exists
        if (results.affectedRows == 0) {
            return res.status(404).json({message: "Product does not found"});
        }

        // Successful response
        return res.status(200).json({message: "Product Deleted Successfully"});
    })
})

// Route to update status using product ID
router.patch('/updateStatus', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    const { status, id } = req.body;

    // Input validation
    if (!status || !id) {
        return res.status(400).json({ message: "Status and ID are required" });
    }

    // Query to update product status by ID
    const updateProductQuery = "update product set status = ? where id = ?";

    connection.query(updateProductQuery, [status, id], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occured when updating product status",
                error: err.message
            });
        }

        // Check if the product exists
        if (results.affectedRows == 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Successful response
        return res.status(200).json({ message: "Product status updated successfully" });
    })
})

module.exports = router;