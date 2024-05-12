const express = require("express")
const {createPackage,deletePackage,modifyPackage,getPackage,getPackages} = require("../Controllers/packageController")

const router = express.Router()

router.post("/create", createPackage)
router.post("/delete",deletePackage)
router.post("/modify",modifyPackage)
router.post("/details",getPackage)
router.post("/",getPackages)

module.exports = router