const express = require('express');
const multer = require("multer");
const client = require("../Models/Client")
const facture = require("../Models/Facture")
const router = express.Router();
const stripe = require("stripe")(process.env.SSK)

router.get("/",(req,res)=>{
    res.send(`<form action="/zone/create" enctype="multipart/form-data" method="post">
    <div class="form-group">
      <input type="file" class="form-control-file" name="zoneImage">
      <input type="text" class="form-control" placeholder="zoneName" name="zoneName">
      <input type="text" class="form-control" placeholder="zoneType" name="zoneType">
      <input type="text" class="form-control" placeholder="longitude" name="longitude">
      <input type="text" class="form-control" placeholder="latitude" name="latitude">
      <input type="submit" value="Get me the stats!" class="btn btn-default">            
    </div>
  </form>`)
})
router.post('/fixDefault', async (req, res) => {
  let result={}
  try{
    let factures = await facture.find({client:req.body.client,payementStatus:"Pending"}).populate("client").lean()
    // for(let c of cust.data){
    //   if(c.invoice_settings.default_payment_method==null){
    //     let p = await stripe.customers.listPaymentMethods(
    //       c.id,
    //       {type: 'card'}
    //     )
    //     if(p.data.length!=0){
    //       result = await stripe.customers.update( c.id, { invoice_settings: { default_payment_method: p.data[0].id } }) 
    //     }
    //   }
    // }
      res.send({result:factures})
    }catch(e){
      console.log(e)
      res.send(e)
    }
})
router.post('/pay', async (req, res) => {
  try{
    let result = await stripe.customers.update(req.body.cus, { invoice_settings: { default_payment_method: req.body.pmi } })
    const customer = await stripe.customers.retrieve(
      req.body.cus
      );
      res.send({customer:customer,result:result})
    }catch(e){
      console.log(e)
      res.send(e)
    }
})
router.post("/testing",async (req,res)=>{
  await client.updateMany({}, { $set: { role: '64679f50cb90260ce5cfc533' } })
  res.send("Done")
})
module.exports = router