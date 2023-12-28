require('dotenv').config();
const nodemailer = require("nodemailer");
const parameters = require('../config/params');

let transport = nodemailer.createTransport({
	host: parameters.EMAIL_HOST,
    port: parameters.EMAIL_PORT,
	secure: true, // true for 465, false for other ports
	tls: {
        rejectUnauthorized: false
    },
    ool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
	auth: {
	    user: parameters.EMAIL_USERNAME, // generated ethereal user
	    pass: parameters.EMAIL_PASSWORD // generated ethereal password
	},
	
});

// var transport = nodemailer.createTransport({
//   host: "smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "a1d9dcd558d94d",
//     pass: "7daf35b550709e"
//   }
// });


exports.sendMail = async (email, message, subject = 'Talctech Rentals') => {
	try {
		console.log(parameters);
		const mailOptions = {
			from: parameters.EMAIL_FROM, // sender address
		    to: email, // list of receivers
		    subject: subject, // Subject line
		    html: message
		}
		await transport.sendMail(mailOptions, (err, info)=>{
			if(err) throw err;
			console.log('Mail Sent');
		});
	}
	catch(e) {
		console.log("Error: " + e.message)
	}
}