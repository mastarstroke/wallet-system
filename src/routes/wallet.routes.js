const express = require("express");

const router = express.Router();

const auth = require(
    "../middleware/auth.middleware"
);

const walletController = require(
    "../controllers/wallet.controller"
);

router.get(
    "/",
    auth,
    walletController.getBalance
);

module.exports = router;