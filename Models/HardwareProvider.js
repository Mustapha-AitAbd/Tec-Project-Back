const mongoose = require("mongoose")

const HardwareProviderSchema = new mongoose.Schema({
    HardwareKeyApi:{
        type:String,
        required:true
    },
    Model:{
        type:String
    },
    BaseUri:{
        type:String
    },
    Marque:{
        type:String
    }
},{
    timestamps:false,
})

module.exports = mongoose.model("HardwareProvider",HardwareProviderSchema)