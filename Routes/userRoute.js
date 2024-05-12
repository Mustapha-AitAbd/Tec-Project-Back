const express = require("express")
const {dateSearchPayment,createUser,deleteUser,modifyUser,getUser,getUsers,authUser,getClientPayments,getAllPayments} = require("../Controllers/userController")
const jwt = require("jsonwebtoken")
const {getFactures,processAllFactures,processFacture,printFacture} = require("../Controllers/factureController")
const router = express.Router()

// router.post("/",getUsers)
router.post("/",getUsers)
router.post("/create", createUser)
router.post("/details",getUser)
router.post("/modify",modifyUser)
router.post("/delete",deleteUser)
router.post("/auth",authUser)
router.post("/searchPayment",dateSearchPayment)
router.post("/payment",getClientPayments)
router.post("/payments",checkToken('Get Payments'),getAllPayments)
router.post("/factures",getFactures)
router.post("/processFacture",processFacture)
router.post("/processAllFactures",processAllFactures)
router.get("/printFacture/:id",printFacture)


function checkToken(privl){

    return function (req,res,next){
        const token = req.headers["authorization"]
        if(token == null) return res.status(401).send("No token sent")
        
        jwt.verify(token, process.env.ATS,(err,user)=>{
            console.log(user.role.privileges)
            if(err) return res.status(403).send("Invalid token")
            if(user.role.privileges.includes(privl)){
                req.user=user
                // console.log("connection permitted")
                next()
            }else{
                res.status(403).send("Lacking Privilege")
            }
        })
    }
}
module.exports = router