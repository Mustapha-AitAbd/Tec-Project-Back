const mongoose = require("mongoose")

const deduplicateValues = (values) => {
    return [...new Set(values)];
  };

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
    },
    lastName:{
        type:String,
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    email:{
        type:String,
        required:true,
        unique:true,
        minlength: 12
    },
    role:{
        type:String,
        ref:"Role"
    }
},{
    timestamps:true,
})

module.exports = mongoose.model("User",userSchema)