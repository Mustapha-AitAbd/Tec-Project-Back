const mongoose = require("mongoose")

const roleSchema = new mongoose.Schema({
    roleName:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        default:""
    },
    privileges:[{
        type:String,
        enum: ["Vehicule Action","Vehicules Force Action","Get Vehicules",
        "Add Vehicules","Details Vehicules","Edit Vehicules","Delete Vehicules", "Get Clients","Add Clients", "Edit Clients",
        "Delete Clients", "Get Trips", "Details Trip","Get Payments","Get Zones","Add Zones","Edit Zones","Delete Zones",
        "Get RentOffers","Add RentOffers","Edit RentOffers","Delete RentOffers","Get Rents","Add Rents","Details Rents",
        "Edit Rent","Delete Rents","Get Packages","Add Packages","Edit Packages","Delete Packages","Get Roles","Add Roles",
        "Edit Roles","Delete Roles","Get Invoices","Details invoices","Manual Payment","Get User","Add User","Edit Users","Delete Users"]
    }]
},{
    timestamps:true,
})

module.exports = mongoose.model("Role",roleSchema)