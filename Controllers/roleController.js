let role = require("../Models/Role")
let client = require("../Models/Client")
let user = require("../Models/User")

async function addRole(req,res){
    try{
        if(!req.body.roleName){
            res.status(400).send("No role entered")
            return 
        }
        if(!req.body.privileges){
            res.status(400).send("No privileges entered")
            return 
        }
        console.log(req.body)
        let r = await role.create({roleName:req.body.roleName,privileges:req.body.privileges,description:req.body.description})
        res.send({message:"Role created",role:r})
    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}
async function modifyRole(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("No role entered")
            return
        }
        let newData = {}
        if(req.body.newData){
            newData=req.body.newData
        }
        await role.findByIdAndUpdate(req.body.id,newData)
        res.send("Role modified")
    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}
async function deleteRole(req,res){
    try{
        if(!req.body.id){
            res.status(400).send("No role id was sent")
            return
        }
        let clients = await client.find({role:req.body.id}).lean()
        let users = await user.find({role:req.body.id}).lean()

        if(clients.length!=0 || users.length!=0){
            res.status(400).send("A person already exists with this role")
            return
        }
        await role.findByIdAndDelete(req.body.id)
        res.send("Role deleted")
    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}
async function getRole(req,res){
    try{

    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}
async function getRoles(req,res){
    try{
        let filter = {}
        if(req.body.zoneName){
            filter["zoneName"] = req.body.zoneName
        }
        let roles = await role.find(filter)
        res.send(roles)
    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}
function getPrivileges(req,res){
    try{
        let privs = ["Create role","Delete role","Modify Role","Get Roles","Get Packages"]
        res.send(privs)
    }catch(e){
        console.log(e.message)
        res.status(500).send(e.message)
    }
}

module.exports = {addRole,getPrivileges,getRoles,modifyRole,deleteRole,getRole}