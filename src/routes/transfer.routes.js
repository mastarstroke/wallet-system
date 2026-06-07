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

router.post(
    "/:reference/reverse",
    auth,
    transferController.reverse
);

module.exports = router;