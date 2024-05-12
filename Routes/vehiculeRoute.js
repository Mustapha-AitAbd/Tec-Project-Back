const express = require("express")
const {adminAction,createVehicule,deleteVehicule,modifyVehicule,modifyVehiculeByImei,getVehicule,getVehicules,applyAction,trackVehicule} = require("../Controllers/vehiculeController")

const router = express.Router()

router.post("/create", createVehicule)
router.post("/delete",deleteVehicule)
router.post("/modify",modifyVehicule)
router.post("/modifybyimei",modifyVehiculeByImei)
router.post("/details",getVehicule)
router.post("/",getVehicules)
router.post("/action",applyAction)
router.post("/track",trackVehicule)
router.post("/adminAction",adminAction)

module.exports = router