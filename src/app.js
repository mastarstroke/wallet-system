const express = require('express');
const app = express();

const authRoutes = require("./routes/auth.routes");
const walletRoutes = require("./routes/wallet.routes");
const transactionRoutes = require("./routes/transaction.routes");


app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Wallet API Running'
    });
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);

module.exports = app;