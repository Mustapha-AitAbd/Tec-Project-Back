// const pug = require("pug")
const path = require('path')
const bodyParser = require("body-parser")
const express = require("express")
const cors = require("cors")
const app = express()
const fileUpload = require("express-fileupload");

app.use(cors({
    origin: 'http://localhost:3000'
  }));

// app.use(cors({credentials:true,origin:"http://localhost:7080"}))
// app.set("view engine", "pug")
// app.set("views","./Views")
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'.env'})
}

const webhookController = require("./Controllers/webhookController")
app.use('/webhook', express.raw({type: 'application/json'}), webhookController);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

const testRoute = require("./Controllers/testController")
app.use("/test",testRoute)

const clientRouter = require("./Routes/clientRoute")
app.use("/client",clientRouter)

const userRouter = require("./Routes/userRoute")
app.use("/user",userRouter)

const vehiculeTypeRouter = require("./Routes/vehiculeTypeRoute")
app.use("/vehiculeType",vehiculeTypeRouter)

const zoneRouter = require("./Routes/zoneRoute")
app.use("/zone",zoneRouter)

const vehiculeRouter = require("./Routes/vehiculeRoute")
app.use("/vehicule",vehiculeRouter)

const tripRouter = require("./Routes/tripRoute")
app.use("/trip",tripRouter)

const packageRouter = require("./Routes/packageRoute")
app.use("/package",packageRouter)

const hardwareRouter = require("./Routes/hardwareRoute")
app.use("/hardware",hardwareRouter)

const rentRouter = require("./Routes/rentRoute")
app.use("/rent",rentRouter)

const rentOfferRouter = require("./Routes/rentOfferRoute")
app.use("/rentOffer",rentOfferRouter)

const hardwareProviderRouter = require("./Routes/hardwareProviderRoute")
app.use("/hardwareProvider",hardwareProviderRouter)

const roleRouter = require("./Routes/roleRoute")
app.use("/role",roleRouter)

const supportRouter = require("./Routes/supportRoute")
app.use("/support",supportRouter)

module.exports = app