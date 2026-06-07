const express = require("express");

const router = express.Router();

const auth = require(
    "../middleware/auth.middleware"
);

const transferController =
    require(
        "../controllers/transfer.controller"
    );

router.post(
    "/",
    auth,
    transferController.transfer
);

module.exports = router;