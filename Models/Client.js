const mongoose = require("mongoose")

const clientSchema = new mongoose.Schema({
    nom:{
        type:String,
        required:true,
    },
    prenom:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        minlength: 10
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    customerId:{
        type:String,
        required:true,
        unique:true
    },
    // currentPayingMethodId:{
    //     type:String,
    //     // required:true,
    // },
    city:{
        type:String
    },
    accountBanned:{
        type:Boolean,
        default:false,
    },
    accountActivated:{
        type:Boolean,
        default:false,
    },
    solde:{
        type:Number,
        default:100,
        min:0
    },
    payementType:{
        type:String,
        default:"solde",
        enum:["solde","card"]
    },
    language:{
        type:String,
        default:"English"
    },
    phoneNumber:{
        type:String,
    },
    pinCode: {
        type: String
    },
    role:{
        type:String,
        default:"64679f50cb90260ce5cfc533",
        ref:"Role"
    },
    discount:{
        type:Number,
        default:0
    }
},{
    timestamps:true,
})

clientSchema.methods.expirePinCode = function() {
    this.pinCode = undefined;
    return this.save();
  };
module.exports = mongoose.model("Client",clientSchema)