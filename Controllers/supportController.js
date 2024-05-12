const Support = require("../Models/Support")

async function createSupport(req,res){
    try{
        let newSupport = req.body
        if(await Support.findOne({_id:newSupport["_id"]})){
            res.status(400).send("Support already exists")
        }else{
            await Support.create(newSupport)
            res.send("Support added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteSupport(req,res){
    try{
        await Support.findOneAndDelete({_id:req.body.id})
        res.send("Support deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifySupport(req,res){
    try{
        // console.log(req.body)
        if(!req.body._id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData = {email:req.body.email,phoneNumber:req.body.phoneNumber}
        // console.log(newData)
        await Support.findByIdAndUpdate(req.body._id,newData)
        res.send("Support modified")
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function getSupport(req,res){
    try{
        let result = await Support.find()
        if(result){
            res.send(result[0])
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

module.exports = {createSupport,deleteSupport,modifySupport,getSupport}