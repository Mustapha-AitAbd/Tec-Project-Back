let facture = require("../Models/Facture")
let Trip = require("../Models/Trip")
let Support = require("../Models/Support")
let stripe = require("stripe")(process.env.SSK)
let schedule = require('node-schedule');
const { PDFDocument } = require('pdf-lib');
const pdf = require('html-pdf');

const fs = require('fs');

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'.env'})
}

const job = schedule.scheduleJob('0 1 * * *', async function() {
    try{

        let daysLimit = (await Support.find({}).lean())[0].facturePassedDays
        const daysAgo = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);
    let factures = await facture.find({payementStatus:"Pending",updatedAt:{$lte:daysAgo}}).populate("client").lean()
    for(let f of factures){
        let pm = (await stripe.customers.retrieve(f["client"]["customerId"])).invoice_settings.default_payment_method
        const charge = await stripe.paymentIntents.create({
            amount: Math.floor(f.totalcost*100),//amount in centimes
            currency: 'mad',
            customer: f["client"]["customerId"],
            description: 'Bill for accumulated trips',
            confirm:true,
            payment_method:pm,
            metadata:{
                factureId:f._id
            }
        });
        if(charge["status"]=="failed"){
            await client.findOneAndUpdate({_id:f["client"].id}, {accountBanned:true},{new: true })
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Failed"})
            await facture.findByIdAndUpdate(f._id,{payementStatus:"Failed"})
        }else{
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Succeeded"})
            await facture.findByIdAndUpdate(f._id,{payementStatus:"Passed"})
        }
        console.log(`Payement ${f._id} processed by scheduler`)
    }
    }catch(e){
        console.log(e)
    }
});

async function addTripToFacture(trip,clientId){
    try{
        let f = await facture.findOne({payementStatus:{$in:["Pending","Incomplete"]},client:clientId}).populate("client").lean()
        console.log("Facture",f)
        // console.log("Trip",trip)
        if(f){
            console.log("Facture found")
            f = await facture.findByIdAndUpdate(f._id,{$inc:{totalcost:trip.totalcost},$push:{trips:trip._id}},{new:true})
        }else{
            console.log("Facture not found, creating one...")
            f = await facture.create({client:clientId,totalcost:trip.totalcost,trips:[trip._id]})
        }
        return f
    }catch(e){
        console.log(e)
        return {error:e}
    }
}
async function processFacture(req,res){
    let r = {}
    console.log(req.body.id)
    let f = await facture.findById(req.body.id).populate("client")
    try{
        if(!f){
            res.status(404).send("No facture with this id found")
            return
        }
        if(f.payementStatus=="Passed"){
            res.status(400).send("Facture already payed")
            return
        }
        const cust = await stripe.customers.retrieve(f["client"]["customerId"])
        const charge = await stripe.paymentIntents.create({
            amount: Math.floor(f.totalcost*100),//amount in centimes
            currency: 'mad',
            customer: f["client"]["customerId"],
            description: 'Bill for accumulated trips',
            confirm:true,
            payment_method:cust.invoice_settings.default_payment_method,
            metadata:{
                factureId:req.body.id
            }
        });
        if(charge["status"]=="failed"){
            r["customer"] = await client.findOneAndUpdate({_id:f["client"].id}, {accountBanned:true},{new: true })
            r["secret"]=charge.client_secret
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Failed"})
            f.payementStatus="Incomplete"
            r["message"] = "Payement Incomplete"
        }else{
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Succeeded"})
            f.payementStatus="Passed"
            r["message"] = "Payement Passed"
        }
        f.save()
        console.log("Payement processed")
        r["status"]=charge["status"]
        res.send(r)
    }catch(e){
        console.log(e)
        res.status(500).send("Server error")
    }
}

async function processAllFactures(req,res){
    try{
        let r = {}
        let factures = await facture.find({client:req.body.client,payementStatus:{$in:["Pending","Incomplete"]}}).populate("client").lean()
    for(let f of factures){
        let pm = (await stripe.customers.retrieve(f["client"]["customerId"])).invoice_settings.default_payment_method
        const charge = await stripe.paymentIntents.create({
            amount: Math.floor(f.totalcost*100),//amount in centimes
            currency: 'mad',
            customer: f["client"]["customerId"],
            description: 'Manual processing of bill for accumulated trips',
            confirm:true,
            payment_method:pm,
            metadata:{
                factureId:f._id
            }
        });
        if(charge["status"]=="failed"){
            await client.findOneAndUpdate({_id:f["client"].id}, {accountBanned:true},{new: true })
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Failed"})
            await facture.findByIdAndUpdate(f._id,{payementStatus:"Incomplete"})
            r["message"] = "Payement Incomplete"
            r["paymentStatus"]="Incomplete"
        }else{
            await Trip.updateMany({_id:{$in:f.trips}},{paymentStatus:"Succeeded"})
            await facture.findByIdAndUpdate(f._id,{payementStatus:"Passed"})
            r["message"] = "Payement Passed"
            r["paymentStatus"]="Passed"
        }
    }
    console.log(r)
    res.send(r)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function getFactures(req,res){
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
        let factureResult = await facture.find(filter).populate("client").populate("trips").lean()
        res.send(factureResult)
    }catch(e){
        res.status(500).send(e)
    }
}
async function printFacture(req,res){
    try{
        if(!req.params.id){
            res.status(400).send("No Id was sent")
            return
        }
        let f = await facture.findById(req.params.id).populate("client").populate("trips")
        // console.log(f)
        let templateHtml = fs.readFileSync('./private/invoicetemplate.html', 'utf-8').replaceAll("${fullName}",f.client.nom+" "+f.client.prenom).replaceAll("${email}",f.client.email).replaceAll("${_id}",f._id);
        templateHtml = templateHtml.replaceAll("${date}",new Date(f.createdAt).getDay()+'/'+(new Date(f.createdAt).getMonth()+1)+'/'+new Date(f.createdAt).getFullYear())
        templateHtml = templateHtml.replaceAll("${totalcost}",f.totalcost.toFixed(2))
        let table =``
        f.trips.map((trip)=>{
            table += (
                `
                    <tr>
                        <td><span contenteditable>${new Date(trip.startTime).toLocaleDateString()}</span></td>
                        <td><span contenteditable>${CalculRideDistance(trip?.coords)}</span></td>
                        <td><span contenteditable>${CalculateRideTime(trip.startTime,trip.endTime)}</span></td>
                        <td><span>${trip?.totalcost.toFixed(2)} MAD</span></td>
                      </tr>
                    `
            )
        })
        // console.log(table)
        templateHtml = templateHtml.replaceAll("${history}",table)
            res.setHeader("Content-Type","text/html")
            res.send(templateHtml);
          
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
function CalculRideDistance(coords) {
    let distance = 0
    let lastcoords = {longitude:coords[0]["longitude"],latitude:coords[0]["latitude"]}
    const R = 6371; // Earth's radius in km
    coords.map((c)=>{
        const lat1 = degreesToRadians(lastcoords.latitude);
        const lon1 = degreesToRadians(lastcoords.longitude);
        const lat2 = degreesToRadians(c.latitude);
        const lon2 = degreesToRadians(c.longitude);
        
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        lastcoords = {longitude:c.longitude,latitude:c.latitude}
        distance += R * d * 1000; // Distance in m
    })
    return distance.toFixed(2)+"m"
}
function CalculateRideTime(d1,d2){
    let delta = Math.abs(d1 - d2) / 1000;

    let hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    let minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    let seconds = Math.floor(delta % 60);
    return hours+"h "+minutes+"min "+seconds+"s";
}
module.exports = {addTripToFacture,processAllFactures,getFactures,processFacture,printFacture}