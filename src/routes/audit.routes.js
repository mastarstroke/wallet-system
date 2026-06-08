const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth.middleware");

const auditController = require(
    "../controllers/audit.controller"
);

router.get(
    "/",
    auth,
    auditController.index
);

module.exports = router;