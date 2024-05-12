let mongoose = require("mongoose")

let tripSchema = mongoose.Schema({
    clientId:{
        type:String,
        required:true
    },
    paymentStatus:{
        type:String,
        default:"Pending",
        enum:["Pending","Succeeded","Failed"]
    },
    currentState:{
        type:String,
        default:"Running",
        enum:["Paused","Running","Verification","Ended"]
    },
    vehiculeId:{
        type:Number,
        required:true,
        ref:"Vehicule"
    },
    startTime:{
        type:Date,
        required:true
    },
    endTime:{
        type:Date,
        default:null,
        // required:true
    },
    startParking:{
        type:String,
        // required:true
    },
    endParking:{
        type:String,
        default:null,
        // required:true
    },
    tripImage:{
        type:String,
        default:null
    },
    coords:[{
        aboveLimit:{
            type:Boolean
        },
        time:{
            type:Date,
            required:true
        },
        state:{
            type:String,
            enum:["Paused","Running","Ended"],
            default:"Running"
        },
        longitude:{
            type:Number,
        },
        latitude:{
            type:Number,
        },
    }],
    totalcost:{
        type:Number,
        required:true,
        default:0
    },
    distance:{
        type:Number,
        default:0
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("Trip",tripSchema)