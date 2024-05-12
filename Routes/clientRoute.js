const express = require("express")
const {getFactures,getClient,changePayementType,addPaymentMethod,changePasswordWithPin,forgotPassword,activateAccount,createClient,deleteClient,modifyClient,changePassword,clientPaymentDetails,getClients,chargeClient,authClient,payForPackage,getVehiculesAndZonesGuest} = require("../Controllers/clientController")




const router = express.Router()

router.post("/",getClients)
router.post("/create", createClient)
router.post("/charge",chargeClient)
router.post("/modify",modifyClient)
router.post("/delete",deleteClient)
router.post("/details",getClient)
router.post("/paymentDetails",clientPaymentDetails)
router.post("/auth",authClient)
router.post("/credits",payForPackage)
router.post("/guest",getVehiculesAndZonesGuest)
router.post("/changePass",changePassword)
router.post("/forgot",forgotPassword)
router.post("/addPaymentMethod",addPaymentMethod)
router.post("/changePassWithPin",changePasswordWithPin)
router.post("/changePayementType",changePayementType)
router.post("/facture",getFactures)
router.get("/activate",activateAccount)

module.exports = router


// {
//     "_id": 1,
//     "idType": "6434553cae4bfa067382eb94",
//     "bikeStatus": "inactive",
//     "batteryLevel": 100,
//     "lastParking": "643c3f564cfb546c32255a3b",
//     "isClean": true,
//     "licensePlate": "ABC-DEF-1",
//     "lastUser": null,
//     "lastUsedDate": {
//       "$date": {
//         "$numberLong": "1682339395464"
//       }
//     },
//     "city": "Marrakech",
//     "__v": 0,
//     "hardware": 350544507645730,
//     "lastCoords": {
//       "longitude": 31.5392716,
//       "latitude": -7.9756683
//     }
//   }