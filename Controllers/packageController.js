const package = require("../Models/Package")
// const client = require("../Models/Client")
async function createPackage(req,res){
    try{
        if(await package.findOne({packageName:req.body.packageName})){
            res.status(400).send("package name already exists")
        }else{
            let newPackage = {
                packageName:req.body.packageName,
                creditsOffer:req.body.creditsOffer,
                price:req.body.price
            }
            await package.create(newPackage)
            res.send("package added")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function deletePackage(req,res){
    try{
        await package.findOneAndDelete({_id:req.body.id})
        res.send("package deleted")
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyPackage(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData =req.body.newData
        await package.findByIdAndUpdate(req.body.id,newData)
        res.send("package modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getPackage(req,res){
    try{
        let result = await package.findById(req.body.id)
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getPackages(req,res){
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
        let packagesResult =await (await package.find(filter)).reverse()
        res.send(packagesResult)
    }catch(e){
        res.status(500).send(e)
    }
}

module.exports = {createPackage,deletePackage,modifyPackage,getPackage,getPackages}