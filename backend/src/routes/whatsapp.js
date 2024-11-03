const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, whatsappController.addNumber);
router.get("/", authMiddleware, whatsappController.getNumbers);
router.put("/:numberId/toggle", authMiddleware, whatsappController.toggleNumberStatus);
router.delete("/:numberId", authMiddleware, whatsappController.deleteNumber);

module.exports = router;
