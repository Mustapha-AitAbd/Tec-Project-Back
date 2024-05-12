const express = require("express")
const {createVehiculeType,deleteVehiculeType,modifyVehiculeType,getVehiculeType,getVehiculeTypes} = require("../Controllers/vehiculeTypeController")

const router = express.Router()

router.post("/",getVehiculeTypes)
router.post("/create", createVehiculeType)
router.post("/details",getVehiculeType)
router.post("/modify",modifyVehiculeType)
router.post("/delete",deleteVehiculeType)

module.exports = router