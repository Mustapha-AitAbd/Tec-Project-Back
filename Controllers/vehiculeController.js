const Vehicule = require("../Models/Vehicule")
const fetch = require("node-fetch")
const Trip = require("../Models/Trip")
const Packet = require("../Models/Packet")
const {chargeCustomerAfterTrip} = require("./clientController")
const Zone = require("../Models/Zone")
// const socketManager = require('../socketManager');

async function createVehicule(req,res){
    try{
        let newVehicule = req.body
        if(!newVehicule["_id"]){
            newVehicule["_id"] = (await Vehicule.find().sort({ _id: -1 }).limit(1))[0]["_id"] + 1
        }
        if(await Vehicule.findOne({_id:newVehicule["_id"]})){
            res.status(400).send("Vehicule already exists")
        }else{
            await Vehicule.create(newVehicule)
            res.send("Vehicule added")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function deleteVehicule(req,res){
    try{
        console.log(req.body)
        let v = await Vehicule.findOneAndDelete({_id:req.body.id})
        res.send("Vehicule deleted")
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function trackVehicule(req,res){
    try{
        let b = await Vehicule.findOne({_id: req.body.id}).populate({path: "hardware",populate:{path: "hardwareProvider"}}).lean()
        if(b["VehiculeStatus"]=="active"){
            let response = await fetch(`${b["hardware"]["hardwareProvider"]["BaseUri"]}/devices/${b["hardware"]["_id"]}/actions/current-status?cached=0&wait=30`,{
                method:"POST",
                headers:{
                    "MAPTEX-API-KEY": b["hardware"]["hardwareProvider"]["HardwareKeyApi"]
                },
            })
            let r= await response.json()
            b["trackingData"] = r
        }
        res.send(b)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function modifyVehicule(req,res){
    try{
        // console.log(req.body)
        if(!req.body.id){
            res.status(400).send("no Id was sent")
            return
        }
        let newData =req.body.newData
        if(newData._id){ delete newData._id}
        await Vehicule.findByIdAndUpdate(req.body.id,newData)
        res.send("Vehicule modified")
    }catch(e){
        console.log("error: ",e)
        res.status(500).send(e)
    }
}

async function modifyVehiculeByImei(req,res){
    try{
        console.log(req.body)
        if(!req.body.imei){
            res.status(400).send("no imei was sent")
            return
        }
        await Vehicule.findOneAndUpdate({hardware:req.body.imei},{lastCoords:req.body.lastCoords, vehicleBattery:req.body.vehicleBattery})
        res.send("Vehicule modified")
    }catch(e){
        console.log("error: ",e)
        res.status(500).send(e)
    }
}

//maybe not needed
async function getVehicule(req,res){
    try{
        let result = await Vehicule.findOne({_id: req.body.id}).populate("idType").populate({path: "hardware",populate:{path: "hardwareProvider"}}).lean()
        if(result){
            res.send(result)
        }else{
            res.status(404).send("Not found")
        }
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}

async function getVehicules(req,res){
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
        let VehiculesResult = await Vehicule.find(filter)
        res.send(VehiculesResult)
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function adminAction(req,res){
    try{
        console.log(req.body)
        let r={}
        let b = await Vehicule.findOne({_id: req.body.id}).populate({path: "hardware",populate:{path: "hardwareProvider"}}).populate("idType").lean()
        if(!b){
            res.status(404).send({error:"Vehicule Id doesn't exist"})
            return;
        }
        let VehiculeHardwareId = b["hardware"]["_id"]
        let t
       switch (req.body.action) {
        case "stop":
            console.log("stopping")
            if(b["vehiculeStatus"]=="active"){
                r = await adminVehiculeStop(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b)
                res.status(r["status"]).send(r)
            }else{res.status(500).send({message:"Vehicule already inactive"})}
            break;
        case "start":
            console.log("starting")
            if(b["vehiculeStatus"]=="inactive"){
                r = await adminVehiculeStart(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b)    
                res.status(r["status"]).send(r)
            }else{
                res.status(500).send({message:"Vehicule is active"})
            }
            break;
        default:
            res.send("Invalid action")
            break;
       }
        
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function adminVehiculeStart(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId){
    let t = {}
    // let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/start-vehicle?cached=0&wait=40`,{
        let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/start-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"POST",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
    },})
    let data = await response.json()
    console.log("status: ",response.status)
    switch(response.status){
        case 200:
            t["status"]=200
            console.log("started successfully")
                t["vehicule"]=await Vehicule.findOneAndUpdate({_id:vehicule._id},{$set:{vehiculeStatus:"active"}})
                t["message"] = "Vehicule unlocked successfully"
            break;

        case 502:
            console.log(`Starting vehicule ${VehiculeHardwareId} failed, device is offline: ERR-${data.errorCode}`)
            t = {status:502,message:`Cannot start vehicule ${vehicule._id}, device is Offline. Please try again later`}
            break;

        case 504:
            console.log(`Start Action - No response from vehicule ${VehiculeHardwareId}, device timed out: ERR-${data.errorCode}`)
            t = {status:504,message:`Cannot start vehicule ${vehicule._id}. Please try again later`}
            adminVehiculeStop(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,null)
            break;
        default:
            console.log(`Tracker error, the IMEI entered may not exist`)
            break;
    }
return t
}
async function adminVehiculeStop(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule){
    let t={}
    let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/stop-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"POST",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
        },
    })
    let data = await response.json()
    console.log("status: ",response.status)
    switch(response.status){
        case 200:
            t["status"]=200
            console.log("stopped successfully")
            let configUpdate = {
                vehiculeStatus:"inactive",
                lastUsedDate:new Date()}
            if(data["lon"]==undefined || data["lat"]==undefined){configUpdate.lastCoords={longitude: data["lon"],latitude: data["lat"]}}
            t["vehicule"]=await Vehicule.findOneAndUpdate({_id:vehicule._id},configUpdate)
            t["message"] = "Vehicule locked successfully"
            break;

        case 502:
            console.log(`Stopping vehicule ${VehiculeHardwareId} failed, device is offline: ERR-${data.errorCode}`)
            t = {status:502,message:`Cannot stop vehicule ${vehicule._id}, device is Offline. Please try again..`}
            break;

        case 504:
            console.log(`Stop Action - No response from vehicule ${VehiculeHardwareId}, device timed out: ERR-${data.errorCode}`)
            t = {status:504,message:`Cannot stop vehicule ${vehicule._id}. Please try again..`}
            break;
        default:
            console.log(`Tracker error, the IMEI entered may not exist`)
            break;
    }
return t
}
async function applyAction(req,res){
    try{
        let r={}
        let b = await Vehicule.findOne({_id: req.body.id}).populate({path: "hardware",populate:{path: "hardwareProvider"}}).populate("idType").populate("rentOffer").lean()
        // console.log(b)
        if(!b){
            res.status(404).send({error:"Vehicule Id doesn't exist"})
            return;
        }
        if(!req.body.clientId){
            res.status(400).send({error:"No clientId was sent"})
            return;
        }
        let VehiculeHardwareId = b["hardware"]["_id"]
        let t
       switch (req.body.action) {
        case "pause":
            console.log("pausing")
            if(req.body.tripId){
                r = await vehiculePause(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b,req.body.clientId,req.body.tripId)
                res.status(r["status"]).send(r)
            }else{
                res.send({error:"tripId was sent"})
            }
            break;
        case "unpause":
            console.log("unpausing")
            if(req.body.tripId){
                r = await vehiculeUnpause(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b,req.body.clientId,req.body.tripId)
                res.status(r["status"]).send(r)
            }else{
                res.send({error:"tripId was sent"})
            }
            break;
        case "stop":
            console.log("stopping")
            if(req.body.tripId){
                r = await vehiculeStop(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b,req.body.clientId,req.body.tripId)
                res.status(r["status"]).send(r)
            }else{
                res.send({error:"tripId was sent"})
            }
            break;
        case "start":
            console.log("starting")
            if(b["vehiculeStatus"]=="inactive"){
                r = await vehiculeStart(b["hardware"]["hardwareProvider"]["HardwareKeyApi"],b["hardware"]["hardwareProvider"]["BaseUri"],VehiculeHardwareId,b,req.body.clientId)    
                res.status(r["status"]).send(r)
            }else{
                res.status(501).send("Vehicule is no longer available")
            }
            break;
        default:
            res.send("Invalid action")
            break;
       }
        
    }catch(e){
        console.log(e)
        res.status(500).send(e)
    }
}
async function vehiculeStatus(vehicule,vehiculeAPI,baseUri,VehiculeHardwareId){
    // let response = await fetch(`http://localhost:3001/status`,{
    let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/current-status?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"GET",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
    },})
    let data = await response.json()
    console.log(data)
    console.log("status:",response.status,"ignitionOn:",data.ignition,"lon:",data.lon,"lat:",data.lat)
        switch(response.status){
            case 200:
                return {status:200,data:data}
            case 502:
                console.log(`Getting status for vehicule ${VehiculeHardwareId} failed, device is offline: ERR-${data.errorCode}`)
                return {status:502,error:`Cannot start vehicule ${vehicule._id}, device is Offline. Please try again later`}
            case 504:
                console.log(`Status Action - No response from vehicule ${VehiculeHardwareId}, device timed out: ERR-${data.errorCode}`)
                return {status:504,error:`Cannot start vehicule ${vehicule._id}. Please try again later`}
            default:
                console.log(`Tracker error, the IMEI entered may not exist`)
                break;
        }
}
function delay(ms) {
    return new Promise(done => {
      setTimeout(() => {
        done();
      }, ms);
    });
  }

async function vehiculeStart(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId){
    let t = {}
    // let response = await fetch(`http://localhost:3001/start`,{
    let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/start-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"POST",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
    },})
    let data = await response.json()
    console.log("Start: ",data)


    // t = await vehiculeStatus(vehicule,vehiculeAPI,baseUri,VehiculeHardwareId)
    t["status"]=response.status;
    if(response.status==200){
            t["trip"] = await Trip.create({clientId:clientId,vehiculeId:vehicule._id,startTime:new Date(),startParking:vehicule.lastParking,
            coords: [{
                time:new Date(),
                longitude: data["lon"],
                latitude: data["lat"]
            }]})
            t["battery"]= getBatteryLevel(vehicule,data["extendedData"]["vehicleBattery"])
            await Vehicule.findOneAndUpdate({_id:vehicule._id},{batteryLevel:t["battery"],$set:{vehiculeStatus:"active"}})
            // endTracking(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,t.trip["_id"])
        //delete t["data"]
        return t;
    }
    else{
        return {
            status: 500,
            error:  "Device did not respond within an acceptable time period."
        }
    }
               
}
async function vehiculeStop(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId){
    let t={}
    // let response = await fetch(`http://localhost:3001/stop`,{
    let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/stop-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"POST",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
        },
    })
    t["status"]=response.status;
    let data = await response.json()
    console.log("Stop: ",data)
    if(response.status==200){
        if(tripId){
            let lastParking=await findLastParking(data["lon"],data["lat"])
            t["trip"] = await Trip.findByIdAndUpdate(tripId,{currentState:"Verification",
                                    endTime:new Date(),
                                    endParking:lastParking,
                                    $push:{coords: {
                                        time:new Date(),
                                        state:"Ended",
                                        longitude: data["lon"],
                                        latitude: data["lat"]
                                    }}
                                    },{new:true}
            )
            //console.log(t["trip"])
            t["trip"] = await endTracking(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,t["trip"])
            console.log(t["trip"])
            let calculatedPrice = calculatePrice(t["trip"]["coords"],vehicule,vehicule.rented)
            t["trip"] = await Trip.findByIdAndUpdate(tripId,{totalcost:calculatedPrice},{new:true})
            t["battery"]= getBatteryLevel(vehicule,data["extendedData"]["vehicleBattery"])
            t["payement"]= await chargeCustomerAfterTrip(clientId,calculatedPrice,t["trip"])
            let configUpdate = {
            lastUser:clientId,
            batteryLevel:t["battery"],
            vehiculeStatus:"inactive",
            lastUsedDate:new Date()}
            if(lastParking!=null){configUpdate.lastParking=lastParking}
            if(data["lon"]==undefined || data["lat"]==undefined){configUpdate.lastCoords={longitude: data["lon"],latitude: data["lat"]}}
            await Vehicule.findOneAndUpdate({_id:vehicule._id},configUpdate)
                //delete t["data"]
        }
        return t
    }
    else{
        return {
            status: 500,
            error:  "Device did not respond within an acceptable time period."
        }
    }
}
async function vehiculePause(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId){
    let t={}
    // let response = await fetch(`http://localhost:3001/stop`,{
        let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/stop-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
            method:"POST",
            headers:{
                "MAPTEX-API-KEY": vehiculeAPI
            },
        })
        t["status"]=response.status;
        let data = await response.json()
        // console.log("status: ",response.status)
        console.log("Pause: ",data)
        if(response.status==200){
            t["trip"] =  await Trip.findByIdAndUpdate(tripId,{currentState:"Paused",
                                    $push:{
                                        coords: {
                                            time:new Date(),
                                            state:"Paused",
                                            longitude: data["lon"],
                                            latitude: data["lat"]
                                        }
                                    }
                                },
                                {new:true})
            t["battery"]= getBatteryLevel(vehicule,data["extendedData"]["vehicleBattery"])
            await Vehicule.findByIdAndUpdate(vehicule._id,{batteryLevel:t["battery"]})
            // delete t["data"]
            return t
        }
        else{
            return {
                status: 500,
                error:  "Device did not respond within an acceptable time period."
            }
        }
}
async function vehiculeUnpause(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId){
    let t={}
        // let response = await fetch(`http://localhost:3001/start`,{
    let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/start-vehicle?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
        method:"POST",
        headers:{
            "MAPTEX-API-KEY": vehiculeAPI
    },})
    t["status"]=response.status;
    let data = await response.json()
        // console.log("status: ",response.status)
    console.log("Unpause: ",data)
    if(response.status==200){
        t["trip"] = await Trip.findByIdAndUpdate(tripId,{
                currentState:"Running",
                $push:{coords: {
                    time:new Date(),
                    state:"Running",
                    longitude: data["lon"],
                    latitude: data["lat"]
                }}
                })
        t["battery"]= getBatteryLevel(vehicule,data["extendedData"]["vehicleBattery"]) 
                // endTracking(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,t.trip["_id"])
        await Vehicule.findByIdAndUpdate(vehicule._id,{batteryLevel:t["battery"]})
        //delete t["data"]
        return t
    }
    else{
        return {
            status: 500,
            error:  "Device did not respond within an acceptable time period."
        }
    }
}
function getBatteryLevel(vehicule,voltage){
    vehicule = vehicule["idType"]["batteryProfile"]
    let voltages=[]
    for(p in vehicule)
    voltages.push(vehicule[p])
    console.log("Voltages: ",voltages)
    let levels=[100,80,60,40,20]
    let level=-1;
    for(let i=1;i<voltages.length;i++){
        let a=voltages[i-1]
        let b=voltages[i]
        console.log("values: ", a,b)
        if(voltage<=a && voltage>b ){
            level=levels[i-1]*(a-voltage)/(a-b) + levels[i]*(voltage-b)/(a-b);
            break;
        }
    }
    if(level==-1) level=20*(1-voltage/voltages[voltages.length-1])
    return parseInt(level)
}
async function endTracking(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId){
    let t = await Trip.findById(tripId)
    let distance=0
    let packets = await Packet.find({
        IMEI:vehicule.hardware._id,
        lon:{$exists:true,$ne:0},
        lat:{$exists:true,$ne:0},
        timestamp:{$gte:t.startTime,$lt:t.endTime}}).lean()
    if(!vehicule.rented){
        console.log("Vehicule is not rented")
    for(let p of packets){
        t.coords.push({time:p.timestamp,
            longitude:p.lon,
            latitude:p.lat})
    }
    }else{
        let lastcoords = {longitude:packets[0]["lon"],latitude:packets[0]["lat"]}
        for(let p of packets){
        distance+=haversineDistance(lastcoords,{longitude:p["lon"],latitude:p["lat"]})
        console.log("Vehicule is rented. Distance:",distance)
        t.distance = distance
        t.coords.push({time:p.timestamp,
            aboveLimit:vehicule.rentOffer.maxDistance<distance?true:false,
            longitude:p.lon,
            latitude:p.lat})
        }
    }
    t.coords.sort((a, b) => new Date(a.time) - new Date(b.time));
    await t.save()
    return t
}
// async function endTracking(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId){
//     let timer = createTimer()
//     let seconds = 60
//     let t = await Trip.findById(tripId).lean()
//     let distance=t.distance
//     console.log("Current Distance before starting incrementation:",distance)
// let lastcoords ={longitude:t.coords[t.coords.length-1]["longitude"],latitude:t.coords[t.coords.length-1]["latitude"]}
//     timer.start(async ()=>{
//         let response = await fetch(`http://193.70.86.143:5051/devices/${VehiculeHardwareId}/actions/current-status?model=${vehicule["hardware"]["hardwareProvider"]["Model"]}&cached=0&wait=40`,{
//             method:"GET",
//             headers:{
//                 "MAPTEX-API-KEY": vehiculeAPI
//             },
//         })
//         let data = await response.json()
//         console.log("status:",response.status,"ignitionOn:",data.ignitionOn,"lon:",data.lon,"lat:",data.lat)
//         switch(response.status){
//             case 200:
//                 if(data["ignitionOn"]==true){
//                     timer.setInterval(seconds*1000)
//                     console.log("Adding new coords to trip",tripId, "- Current speed:",data.speedGps)
//                     if(!vehicule.rented){
//                         console.log("Vehicule is not rented")
//                         await Trip.updateOne({_id: tripId}, {$push: {coords: {time:new Date(),longitude:data["lon"],latitude:data["lat"]}}})
//                     }else{
//                         distance+=haversineDistance(lastcoords,{longitude:data["lon"],latitude:data["lat"]})
//                         console.log("Vehicule is rented. Distance:",distance)
//                         await Trip.updateOne({_id: tripId}, {distance:distance,
//                             $push: {coords: {time:new Date(),aboveLimit:vehicule.rentOffer.maxDistance<distance?true:false,
//                                             longitude:data["lon"],latitude:data["lat"]}}})    
//                         lastcoords = {longitude:data["lon"],latitude:data["lat"]}
//                     }
//                 }else{
//                     console.log("Vehicule ignition is off, pausing trip if state is Running...")
//                     await Trip.updateOne({_id: tripId,currentState:"Running"}, {currentState:"Paused",$push: {coords: {time:new Date(),state:"Paused",longitude:data["lon"],latitude:data["lat"]}}})
//                     timer.stop()
//                 }
//                 break;

//             case 502:
//                 console.log(`Tracking vehicule ${VehiculeHardwareId} failed, device is offline: ERR-${data.errorCode}`)
//                 timer.stop()
//                 break;

//             case 504:
//                 if(seconds<=80){
//                     console.log(`Track Action - No response from vehicule ${VehiculeHardwareId}, retrying in ${seconds} seconds, device timed out: ERR-${data.errorCode}`)
//                     seconds+=20
//                     timer.setInterval(seconds*1000)
//                 }else{
//                     console.log("No response for Track action after 5 times, aborting...")
//                     timer.stop()
//                     vehiculeStop(vehiculeAPI,baseUri,VehiculeHardwareId,vehicule,clientId,tripId)
//                 }
//                 break;
//             default:
//                 console.log(`Tracker error, the IMEI entered may not exist`)
//                 timer.stop()
//                 break;
//         }
//     },seconds*1000)
// }

function createTimer() {
    return {
      running: false,
      interval: 1000,
      timeout: null,
      callback: function () {},
      start: function (cb, interval) {
        this.callback = cb;
        this.interval = interval;
        this.running = true;
        this.execute();
      },
      execute: function () {
        if (!this.running) return;
        this.callback();
        this.timeout = setTimeout(() => this.execute(), this.interval);
      },
      stop: function () {
        this.running = false;
        clearTimeout(this.timeout);
      },
      setInterval: function (interval) {
        this.interval = interval;
      },
    };
  }

async function findLastParking(lon,lat){
    let coords = {longitude:lon,latitude:lat}
    let park = null
    let parkings =await Zone.find({zoneType:"Parking"})
    for(let p of parkings){
        if(isPointInsidePolygon(coords, p.zone)){
            park = p._id
            return park;
        }
    }
}
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
function haversineDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const lat1 = degreesToRadians(coord1.latitude);
    const lon1 = degreesToRadians(coord1.longitude);
    const lat2 = degreesToRadians(coord2.latitude);
    const lon2 = degreesToRadians(coord2.longitude);
  
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
  
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Distance in km
  }
function isPointInsidePolygon(point, polygon) {
    const x = point.longitude, y = point.latitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude, yi = polygon[i].latitude;
        const xj = polygon[j].longitude, yj = polygon[j].latitude;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

function calculatePrice(coords,vehiculeType,rented){
    let runningSum = 0;
let pausedSum = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const currentState = coords[i].state;
        const nextState = coords[i + 1].state;
      if(rented==false || coords[i].aboveLimit==true ){
          if (currentState === "Running") {
              runningSum += minutes_between(coords[i].time, coords[i + 1].time);
            } else if (currentState === "Paused") {
                pausedSum += minutes_between(coords[i].time, coords[i + 1].time);
            }
        }else{console.log("not above limit",i)}
    }
    return runningSum*vehiculeType["idType"]["costPerMinuteRide"] + pausedSum*vehiculeType["idType"]["costPerMinuteParked"]
}
function minutes_between(time1, time2) {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    const diffMs = Math.abs(date2 - date1);
    return Math.round(diffMs / 60000); // Convert milliseconds to minutes
  }
module.exports = {adminAction,createVehicule,deleteVehicule,modifyVehicule,getVehicule,getVehicules,applyAction,trackVehicule,modifyVehiculeByImei}

