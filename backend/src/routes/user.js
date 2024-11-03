const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

router.post("/", userController.createOrUpdateUser);
router.put("/custom-url", authMiddleware, userController.updateCustomUrl);

module.exports = router;
