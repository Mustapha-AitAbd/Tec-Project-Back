const zone = require("../Models/Zone")
const path = require("path")

async function createZone(req,res,next){
    try{
        if(await zone.findOne({zoneName:req.body.zoneName})){
            res.status(400).send("Zone already exists")
        }else{
            console.log("body",req.body)
            let newZone = {
                zoneName:req.body.zoneName,
                zoneType:req.body.zoneType,
                zoneImage:"pogo.png",
                zone:JSON.parse(req.body.zone),
                longitude:req.body.longitude,
                latitude:req.body.latitude,
            }
            let createdZone = await zone.create(newZone)
            // console.log("file",req.files)
            if (req.files && req.files.zoneImage) {
            const file = req.files.zoneImage
            const destination = (createdZone.zoneType=="cityZone"?"cities":"parkings")
            const filename = createdZone._id+ file.name.slice(file.name.lastIndexOf("."))
            const savePath = path.join(__dirname, "../public/"+destination, filename);
            file.mv(savePath, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                createdZone.zoneImage=`${destination}/${filename}`
                await createdZone.save()
            })}
            // res.send("Zone created")
            res.send({message:"Zone created",data:createdZone})   
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteZone(req,res){
    try{
        await zone.findOneAndDelete({_id:req.body.id})
        res.send("Zone deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

//for changing the Zone icon/image
async function modifyZone(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData =JSON.parse(req.body.newData)
        console.log(newData)
        console.log(req.files)
        if(newData.zone) {newData.zone = JSON.parse(newData.zone)}
        if(newData._id){ delete newData._id}
        if (req.files && req.files.zoneImage) {
            const file = req.files.zoneImage
            const destination = (newData.zoneType=="cityZone"?"cities":"parkings")
            const filename = req.body.id+ file.name.slice(file.name.lastIndexOf("."))
            const savePath = path.join(__dirname, "../public/"+destination, filename);
            file.mv(savePath, async (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                newData.zoneImage=`./${destination}/${filename}`
                await zone.findByIdAndUpdate(req.body.id,newData)
                res.send("Zone modified")
            })
            
        return
        }
        await zone.findByIdAndUpdate(req.body.id,newData)
        res.send("Zone modified")
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

//maybe not needed
async function getZone(req,res){
    try{
        let result = await zone.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getZones(req,res){ //gets both parkings
    try{
        let filter = {}
        if(req.body.filter){
            filter = JSON.parse(req.body.filter)
        }
        if(filter["including"]){
            filter['zoneName']= {'$regex': new RegExp(filter["includes"], 'i')}
            delete filter["including"]
        }
        let ZonesResult = await zone.find(filter)
        res.send(ZonesResult)
    }catch(e){
        res.status(500).send(e)
    }
}

async function getParkings(req,res){
    try{
        let filter = {}
        if(req.body.filter){
            filter = JSON.parse(req.body.filter)
        }
        if(filter["including"]){
            filter['zoneName']= {'$regex': new RegExp(filter["includes"], 'i')}
            delete filter["including"]
        }
        filter["zoneType"]="Parking"
        let ZonesResult = await zone.find(filter)
        res.send(ZonesResult)
    }catch(e){
        res.status(500).send(e)
    }
}

async function getCityZones(req,res){
    try{
        let filter = {}
        if(req.body.filter){
            filter = JSON.parse(req.body.filter)
        }
        if(filter["including"]){
            filter['zoneName']= {'$regex': new RegExp(filter["includes"], 'i')}
            delete filter["including"]
        }
        filter["zoneType"]="cityZone"
        let ZonesResult = await zone.find(filter)
        res.send(ZonesResult)
    }catch(e){
        res.status(500).send(e)
    }
}



module.exports = {createZone,deleteZone,modifyZone,getZone,getZones,getParkings,getCityZones}