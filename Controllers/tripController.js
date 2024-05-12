const trip = require("../Models/Trip")

async function createTrip(req,res){
    try{
        let newTrip = req.body
        await trip.create(newTrip)
        res.send("trip added")
    }catch(e){
        res.status(500).send(e)
    }
}

async function deleteTrip(req,res){
    try{
        await trip.findOneAndDelete({_id:req.body.id})
        res.send("trip deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyTrip(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        await trip.findOneAndUpdate(req.body.id,newData)
        res.send("trip modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getTrip(req,res){
    try{
        let result = await trip.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getTrips(req,res){
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
        console.log(filter)
        let tripsResult = await (await trip.find(filter).populate({path: "vehiculeId",populate:{path: "idType"}})).reverse()
        // console.log(tripsResult)
        res.send(tripsResult)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function addCoords2Trip(req,res){
    try{
        let r = await trip.updateOne({_id: req.body.id}, {$push: {coords: {longitude:req.body.longitude,latitude:req.body.latitude}}})
        res.send(r)
    }catch(e){
        res.status(500).send(e)
    }
}
async function verifyTrip(req,res){
    try{
        // console.log("verify",{_id:req.body.tripId,currentState:"Ended"},{tripImage:req.body.proof});
        console.log("verifying")
        let t = await trip.findOneAndUpdate({_id:req.body.tripId,currentState:"Verification"},{currentState:"Ended",tripImage:req.body.proof})
        res.send(t)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
module.exports = {createTrip,deleteTrip,modifyTrip,getTrip,getTrips,addCoords2Trip,verifyTrip}