const mongoose = require("mongoose")

const factureSchema = new mongoose.Schema({
    client:{
        type:String,
        ref:"Client"
    },
    totalcost:{
        type:Number,
        default:0
    },
    payementStatus:{
        type:String,
        default:"Pending",
        enum:["Pending","Passed","Incomplete","Error"]
    },
    trips:[{
        type:String,
        ref:"Trip"
    }]
},{
    timestamps:true,
})

module.exports = mongoose.model("Facture",factureSchema)