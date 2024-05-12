const user = require("../Models/User")
const client = require("../Models/Client")
const {createHash} = require("crypto")
const jwt = require("jsonwebtoken")
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'.env'})
}

const stripe = require("stripe")(process.env.SSK)

async function createUser(req,res){
    try{
        if(await user.findOne({email:req.body.email.toLowerCase()})){
            res.status(400).send("Email already exists")
        }else if(await user.findOne({username:req.body.username})){
            res.status(400).send("Username already taken")
        }
        else{
            let newUser = {
                firstName:req.body.firstName,
                lastName:req.body.lastName,
                username:req.body.username,
                email:req.body.email.toLowerCase(),
                password:encrypt(req.body.password),
                role:req.body.role
            }
            await user.create(newUser)
            res.send("User added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteUser(req,res){
    try{
        await user.findOneAndDelete({_id:req.body.id})
    }catch(e){
        res.status(500).send(e)
    }
}

async function modifyUser(req,res){
    try{
        let newData = req.body.newData
        if(newData["password"]){
            newData["password"]= encrypt(newData["password"])
        }
        await user.findOneAndUpdate(req.body.id,newData)
        res.send("User modified")
    }catch(e){
        res.status(500).send(e)
    }
}

async function getUser(req,res){
    try{
        let userResult = await user.findById(req.body.id)
        if(userResult){
            res.send(userResult)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        res.status(500).send(e)
    }
}

async function getUsers(req,res){
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
        let usersResult = await user.find(filter).populate("role").lean()
        res.send(usersResult)
    }catch(e){
        res.status(500).send(e)
    }
}

async function authUser(req,res){
    try{
        let credentials = req.body.credentials
        if(credentials["password"] && credentials["username"]){
            credentials["password"]= encrypt(credentials["password"])
            let thisUser = await user.findOne(credentials).populate("role").lean()
            if(thisUser){
                let token = jwt.sign(thisUser,process.env.ATS)
                console.log("thisUser: ",thisUser)
                res.send({user:thisUser,token:token})
            }else{
                res.status(404).send("Wrong credentials")
            }
        }else{
            res.status(400).send("Missing credentials")
        }
    }catch(e){
        console.log(e)
        res.status(500).send("Server error")
    }
}

async function getClientPayments(req,res){
    try{
        let c = await client.findById(req.body.id)
        if(c){
            const paymentIntents = await stripe.paymentIntents.list({limit:100,customer:c["customerId"]});
            res.send(paymentIntents)
        }
    }catch(e){
        res.status(400).send(e)
    }
}
async function dateSearchPayment(req,res){
    let allPaymentIntents = [];
    let lastPaymentIntentId;
    let hasMore = true;
    let config={limit:20}

    config["created"]={}
    if(req.body.beforeDate){
        config["created"]["lte"] = new Date(req.body.beforeDate)
    }
    if(req.body.afterDate){
        config["created"]["gte"] = new Date(req.body.afterDate)
    }
    if(!req.body.afterDate && !req.body.beforeDate){
        delete config["created"]
    }
    try {
    while(hasMore){
        config.starting_after = lastPaymentIntentId
        const paymentIntents = await stripe.paymentIntents.list(config);
  
        allPaymentIntents = allPaymentIntents.concat(paymentIntents.data);
        hasMore = paymentIntents.has_more;
        if(hasMore){lastPaymentIntentId = allPaymentIntents[allPaymentIntents.length - 1].id;}
        }
        res.send({amount:allPaymentIntents.length,data:allPaymentIntents})
      } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error.message });
      }
}
async function getAllPayments(req,res){
    let allPaymentIntents = [];
  let lastPaymentIntentId=req.body.lastPayment;
  let hasMore = true;

//   while (hasMore) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 20,
        starting_after: lastPaymentIntentId,
      });

      allPaymentIntents = allPaymentIntents.concat(paymentIntents.data);
      hasMore = paymentIntents.has_more;
      if(hasMore){lastPaymentIntentId = allPaymentIntents[allPaymentIntents.length - 1].id;}
      console.log(lastPaymentIntentId,hasMore)
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
//   }
  let list = []
  for(let p of allPaymentIntents){
    if(p){
        list.push({amount:p.amount/100,description:p.description,clientID:p.metadata.client,
        userName:p.metadata.clientUsername,fullName:p.metadata.clientFullName,status:p.status,date:new Date(p.created * 1000)})
    }
  }
  console.log(allPaymentIntents.length)
  res.status(200).json({data:list,lastPayment:lastPaymentIntentId,hasMore:hasMore});
}
function encrypt(pass){
    const salt = "80zzm081sr@nd0m"
    return createHash("sha256").update(pass).update(createHash("sha256").update(salt, "utf8").digest("hex")).digest("hex")
}
module.exports = {dateSearchPayment,createUser,deleteUser,modifyUser,getUser,getUsers,authUser,getClientPayments,getAllPayments}