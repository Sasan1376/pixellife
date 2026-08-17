const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { protect } = require("../middleware/authMiddleware");
const {
  createAddressValidator,
  updateAddressValidator,
  validate,
} = require("../validators/addressValidator");

router.use(protect);

router.get("/", addressController.listAddresses);
router.post(
  "/",
  createAddressValidator,
  validate,
  addressController.createAddress,
);
router.put(
  "/:id",
  updateAddressValidator,
  validate,
  addressController.updateAddress,
);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
