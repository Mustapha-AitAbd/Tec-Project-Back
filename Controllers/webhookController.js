const stripe = require("stripe")(process.env.SSK)
const client = require("../Models/Client")

const endpointSecret = "whsec_QuzpKScQjlDVKDMkKmcvwLY7HOQSWwQR";
let webhookHandler = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(event.type)
  // Handle the event
  switch(event.type){
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      if(paymentIntentSucceeded.metadata["type"]=="Package"){
        console.log(paymentIntentSucceeded.metadata)
        await client.findByIdAndUpdate(paymentIntentSucceeded.metadata["client"],{$inc:{solde:paymentIntentSucceeded.metadata["credits"]}},{new: true }) 
      }
      break;
      case 'setup_intent.succeeded':
      const setupIntentSucceeded = event.data.object;
      await stripe.customers.update(setupIntentSucceeded.customer, { invoice_settings: { default_payment_method: setupIntentSucceeded.payment_method } })
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
}

module.exports = webhookHandler