const express = require("express")
const {createHardwareProvider,deleteHardwareProvider,modifyHardwareProvider,getHardwareProvider,getHardwareProviders} = require("../Controllers/hardwareProviderController")

const router = express.Router()

router.post("/create", createHardwareProvider)
router.post("/delete",deleteHardwareProvider)
router.post("/modify",modifyHardwareProvider)
router.post("/details",getHardwareProvider)
router.post("/",getHardwareProviders)

module.exports = router