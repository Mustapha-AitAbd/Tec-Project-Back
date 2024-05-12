const express = require("express")
const {createSupport,deleteSupport,modifySupport,getSupport} = require("../Controllers/supportController")

const router = express.Router()

router.post("/create", createSupport)
router.post("/delete",deleteSupport)
router.post("/modify",modifySupport)
router.post("/",getSupport)

module.exports = router