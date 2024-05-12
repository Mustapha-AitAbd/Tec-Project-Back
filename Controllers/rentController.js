const Rent = require("../Models/Rent")
const RentOffer = require("../Models/RentOffer")
const client = require("../Models/Client")
async function createRent(req,res){
    try{
        let newRent = {
            address:req.body.address,
            clientId:req.body.clientId,
            phoneNumber:req.body.phone,
            pickupDate:req.body.pickupDate,
            returnDate:req.body.returnDate,
            amount:req.body.amount,
            email:req.body.email,
            rentOffer:req.body.rentOffer,
            orderType:req.body.orderType,
        }
        if(newRent.clientId=="" || newRent.clientId==null){
            newRent["fullName"]=req.body.fullName
        }
        let r = await Rent.create(newRent)
        let t = {}
        if(r){
            if(newRent.orderType=="instant"  && newRent.clientId!="" && newRent.clientId!=null){
                t = rentVehicules(r.clientId,r.rentOffer,r.pickupDate,r.returnDate)
            }else{
                t={message:"Rent created"}
            }
        }

        res.send(t)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteRent(req,res){
    try{
        await Rent.findOneAndDelete({_id:req.body.id})
        res.send("Rent deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyRent(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        await Rent.findByIdAndUpdate(req.body.id,newData)
        res.send("Rent modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getRent(req,res){
    try{
        let result = await Rent.findById(req.body.id).populate("clientId").populate("rentOffer")
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getRents(req,res){
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
        let RentsResult = (await Rent.find(filter).populate("clientId")).reverse()
        res.send(RentsResult)
    }catch(e){
        res.status(500).send(e)
    }
}
//add changing rent status here
async function rentVehicules(clientId,offerId,startDate,endDate){
    try{
        let o = await RentOffer.findById(offerId)
        let customer = await client.findById(clientId)
        let cost = o["prix"]*days_between(startDate,endDate)
        if(customer){
            let solde = customer["solde"]
                if(solde >= cost){
                    customer = await client.findByIdAndUpdate(clientId,{$inc:{solde:-cost}},{new: true }) 
                    r["customer"]=customer
                }else{

                    const list = await stripe.customers.listPaymentMethods(customer["customerId"])
            const charge = await stripe.paymentIntents.create({
                amount: cost,
                currency: 'mad',
                customer: customer["customerId"],
                description: `Rent ${o["description"]}, by customer ${customer["username"]}, price ${cost}.`,
                confirm:true,
                payment_method:list["data"][0]["id"],
                metadata:{
                    type:"Rent",
                    credits:o["prix"]*days_between(startDate,endDate),
                    client:clientId,
                    clientUsername:customer.username,
                    clientFullName:customer.nom +" "+customer.prenom
                }
            });
            if(charge["status"]=="failed"){
                return "Payment failed"
            }
            return {status: charge["status"],client: customer}
        }
        }}catch(e){
        console.log(e)
        return {message:"Server error"}
    }
}
function days_between(date1, date2) {
    const ONE_DAY = 1000 * 60 * 60 * 24;
    const differenceMs = Math.abs(date1 - date2);
    return Math.round(differenceMs / ONE_DAY);
}
module.exports = {createRent,deleteRent,modifyRent,getRent,getRents}