const mongoose = require("mongoose")

//CHANGE zone MODEL NAME TO "ZONE"

const zoneSchema = new mongoose.Schema({
    zoneName:{
        type:String,
        required:true,
        unique:true
    },
    zoneType:{
        type:String,
        required:true,
        enum:["Parking","cityZone"]
    },
    zoneImage:{
        type:String,//base64 encoded
        default:"./pogo.png",
        required:true
    },
    longitude:{
        type:Number,
        required:true
    },
    latitude:{
        type:Number,
        required:true
    },
    zone:[{
        longitude:{
            type:Number,
            required:true
        },
        latitude:{
            type:Number,
            required:true
        },
    }]
},{
    timestamps:true,
})

module.exports = mongoose.model("Zone",zoneSchema)