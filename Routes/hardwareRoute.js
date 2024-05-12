const express = require("express")
const controller = "../Controllers/hardwareController"
const {createHardware,deleteHardware,modifyHardware,getHardware,getHardwares} = require(controller)

const router = express.Router()

router.post("/create", createHardware)
router.post("/delete",deleteHardware)
router.post("/modify",modifyHardware)
router.post("/details",getHardware)
router.post("/",getHardwares)

module.exports = router