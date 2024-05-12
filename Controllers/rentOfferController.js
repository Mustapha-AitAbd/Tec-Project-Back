const RentOffer = require("../Models/RentOffer")
// const client = require("../Models/Client")
async function createRentOffer(req,res){
    try{
        let newRentOffer = {
            vehiculeType:{
                vehicule:req.body.vehiculeType,
                vehiculeDescription:req.body.vehiculeDescription
            },
            prix:req.body.prix,
            maxDistance:req.body.maxDistance,
            description:req.body.description,
            period:req.body.period
        }
        await RentOffer.create(newRentOffer)
        res.send("RentOffer added")
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteRentOffer(req,res){
    try{
        await RentOffer.findOneAndDelete({_id:req.body.id})
        res.send("RentOffer deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyRentOffer(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        await RentOffer.findByIdAndUpdate(req.body.id,newData)
        res.send("RentOffer modified")
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function getRentOffer(req,res){
    try{
        let result = await RentOffer.findById(req.body.id).populate("vehiculeType.vehicule")
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getRentOffers(req,res){
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
        let RentOffersResult =  (await RentOffer.find(filter).populate("vehiculeType.vehicule").lean()).reverse()
        res.send(RentOffersResult)
    }catch(e){
        res.status(500).send(e)
    }
}
  
module.exports = {createRentOffer,deleteRentOffer,modifyRentOffer,getRentOffer,getRentOffers}