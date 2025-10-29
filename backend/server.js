const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', require('./routes/chat'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Complete Solution Backend is running!' });
});

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Complete Solution Backend is running!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Complete Solution Backend Ready!`);
});
