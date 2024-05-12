const hardwareProvider = require("../Models/HardwareProvider")

async function createHardwareProvider(req,res){
    try{
        let newHardwareProvider = req.body
        if(await hardwareProvider.findOne({_id:newHardwareProvider["id"]})){
            res.status(400).send("HardwareProvider already exists")
        }else{
            await hardwareProvider.create(newHardwareProvider)
            res.send("HardwareProvider added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteHardwareProvider(req,res){
    try{
        await hardwareProvider.findOneAndDelete({_id:req.body.id})
        res.send("HardwareProvider deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyHardwareProvider(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = req.body.newData
        await hardwareProvider.findByIdAndUpdate(req.body.id,newData) //mochkil mn 3ndi
        res.send("HardwareProvider modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getHardwareProvider(req,res){
    try{
        let result = await hardwareProvider.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getHardwareProviders(req,res){
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
        let hardwareProvidersResult = await hardwareProvider.find(filter)
        // console.log(HardwareProvidersResult)
        res.send(hardwareProvidersResult)
    }catch(e){
        res.status(500).send(e)
    }
}
module.exports = {createHardwareProvider,deleteHardwareProvider,modifyHardwareProvider,getHardwareProvider,getHardwareProviders}