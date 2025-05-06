const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", verifyToken, adminController.register);
router.post("/login", adminController.login);
router.post("/startGame", adminController.startGame);

module.exports = router;
