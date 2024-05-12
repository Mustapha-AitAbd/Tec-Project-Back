const client = require("../Models/Client")
const vehicule = require("../Models/Vehicule")
const vehiculeType = require("../Models/VehiculeType")
const zone = require("../Models/Zone")
const package = require("../Models/Package")
const Trip = require("../Models/Trip")
const Facture = require("../Models/Facture")
const Support = require("../Models/Support")
const {sendEmail} = require("./emailController")

const jwt = require("jsonwebtoken")
const {createHash} = require("crypto")
const fs = require("fs")
const path = require("path")
const { addTripToFacture } = require("./factureController")

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'.env'})
}

const stripe = require("stripe")(process.env.SSK)

async function createClient(req,res){
    try{
        if(await client.findOne({email:req.body.email.toLowerCase()})){
            res.status(400).send({error:"email"})
        }else if(await client.findOne({username:req.body.username})){
            res.status(400).send({error:"username"})
        }
        else{
            const customer = await stripe.customers.create({
                email:req.body.email.toLowerCase(),
                description: `(${req.body.username}) `+req.body.nom+" "+req.body.prenom,
            });
            let newClient = {
                nom:req.body.nom,
                prenom:req.body.prenom,
                email:req.body.email.toLowerCase(),
                password:encrypt(req.body.password),
                username:req.body.username,
                customerId:customer.id,
                city:req.body.city,
                language:req.body.language,
                phoneNumber:req.body.phoneNumber,
            }
            let c = await client.create(newClient)
            console.log("Client created: ",c.username,c.email)
            //await sendEmail(c.username,c._id,c.email,null)
            //console.log("Email sent to:",c.email)
            /*const ephemeralKey = await stripe.ephemeralKeys.create(
                {customer: customer.id},
                {apiVersion: '2020-08-27'},
              );
            const setupIntent = await stripe.setupIntents.create(
              {customer: customer.id, payment_method_types:["card"]},
            );
            console.log({
                setupIntent: setupIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: customer.id,
              })
            res.send({
                setupIntent: setupIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: customer.id,
              })*/
        }
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
}
async function addPaymentMethod(req,res){
    try{
        if(!req.body.customerId){
            res.status(400).send({error:"No customerId was entered"})
            return;
        }
        const ephemeralKey = await stripe.ephemeralKeys.create(
            {customer: req.body.customerId},
            {apiVersion: '2020-08-27'},
          );
        const setupIntent = await stripe.setupIntents.create(
          {customer: req.body.customerId, payment_method_types:["card"]},
        );
        res.send({
            setupIntent: setupIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: req.body.customerId,
          })
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function deleteClient(req,res){
    try{
        let c = await client.findById(req.body.id)
        if(!c){
            res.send({message:"Customer not deleted"})
        }
        let deleted = await stripe.customers.del(c.customerId)
        if(deleted["deleted"]==true){
            await client.findByIdAndDelete(req.body.id)
            res.send(deleted)
        }else{
            res.status(500).send({message:"Customer not deleted"})
        }
    }catch(e){
        res.status(500).send({message:"Error deleting the customer"})
    }
}
async function modifyClient(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        if(newData.password){
            newData.password = encrypt(newData.password)
        }
        let check = await client.findOne({username:newData.username})
        if(check && req.body.id!=check._id){
            res.status(400).send({message:"Username already exists"})
        }
        if(newData._id){ delete newData._id}
        let customer = await client.findByIdAndUpdate(req.body.id,newData)
        res.send({message:"Client modified"})
    }catch(e){
        res.status(500).send({message:"Error"})
    }
}

async function getClient(req,res){
    try{
        let customer = await client.findById(req.body.id)
        res.send(customer)
    }catch(e){
        console.log(e)
        res.status(404).send({message:"Server error"})
    }
}
async function getClients(req,res){
    try{
        let filter = {}
        if(req.body.filter){
            filter = req.body.filter
        }
        for(let key in filter){
            if(filter[key]["including"]){
                if(!isNaN(filter[key]["including"])){
                    filter[key] = Number(filter[key]["including"]);
                } else {
                    filter[key] = {'$regex': new RegExp(filter[key]["including"], 'i')};
                }
            }
        }
        let customers = await client.find(filter)
        res.send(customers)
    }catch(e){
        console.log(e)
        res.status(400).send("Request error")
    }
}
async function clientPaymentDetails(req,res){
    try{
        if(!req.body.customerId){
            res.status(400).send({message:"No customerId was sent"})
            return;
        }
        const client = await stripe.customers.listPaymentMethods(req.body.customerId)
        res.send(client)
    }catch(e){
        res.status(404).send({code:e["code"],message:e["raw"]["message"]})
    }
}
async function chargeClient(req,res){
    try{
        let customer = await client.findOne({_id:req.body.id})
        if(customer){
            // if(req.body.method=="points"){
                let solde = customer["solde"]
                if(solde >= req.body.amount){
                    customer = await client.findByIdAndUpdate(req.body.id,{$inc:{solde:-req.body.amount}},{new: true }) 
                    res.send(customer)
                }else{
            //         res.status(400).send("Insufficient solde")
            //     }
            // }else if(req.body.method=="instant"){
                const charge = await stripe.paymentIntents.create({
                amount: req.body.amount*100,//amount in centimes
                currency: 'mad',
                customer: customer["customerId"],
                description: 'Charging the customer for their trip',
                confirm:true,
                payment_method:customer["currentPayingMethodId"],
                });
                if(charge["status"]=="failed"){
                    await client.findOneAndUpdate({_id:customer.id}, {accountBanned:true})
                }
                res.send({status:charge["status"],secret:charge.client_secret})
            }
        }else{
            res.send("Customer doesn't exist")
        }
    }catch(e){
        res.status(400).send("Request error")
    }
}
async function changePayementType(req,res){
    try{
        console.log(req.body)
        if(!req.body.id || !req.body.payementType){
            res.status(400).send("Missing parameters")
            return;
        }
        let customer = await client.findById(req.body.id)
        if(customer){
            customer.payementType = req.body.payementType
            customer.save()
            res.send(customer)
        }else{
            res.status(404).send("Client doesn't exist")
        }
    }catch(e){
        console.log(e);
        res.status(500).send(e)
    }
}
async function getFactures(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("No client id was sent")
            return
        }
        let factures = await Facture.find({client:req.body.id,
            $or:[{payementStatus:"Pending",totalcost:{$gt:40}},{payementStatus:{$ne:"Pending"}}]}).populate("trips").lean()
        res.send(factures)
    }catch(e){
        console.log(e.message)
        res.status(500).send('Server Error')
    }
}
async function chargeCustomerAfterTrip(clientId,amount,trip){
    let r ={}
    try{
        let customer = await client.findOne({_id:clientId})
        if(customer){
            console.log(`Customer ${customer.username}'s payementType is ${customer.payementType}`)
            if(customer.payementType=="solde"){
                let solde = customer["solde"]
                if(solde >= amount){
                    customer = await client.findByIdAndUpdate(clientId,{$inc:{solde:-amount}},{new: true })
                    r["status"] = "succeeded"
                }else{
                    customer = await client.findByIdAndUpdate(clientId,{accountBanned:true},{new: true })
                    r["status"] = "failed"
                }
                r["customer"]=customer
            }else if(customer.payementType=="card"){
                let facture = await addTripToFacture(trip,clientId)
                let trips = facture.trips
                console.log(trips)
                let factureLimit = (await Support.find().lean())[0].factureLimit
                if(!facture.error && facture.totalcost>factureLimit){
                    console.log(`Exceeded minimum bill payement amount ${factureLimit}, processing payement`)
                    const list = await stripe.customers.listPaymentMethods(customer["customerId"])
                    const charge = await stripe.paymentIntents.create({
                        amount: facture.totalcost*100,//amount in centimes
                        currency: 'mad',
                        customer: customer["customerId"],
                        description: 'Bill for accumulated trips',
                        confirm:true,
                        payment_method:list["data"][0]["id"],
                        metadata:{
                            factureId:facture._id
                        }
                    });
                    if(charge["status"]=="failed"){
                        customer = await client.findOneAndUpdate({_id:customer.id}, {accountBanned:true},{new: true })
                        r["secret"]=charge.client_secret
                        await Trip.updateMany({_id:{$in:trips}},{paymentStatus:"Failed"})
                        await Facture.findByIdAndUpdate(facture._id,{payementStatus:"Incomplete"})
                    }else{
                        await Trip.updateMany({_id:{$in:trips}},{paymentStatus:"Succeeded"})
                        await Facture.findByIdAndUpdate(facture._id,{payementStatus:"Passed"})
                    }
                    console.log("Payement processed")
                    r["status"]=charge["status"]
                    // console.log(clientId,amount,charge)
                }else{
                    r["status"] = "failed"
                }
            }
        }else{
            r["error"]="Customer doesn't exist"
        }
    }catch(e){
        r["error"]="Request error"
    }
    return r
}

async function authClient(req,res){
    try{
        let credentials = {password:req.body.password,username:req.body.username}
        if(credentials["password"] && credentials["username"]){
            credentials["password"]= encrypt(credentials["password"])
            let thisClient = await client.findOne(credentials)
            if(thisClient){
                const paymentMethods = await stripe.customers.listPaymentMethods(
                    thisClient["customerId"],
                );
                let data = await getVehiculesAndZones(thisClient["_id"])
                if(paymentMethods["data"].length == 0){
                    data["isMissingCard"] = true
                }else{
                    data["isMissingCard"] = false
                }
                data["customer"]=thisClient
                res.send(data)
                // }else{
                //     res.status(400).send("Missing payment method")
                // }
            }else{
                credentials["email"]=req.body.username
                delete credentials["username"];
                let thisClient = await client.findOne(credentials)
                if(thisClient){
                const paymentMethods = await stripe.customers.listPaymentMethods(
                    thisClient["customerId"],
                );
                let data = await getVehiculesAndZones(thisClient["_id"])
                if(paymentMethods["data"].length == 0){
                    data["isMissingCard"] = true
                }else{
                    data["isMissingCard"] = false
                }
                data["customer"]=thisClient
                res.send(data)}
                else{
                res.status(404).send("Wrong credentials")
            }}
        }else{
            res.status(400).send("Missing credentials")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function getVehiculesAndZonesGuest(req,res){
    let data = await getVehiculesAndZones(null)
    let user = {privileges:"createRent"}
    let token = jwt.sign(user,process.env.ATS)
    data["token"] = token
    res.send(data)
}

async function getVehiculesAndZones(cliId){
    let _Support = (await Support.find())[0]
    let _Packages = await package.find()
    let _Parkings = await zone.find({zoneType:"Parking"}).lean()
    let _Cities = await zone.find({zoneType:"cityZone"})
    let _Vehicules = await vehicule.find({batteryLevel:{$gt:20}})
    let _VehiculeTypes = await vehiculeType.find()
    let _Trip=null
    if(cliId!=null){
        _Trip = await Trip.findOne({clientId:cliId,currentState:{$in:["Running","Paused"]}}).lean()
        if(_Trip){
            let v = await vehicule.findById(_Trip.vehiculeId).lean()
            _Trip["battery"] = 0//v.batteryLevel
            // console.log(_Trip)
        }
    }
    for(let p of _Parkings){
        let n = await vehicule.countDocuments({vehiculeStatus:"inactive",parking:p["_id"]})
        p["vehiculeCount"] = n 
    }
    //let trips
    return {
        support:_Support,
        parkings:_Parkings,
        cities:_Cities,
        packages:_Packages,
        vehicules:_Vehicules,
        vehiculeTypes:_VehiculeTypes,
        currentTrip:_Trip
    }
}

function encrypt(pass){
    const salt = "80zzm081sr@nd0m"
    return createHash("sha256").update(pass).update(createHash("sha256").update(salt, "utf8").digest("hex")).digest("hex")
}

async function payForPackage(req,res){
    try{
        let p = await package.findById(req.body.packageId)
        let customer = await client.findById(req.body.id)
        if(customer){
            const list = await stripe.customers.listPaymentMethods(customer["customerId"])
            const charge = await stripe.paymentIntents.create({
                amount: p["price"],
                currency: 'mad',
                customer: customer["customerId"],
                description: `Package ${p["packageName"]}, by customer ${customer["username"]}, credits ${p["creditsOffer"]}.`,
                confirm:true,
                payment_method:list["data"][0]["id"],
                metadata:{
                    type:"Package",
                    credits:p["creditsOffer"],
                    client:req.body.id,
                    clientUsername:customer.username,
                    clientFullName:customer.nom +" "+customer.prenom
                }
            });
            if(charge["status"]=="failed"){
                res.status(400).send("Payment failed")
            }
            res.send({status: charge["status"],client: customer})
    }}catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function changePassword(req,res){
    try{
        // console.log(req.body)
        if(req.body.email && req.body.oldPass && req.body.newPass && req.body.id ){

            let emailV = req.body.email.toLowerCase()
            let oldPass = req.body.oldPass
            let newPass = req.body.newPass
            let id = req.body.id
            let cli = await client.findOne({_id:id,email:emailV,password:encrypt(oldPass)})
            if(cli){
                await client.findByIdAndUpdate(id,{password:encrypt(newPass)})
                res.send({message:"Password modified"})
            }else{
                res.status(400).send({error:"Wrong credentials"})
            }
        }else{
            res.status(400).send({error:"Missing credentials"})
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function changePasswordWithPin(req,res){
    try{
        // console.log(req.body)
        if(req.body.email && req.body.newPass && req.body.pinCode ){
            let emailV = req.body.email.toLowerCase()
            let newPass = req.body.newPass
            let pinCode = req.body.pinCode
            let cli = await client.findOne({pinCode:pinCode,email:emailV})
            if(cli){
                await client.findByIdAndUpdate(cli._id,{password:encrypt(newPass)})
                res.send({message:"Password modified"})
            }else{
                res.status(400).send({error:"Wrong credentials"})
            }
        }else{
            res.status(400).send({error:"Missing credentials"})
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function activateAccount(req,res){
    try{
        if(req.query.id){
            if(await client.findById(req.query.id)){
                let c = await client.findByIdAndUpdate(req.query.id,{accountActivated:true},{new:true})
                let page = fs.readFileSync(path.join(__dirname+"/../private/accountVerified.html"),'utf8').replaceAll("${#EMAIL#}",c.email).replaceAll("${#USERNAME#}",c.username)
                res.send(page)
            }else{
                res.send("Client Id doesn't exist")
            }
        }else{
            res.send("Client Id required")
        }
    }catch(e){
        console.log(e)
        res.send({error:"Server error"})
    }
}
async function forgotPassword(req,res){
    try{
        if(req.body.email){
            let c = await client.findOne({email:req.body.email.toLowerCase()}) 
            if(c){
                let cod = generatePin()
                c.pinCode = cod
                await c.save()
                sendEmail(c.username,c._id,c.email,cod)
                res.send({code:cod,clientId:c._id})
                setTimeout(() => {
                    c.expirePinCode();
                  },6 * 60 * 60 * 1000); //6 hours
            }else{
                res.status(400).send("Client Email doesn't exist")
            }
        }else{
            res.send("Client Email required")
        }
    }catch(e){
        console.log(e)
        res.send({error:"Server error"})
    }
}
function generatePin(){
    let code = ""
    for(let i=0;i<6;i++){
        code+= ""+Math.floor(Math.random()*10)
    }
    return code
}

module.exports = {clientPaymentDetails,changePayementType,addPaymentMethod,changePasswordWithPin,forgotPassword,activateAccount,
    chargeCustomerAfterTrip,changePassword,createClient,deleteClient,modifyClient,getClient,getFactures,
    getClients,chargeClient,authClient,payForPackage,getVehiculesAndZonesGuest}