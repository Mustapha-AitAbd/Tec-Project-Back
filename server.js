const mongoose = require("mongoose")
const app = require("./app")

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'./.env'})
}


mongoose.connect(process.env.DB_URI)
console.log("Database Connected!")

app.listen(8083,()=>{
    console.log("Server online!")
})