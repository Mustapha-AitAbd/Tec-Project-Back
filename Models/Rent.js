const mongoose = require("mongoose")

const rentSchema = new mongoose.Schema({
    address:{
        type:String,
        required:true
    },
    fullName:{
        type:String,
    },
    clientId:{
        type:String,// String can client peut être guest
        ref:"Client"
    },
    phoneNumber:{
        type:String,// String for country code numbers,
        required:true
    },
    pickupDate:{
        type:Date,
        required:true
    },
    returnDate:{
        type:Date,
        required:true
    },
    email:{
        type:String,
        minlength: 10
    },
    amount:{
        type:Number,
        required:true,
        default:1
    },
    rentOffer:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"RentOffer"
    },
    orderStatus:{
        type:String,
        enum:["Processing","Confirmed","Delivered","Returned","Cancelled"],
        default:"Processing"
    },
    orderType:{
        type:String,
        enum:["instant","onArrival"],
        required:true,
        default:"onArrival"
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("Rent",rentSchema)