const hardware = require("../Models/Hardware")

async function createHardware(req,res){
    try{
        let newHardware = req.body
        if(await hardware.findOne({_id:newHardware["_id"]})){
            res.status(400).send("Hardware already exists")
        }else{
            await hardware.create(newHardware)
            res.send("Hardware added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteHardware(req,res){
    try{
        await hardware.findOneAndDelete({_id:req.body.id})
        res.send("Hardware deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyHardware(req,res){
    try{
        // console.log(req.body)
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        if(newData._id){ delete newData._id}
        // console.log(newData)
        await hardware.findByIdAndUpdate(req.body.id,newData)
        res.send("Hardware modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getHardware(req,res){
    try{
        let result = await hardware.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getHardwares(req,res){
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
        let hardwaresResult = await hardware.find(filter)
        // console.log(HardwaresResult)
        res.send(hardwaresResult)
    }catch(e){
        res.status(500).send(e)
    }
}
module.exports = {createHardware,deleteHardware,modifyHardware,getHardware,getHardwares}