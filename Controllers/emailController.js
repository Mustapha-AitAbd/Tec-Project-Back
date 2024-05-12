let fs = require("fs")
let nodemailer = require("nodemailer")
let path = require("path")
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path:'.env'})
}


async function sendEmail(username,id,email,pin){
    let page 
    if(pin==null){
      page = fs.readFileSync(path.join(__dirname+"/../private/verifyEmail.html"),'utf8').replaceAll("${#id#}", id).replaceAll("${#username#}",username)
    }else{
      page = fs.readFileSync(path.join(__dirname+"/../private/pinEmail.html"),'utf8').replaceAll("${#username#}",username).replaceAll("${#pin#}",pin)
    }
    let transporter = nodemailer.createTransport({
        host: process.env.emailHost,
        port: process.env.emailPort,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.email, // generated ethereal user
          pass: process.env.password, // generated gmail app password
        },
      });
        let info = await transporter.sendMail({
        from: `"POGO" <${process.env.email}>`, // sender address
        to: email, // list of receivers
        subject: pin?"Hello, your code is "+pin : "Welcome, please verify your account", // Subject line
        text: pin?"Hello, you've recently requested for a password change, your code is "+pin : `Please go to this url to activate your account: http://gounane.ovh:3000/client/activate?id=${id}`, // plain text body
        html: page, // html body
      });
      // console.log(info)
      return info
}
module.exports = {sendEmail}