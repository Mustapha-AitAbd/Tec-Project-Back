let mongoose = require("mongoose")
// let Hardware = require(".")
let vehiculeSchema = mongoose.Schema({
    _id:{
        type:Number
    },
    idType:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "VehiculeType"
    },
    vehiculeStatus:{
        type:String,
        required:true,
        enum:["active","maintenance","inactive","paused"],
        default:"inactive"
    },
    batteryLevel:{
        type:Number,
        default:100
    },
    lastCoords:{
        longitude:{
            type:Number,
            required:true,
            default:-7.9891608
        },
        latitude:{
            type:Number,
            required:true,
            default:31.6258257
        }
    },
    lastParking:{
        type:String,
        default:null
    },
    isClean:{
        type:Boolean,
        default:true
    },
    // licensePlate:{
    //     type:String,
    //     unique:true,
    //     required:true
    // },
    lastUser:{
        type:String,
        default:null
    },
    lastUsedDate:{
        type:Date,
        default:null
    },
    hardware:{
        type: Number,
        ref: "Hardware"
    },
    city:{
        type:String
    },
    rented:{
        type:Boolean,
        default:false
    },
    rentOffer:{
        type:String,
        ref:"RentOffer"
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("Vehicule",vehiculeSchema)