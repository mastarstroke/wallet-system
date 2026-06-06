const express = require("express");

const router = express.Router();

const auth = require(
    "../middleware/auth.middleware"
);

const transactionController = require(
    "../controllers/transaction.controller"
);

router.get(
    "/",
    auth,
    transactionController.index
);

router.get(
    "/:reference",
    auth,
    transactionController.show
);

module.exports = router;