const mongoose = require("mongoose")

const packetSchema = new mongoose.Schema({
    IMEI:{
        type: String,
    },
    lon:{
        type: Number,
    },
    lat:{
        type: Number,
    },
    alitude:{
        type: Number,
    },
    angel:{
        type: Number,
    },
    satellites:{
        type: Number,
    },
    speedGps:{
        type: Number,
    },
    ignition:{
        type: Number,
    },
    gpsTimestamp:{
        type: String,
    },
    extendedData:{
        vehicleBattery:{
            type:Number
        },
        externalVoltage:{
            type:Number
        },
        DIN1:{
            type:Number
        },
    },
    },{
      timestamps:true,
})
  
module.exports = mongoose.model("Packet",packetSchema)