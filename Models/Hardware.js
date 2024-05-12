const mongoose = require("mongoose")

const HardwareSchema = new mongoose.Schema({
    _id:{//IMEI
        type:Number,
    },
    simNumber:{
        type:String,
    },
    simOperator:{
        type:String,
        // enum
    },
    hardwareProvider:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "HardwareProvider"
    }
},{
    timestamps:false,
})

module.exports = mongoose.model("Hardware",HardwareSchema)