var stripeHandler = StripeCheckout.configure({
    key: SPK,
    locale:'auto',
    token: function(token){
        alert("payment test success, token: "+token)
    }
})
let testPay = function() {

    // let price = document.querySelector("#amount").value * 100
    // stripeHandler.open({
    //     amount:price
    // })

    fetch("/PayForTrip",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({calculatedPrice:150})
    }).then(response=>{
        alert("success")
    }).catch(response=>{
        alert("fail")
    })
}