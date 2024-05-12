const express = require("express")
const {createRent,deleteRent,modifyRent,getRent,getRents} = require("../Controllers/rentController")
const jwt = require("jsonwebtoken")
const router = express.Router()

// router.post("/create",checkToken("createRent") ,createRent)
router.post("/create",createRent)
router.post("/delete",deleteRent)
router.post("/modify",modifyRent)
router.post("/details",getRent)
router.post("/",getRents)

function checkToken(privl){

    return function (req,res,next){
        const token = req.headers["authorization"]
        if(token == null) {return res.status(401).send({message:"No token sent"})}
        
        jwt.verify(token, process.env.ATS,(err,user)=>{
            if(err) return res.status(403).send("Invalid token")
            if(user.privileges.includes(privl) || user.privileges.includes("Admin")){
                req.user=user
                next()
            }else{
                res.status(403).send("Lacking Privilege")
            }
        })
    }
}

module.exports = router