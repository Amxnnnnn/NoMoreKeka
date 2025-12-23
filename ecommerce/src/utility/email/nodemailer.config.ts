import nodemailer from 'nodemailer'

const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

if(!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("Missing EMAIL_USER or EMAIL_PASSWORD on .env")
    process.exit(1)
}

export const transporter = nodemailer.createTransport({
    service: "gmail",

    host: 'smtp.gmail.com',
    port:465, // ssl port (secure hota hai)
    secure: true,

    auth:{
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
 })

transporter.verify((error,success)=>{
    if(error){
        console.error("Nodemailer transporrter error : ",error.message)
    } else {
        console.log('Nodemailer is ready to send emails')
    }
})