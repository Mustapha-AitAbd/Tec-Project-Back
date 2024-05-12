const mongoose = require("mongoose")

const VehiculeTypeSchema = new mongoose.Schema({
    typeName:{
        type:String,
        required:true,
        unique:true
    },
    costPerMinuteParked:{
        type:Number,
        required:true
    },
    costPerMinuteRide:{
        type:Number,
        required:true
    },
    image:{
        type:String
    },
    batteryProfile:{
        v100:{
            type:Number,
            required:true,
        },
        v80:{
            type:Number,
            required:true,
        },
        v60:{
            type:Number,
            required:true,
        },
        v40:{
            type:Number,
            required:true,
        },
        v20:{
            type:Number,
            required:true,
        }
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("VehiculeType",VehiculeTypeSchema)