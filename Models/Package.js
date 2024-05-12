const mongoose = require("mongoose")

const packageSchema = new mongoose.Schema({
    packageName:{
        type:String,
        required:true
    },
    creditsOffer:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
},{
    timestamps:true,
})

module.exports = mongoose.model("Package",packageSchema)