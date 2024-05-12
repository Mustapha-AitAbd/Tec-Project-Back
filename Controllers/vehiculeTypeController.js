const vehiculeType = require("../Models/VehiculeType")
const path = require("path")

async function createVehiculeType(req,res){
    try{
        if(await vehiculeType.findOne({typeName:req.body.typeName})){
            res.status(400).send("type already exists")
        }else{
            let newVehiculeType = {
                typeName:req.body.typeName,
                costPerMinuteParked:req.body.costPerMinuteParked,
                costPerMinuteRide:req.body.costPerMinuteRide,
                batteryProfile:JSON.parse(req.body.batteryProfile)
            }
            let createdType = await vehiculeType.create(newVehiculeType)
            if (req.files && req.files.image){
                const file = req.files.image
            const destination = "vehiculeTypes"
            const filename = createdType._id+ file.name.slice(file.name.lastIndexOf("."))
            const savePath = path.join(__dirname, "../public/"+destination, filename);
            file.mv(savePath, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                createdType.image=`${destination}/${filename}`
                await createdType.save()
            })
            }
            res.send("vehiculeType added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteVehiculeType(req,res){
    try{
        await vehiculeType.findOneAndDelete({_id:req.body.id})
        res.send("vehiculeType deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyVehiculeType(req,res){
    try{
        console.log(req.body)
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData =JSON.parse(req.body.newData)
        console.log(newData)
        console.log(req.files)
        if(newData.batteryProfile) {newData.batteryProfile = JSON.parse(newData.batteryProfile)}
        if(newData._id){ delete newData._id}
        if (req.files && req.files.image) {
            const file = req.files.image
            const destination = "vehiculeTypes"
            const filename = req.body.id+ file.name.slice(file.name.lastIndexOf("."))
            const savePath = path.join(__dirname, "../public/"+destination, filename);
            file.mv(savePath, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                newData.image=`./${destination}/${filename}`
                await vehiculeType.findByIdAndUpdate(req.body.id,newData)
                res.send("vehiculeType modified")
            })
            
        return
        }
        await vehiculeType.findByIdAndUpdate(req.body.id,newData)
                res.send("vehiculeType modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getVehiculeType(req,res){
    try{
        let result = await vehiculeType.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getVehiculeTypes(req,res){
    try{
        let filter = {}
        if(req.body.filter){
            filter = req.body.filter
        }
        if(filter["includes"]){
            filter['typeName']= {'$regex': new RegExp(filter["includes"], 'i')}
            delete filter["includes"]
        }
        let vehiculeTypesResult = await vehiculeType.find(filter)
        res.send(vehiculeTypesResult)
    }catch(e){
        res.status(500).send(e)
    }
}
module.exports = {createVehiculeType,deleteVehiculeType,modifyVehiculeType,getVehiculeType,getVehiculeTypes}