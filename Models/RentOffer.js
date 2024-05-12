const mongoose = require("mongoose")

const rentOfferSchema = new mongoose.Schema({
    prix:{
        type:Number,
        required:true
    },
    vehiculeType:{
        vehicule:{
            type:String,
            ref:"VehiculeType",
            required:true
        },
        vehiculeDescription:[{
            type:String,
        }],
    },
    maxDistance:{
        type:Number,
        required:true
    },
    description:[{
        type:String,
    }],
    period:{
        type:Number
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("RentOffer",rentOfferSchema)