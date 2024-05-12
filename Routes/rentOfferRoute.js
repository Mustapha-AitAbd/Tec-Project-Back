const express = require("express")
const {createRentOffer,deleteRentOffer,modifyRentOffer,getRentOffer,getRentOffers} = require("../Controllers/rentOfferController")

const router = express.Router()

router.post("/create", createRentOffer)
router.post("/delete",deleteRentOffer)
router.post("/modify",modifyRentOffer)
router.post("/details",getRentOffer)
router.post("/",getRentOffers)

module.exports = router