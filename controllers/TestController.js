require('dotenv').config();
const axios = require('axios');
const emailService = require("../services/EmailService");
const parameters = require("../config/params");

exports.email = async (req, res, next) => {
	const {email} = req.query
	try {
		await emailService.sendMail(email, 'Hello World');
		res.send('Hello');
	}
	catch(e) {
		res.send(e.message);
	}

}

exports.testPayment = async(req, res, next) =>{
	try {
		const fee = parameters.LANDLORD_FEE;
        const plan = parameters.LANDLORD_PLAN_CODE;
		const post = {
			name: "Test Name",
			email: "test1@test.com",
			amount: Number(fee) * 100,
			plan: plan,
			callback_url: req.protocol + '://' + req.headers.host + '/payment-redirect'
		 }
		 console.log(post);
	
		const header = {
			headers: {
				Authorization: 'Bearer ' + parameters.SECRET_KEY
			}
		}
	
		const response = await axios.post('https://api.paystack.co/transaction/initialize', post, header);
		return res.status(200).send({
			response
		})
		
	} catch (error) {
		return res.status(500).send({
			message: "Payment could not initialized: "+error
		})
	}
}