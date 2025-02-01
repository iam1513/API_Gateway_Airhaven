const express = require("express");
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const axios = require("axios");
const cors = require('cors');
const app = express();

const PORT = 3004;

// Enable CORS for all origins
app.use(cors());

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 10 // Increased the limit for testing
});

app.use(morgan('combined'));
app.use(limiter);

// Authentication middleware
app.use('/bookingservice', async (req, res, next) => {
    console.log("Request headers:", req.headers);  // Logging all headers for debugging
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const response = await axios.get('http://localhost:3001/api/v1/isauthenticated', {
            headers: {
                'x-access-token': token
            }
        });

        if (response.data.success) {
            next();
        } else {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
});

// Proxy middleware for /bookingservice route
app.use('/bookingservice', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));

// Home route
app.get("/home", (req, res) => {
    return res.json({
        msg: "ok"
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server up and running on port ${PORT}`);
});
