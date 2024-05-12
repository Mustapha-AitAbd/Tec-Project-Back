const express = require("express")
const {addRole,getPrivileges,getRoles,modifyRole,deleteRole,getRole} = require("../Controllers/roleController")
const jwt = require("jsonwebtoken")
const router = express.Router()

// router.post("/create",checkToken("createRent") ,createRent)
router.post("/create",addRole)
router.post("/delete",deleteRole)
router.post("/modify",modifyRole)
router.post("/details",getRole)
router.post("/privs",getPrivileges)
router.post("/",getRoles)

function checkToken(privl){

    return function (req,res,next){
        const token = req.headers["authorization"]
        if(token == null) {return res.status(401).send({message:"No token sent"})}
        
        jwt.verify(token, process.env.ATS,(err,user)=>{
            if(err) return res.status(403).send("Invalid token")
            if(user.role.privileges.includes(privl) || user.privileges.includes("Admin")){
                req.user=user
                next()
            }else{
                res.status(403).send("Lacking Privilege")
            }
        })
    }
}

module.exports = router