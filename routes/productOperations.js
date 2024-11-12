/* const express = require('express');
const connection = require('../connection');
const uuid = require('uuid');
const fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');
const auth = require('../services/authentication');
const path = require('path'); // Importing the path module

const router = express.Router();

router.post('/generateReport', auth.authenticateToken, (req, res) => {
    const generatedUuid = uuid.v4();
    const orderDetails = req.body;
    const productDetailsReport = JSON.parse(orderDetails.productDetails);

    // Debugging log for productDetails
    console.log("Received productDetails: ", productDetailsReport);

    const query = "INSERT INTO productOperations (name, uuid, email, contactNumber, paymentMethod, total, productDetails, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    connection.query(query, [orderDetails.name, generatedUuid, orderDetails.email, orderDetails.contactNumber, orderDetails.paymentMethod, orderDetails.totalAmount, orderDetails.productDetails, res.locals.email], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({
                message: "An error occurred while generating report",
                error: err.message
            });
        }

        ejs.renderFile(path.join(__dirname, '', "productReport.ejs"), { productDetails: productDetailsReport, name: orderDetails.name, email: orderDetails.email, contactNumber: orderDetails.contactNumber, paymentMethod: orderDetails.paymentMethod, totalAmount: orderDetails.totalAmount }, (err, results) => {
            if (err) {
                console.log("Template rendering error:", err);
                return res.status(500).json({
                    message: "Failed to generate report.",
                    error: err.message
                });
            }

            pdf.create(results).toFile('./reports_pdf/'+generatedUuid+".pdf", (err) =>{
                if (err) {
                    console.log("PDF creation error:", err);
                    return res.status(500).json({
                        message: "Failed to generate PDF.",
                        error: err.message
                    });
                }

                return res.status(200).json({
                    message: "Report generated successfully.",
                    uuid: generatedUuid 
                });
            });
        });
    });
}); */

const express = require('express');
const connection = require('../connection');
const uuid = require('uuid');
const fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');
const auth = require('../services/authentication');
const path = require('path');

const router = express.Router();

// Constant file paths
const PDF_DIRECTORY = './reports_pdf/';
const EJS_TEMPLATE = path.join(__dirname, '', "productReport.ejs");

router.post('/generateReport', auth.authenticateToken, (req, res) => {
    const generatedUuid = uuid.v4();
    const { name, email, contactNumber, paymentMethod, totalAmount, productDetails: productDetailsJSON } = req.body;

    const productDetails = JSON.parse(productDetailsJSON);

    const query = `
        INSERT INTO productOperations 
        (name, uuid, email, contactNumber, paymentMethod, total, productDetails, createdBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const queryValues = [name, generatedUuid, email, contactNumber, paymentMethod, totalAmount, productDetailsJSON, res.locals.email];

    // Execute query to store report details in the database
    connection.query(query, queryValues, (err) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                message: "An error occurred while saving report details.",
                error: err.message
            });
        }

        // Generate PDF report from the EJS template
        generatePDFReport({ productDetails, name, email, contactNumber, paymentMethod, totalAmount }, generatedUuid, res);
    });
});

// Function to generate PDF report
function generatePDFReport(reportData, generatedUuid, res) {
    ejs.renderFile(EJS_TEMPLATE, reportData, (err, renderedHtml) => {
        if (err) {
            console.error("Template rendering error:", err);
            return res.status(500).json({
                message: "Failed to generate report.",
                error: err.message
            });
        }

        // Save PDF to file
        const pdfFilePath = path.join(PDF_DIRECTORY, `${generatedUuid}.pdf`);
        pdf.create(renderedHtml).toFile(pdfFilePath, (err) => {
            if (err) {
                console.error("PDF creation error:", err);
                return res.status(500).json({
                    message: "Failed to generate PDF.",
                    error: err.message
                });
            }

            // Respond with success message and UUID
            return res.status(200).json({
                message: "Report generated successfully.",
                uuid: generatedUuid
            });
        });
    });
}

router.post('/getPdf', auth.authenticateToken, (req, res) => {
    const { uuid, productDetailsJSON, name, email, contactNumber, paymentMethod, totalAmount } = req.body;
    const pdfFilePath = path.join(PDF_DIRECTORY, `${uuid}.pdf`);

    // Check if PDF already exists
    if (fs.existsSync(pdfFilePath)) {
        res.contentType("application/pdf");
        return fs.createReadStream(pdfFilePath).pipe(res);
    }

    // Parse product details from JSON
    const productDetails = JSON.parse(productDetailsJSON);

    // Render EJS template
    ejs.renderFile(EJS_TEMPLATE, { productDetails, name, email, contactNumber, paymentMethod, totalAmount }, (err, renderedHtml) => {
        if (err) {
            console.error("Template rendering error:", err);
            return res.status(500).json({
                message: "Failed to generate report.",
                error: err.message
            });
        }

        // Generate and save PDF
        pdf.create(renderedHtml).toFile(pdfFilePath, (err) => {
            if (err) {
                console.error("PDF creation error:", err);
                return res.status(500).json({
                    message: "Failed to generate PDF.",
                    error: err.message
                });
            }

            // Stream the newly generated PDF file to the client
            res.contentType("application/pdf");
            fs.createReadStream(pdfFilePath).pipe(res);
        });
    });
});

// Get Product report (Fetches Product report information)
router.get('/getProductOperations', (res) => {

    const query = "SELECT * FROM productOperations order by id desc"; // Sample query for fetching productOperations

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "An error occurred while fetching productOperations." });
        }

        return res.status(200).json(results);
    });
});

// Delete Product report (Deletes a report by its ID)
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM productOperations WHERE id = ?";

    connection.query(query, [id], (err, results) => {
        if (err) {
            console.error("Database error during deletion:", err);
            return res.status(500).json({
                message: "An error occurred while attempting to delete the product report.",
                error: err.message
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                message: "Product report with the specified ID was not found."
            });
        }

        return res.status(200).json({
            message: "Product report deleted successfully."
        });
    });
});

module.exports = router;
