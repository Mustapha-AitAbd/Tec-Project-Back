const mongoose = require("mongoose")

const SupportSchema = new mongoose.Schema({
    
    email:{
        type:String,
        // enum
    },
    phoneNumber:{
        type: String,
    },
    tva:{
        type:Number,
    },
    factureSchedule:{
        type:String,
    }
},{
    timestamps:false,
})

module.exports = mongoose.model("Support",SupportSchema)