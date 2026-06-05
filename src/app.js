const express = require('express');
const app = express();

const authRoutes = require(
  "./routes/auth.routes"
);

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Wallet API Running'
    });
});

app.use("/api/auth", authRoutes);

module.exports = app;