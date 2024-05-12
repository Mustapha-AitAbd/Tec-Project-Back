const express = require("express")
const {createTrip,deleteTrip,modifyTrip,getTrip,getTrips,addCoords2Trip,verifyTrip} = require("../Controllers/tripController")

const router = express.Router()

router.post("/create", createTrip)
router.post("/delete",deleteTrip)
router.post("/modify",modifyTrip)
router.post("/details",getTrip)
router.post("/",getTrips)
router.post("/addCoords",addCoords2Trip)
router.post("/verify",verifyTrip)

module.exports = router