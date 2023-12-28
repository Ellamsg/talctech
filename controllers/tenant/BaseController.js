const { Op } = require("sequelize");
const moment = require('moment');
const bcrypt = require("bcrypt");

// Models
const User = require("../../models").User;
const Tenant = require("../../models").TenantTerm;
const Landlord = require("../../models").LandlordTerm;
const Pairing = require("../../models").Pairing;
const Property = require("../../models").Property;
const RentProperty = require("../../models").RentProperty;
const Payment = require("../../models").Payment;
const Criteria = require("../../models").Criteria;
const PairCounter = require("../../models").PairCounter;
const Request = require("../../models").Request;
const PropertyVideo = require("../../models").PropertyVideo;
const Booking = require("../../models").Booking;
require('dotenv').config();


// Email Service
const emailService = require("../../services/EmailService");

const initSession = (req) => {
	req.session.email = req.body.email;
	req.session.phone = req.body.phone;
	req.session.name = req.body.name;
	req.session.paymentReason = 'Registration';
}

const pairMatchingLandlord = async (user) => {

	let tenant = await Tenant.findOne({
		where: {
			tenant_id: {
				[Op.eq]: user.id
			}
		}
	});

	let landlords = await Landlord.findAll({
		where: {
			[Op.and]: [
				{
					tenant_income: {
						[Op.gte]: tenant.income
					}
				},
				{
					professionals: tenant.professionals || 0
				},
				{
					electricity: {
						[Op.gte]: tenant.electricity
					}
				}
			]
		},
		include: {
			model: User,
			as: 'user'
		}
	});

	let paired = 0;
	let pairCount = null;

	// Add to pairing of the day
	for (let i = 0; i < landlords.length; i++) {
		const item = landlords[i];

		let isPaired = await Pairing.findOne({
			where: {
				tenant_id: user.id,
				landlord_id: (item.user) ? item.user.id : ''
			}
		});

		if (!isPaired) {

			await Pairing.create({
				tenant_id: user.id,
				landlord_id: (item.user) ? item.user.id : '',
			})

			paired++;

			// Notify
			if (item.user)
				emailService.sendMail(item.user.email, 'You have been paired with a new Tenant');
			emailService.sendMail(user.email, 'You have been paired with a new Landlord');

			pairCount = await PairCounter.findOne({
				where: {
					user_id: user.id,
					dated: moment().format('YYYY-MM-DD')
				}
			});

			if (pairCount) {
				await pairCount.update({
					count: pairCount.count + 1
				},
					{
						where: {
							id: pairCount.id
						}
					})
			}
			else {
				await PairCounter.create({
					count: 1,
					user_id: user.id,
					dated: moment().format('YYYY-MM-DD')
				});
			}
		}

		// Stop looping if we have paired twice
		if (paired >= 2)
			break;
	}
}

exports.paired = async (req, res) => {

	try {
		// Find pairing for Today
		let pairCount = await PairCounter.findOne({
			where: {
				user_id: {
					[Op.eq]: req.session.user.id
				},
				dated: {
					[Op.eq]: moment().format('YYYY-MM-DD')
				}
			}
		});

		// Process Pairing for Today
		if (pairCount && pairCount.count < 2) {
			await pairMatchingLandlord(req.session.user);
		}


		let landlords = await Pairing.findAll({
			where: {
				tenant_id: {
					[Op.eq]: req.session.user.id
				},
			},
			include: {
				model: User,
				as: 'landlord'
			}
		});

		res.render("dashboards/tenants/paired", {
			landlords: landlords,
			title: 'Properties Landlords',
			user: req.session.user,
			layout: 'layouts/tenant'
		});
	}
	catch (e) {
		req.flash('warning', 'Error: ' + e.message);
		res.redirect('back');
	}
}

exports.home = async (req, res) => {

	const booking = Booking.findOne({
		where: {
			user_id: {
				[Op.eq]: req.session.user.id
			}
		}
	});

	const properties = await Property.findAll({
		limit: 4
	});

	res.render('dashboards/tenants/index', {
		layout: 'layouts/tenant',
		user: req.session.user,
		properties: properties,
		bookings: booking,
		type: "normal"
	})
}

exports.properties = async (req, res) => {

	const properties = await Property.findAll({
		limit: 6
	});

	res.render('dashboards/tenants/properties', {
		layout: 'layouts/tenant',
		user: req.session.user,
		properties: properties,
		title: 'Properties',
		type: 'normal'
	})
}

exports.shortProperties = async (req, res) => {

	const properties = await RentProperty.findAll({
		limit: 6
	});

	res.render('dashboards/tenants/properties', {
		layout: 'layouts/tenant',
		user: req.session.user,
		properties: properties,
		title: 'Short Terms Properties',
		type: 'short'
	})
}

exports.payments = async (req, res) => {
	const payments = await Payment.findAll({
		where: {
			user_id: {
				[Op.eq]: req.session.userId
			}
		}
	});

	res.render('dashboards/tenants/payments', {
		layout: 'layouts/tenant',
		payments: payments,
		user: req.session.user
	});
}

const pairMatchingProperties = async (user, criteria) => {

	const properties = await Property.findAll({
		where: {
			property_type: criteria.property_type,
			offer_type: criteria.offer_type,
			neighbourhood: criteria.neighbourhood,
			city: criteria.city
		},
		include: {
			model: User,
			as: 'user'
		}
	});

	let paired = 0;
	let pairCount = null;

	// Add to pairing of the day
	for (let i = 0; i < properties.length; i++) {
		const item = properties[i];


		// Check if the property has not been paired
		let isPaired = await Pairing.findOne({
			where: {
				tenant_id: user.id,
				property_id: item.id
			}
		});

		if (!isPaired) {

			await Pairing.create({
				tenant_id: user.id,
				property_id: item.id,
			})

			paired++;

			// Notify
			emailService.sendMail(item.user.email, 'You have been paired with a new Tenant');
			emailService.sendMail(req.user.email, 'You have been paired with a new Landlord');

			pairCount = await PairCounter.findOne({
				where: {
					user_id: user.id,
					dated: moment().format('YYYY-MM-DD')
				}
			});

			if (pairCount) {
				await pairCount.update({
					count: pairCount.count + 1
				},
					{
						where: {
							id: pairCount.id
						}
					})
			}
			else {
				await PairCounter.create({
					user_id: user.id,
					count: 1,
					dated: moment().format('YYYY-MM-DD')
				});
			}
		}

		// Stop looping if we have paired twice
		if (paired >= 2)
			break;
	}
}

exports.pairedProperties = async (req, res) => {

	// Find pairing for Today
	const pairCount = await PairCounter.findOne({
		where: {
			user_id: {
				[Op.eq]: req.session.user.id
			},
			dated: {
				[Op.eq]: moment().format('YYYY-MM-DD')
			}
		}
	});

	// Get Criteria
	const criteria = await Criteria.findOne({
		where: {
			user_id: {
				[Op.eq]: req.session.userId
			}
		}
	});

	if (criteria) {

		// Process Pairing for Today
		if (pairCount && pairCount.count < 2) {
			await pairMatchingProperties(req.session.user, criteria);
		}

		// Get Paired Properties
		const properties = await Pairing.findAll({
			where: {
				tenant_id: req.session.user.id,
				property_id: {
					[Op.ne]: null
				}
			},
			include: {
				model: Property,
				as: 'property'
			}
		})

		res.render('dashboards/tenants/properties', {
			layout: 'layouts/tenant',
			user: req.session.user,
			properties: properties,
			title: 'Paired Properties',
			type: ''
		});
	}
	else {

		res.render('dashboards/tenants/properties', {
			layout: 'layouts/tenant',
			user: req.session.user,
			properties: [],
			message: 'Criteria not set',
			title: 'Paired Properties',
			type: ''
		});
	}
}

exports.addCriteria = async (req, res) => {
	res.render('dashboards/tenants/addCriteria', {
		layout: 'layouts/tenant',
		user: req.session.user,
		criteria: null,
		title: 'criteria',
	})
}

exports.editCriteria = async (req, res) => {

	const criteria = await Criteria.findOne({
		where: {
			id: {
				[Op.eq]: req.params.id
			}
		}
	});

	if (criteria) {
		res.render('dashboards/tenants/addCriteria', {
			layout: 'layouts/tenant',
			user: req.session.user,
			criteria: criteria,
			title: 'criteria',
		})
	}
	else {
		req.flash('warning', 'Criteria ID not recognized');
		res.redirect('back');
	}
}

exports.updateCriteria = async (req, res) => {

}

exports.criterias = async (req, res) => {

	const criteria = await Criteria.findOne({
		where: {
			user_id: {
				[Op.eq]: req.session.user.id
			}
		}
	});

	res.render('dashboards/tenants/criterias', {
		layout: 'layouts/tenant',
		user: req.session.user,
		criteria: criteria,
		title: 'criteria',
	})
}

exports.requestView = async (req, res) => {

	const property = await Property.findOne({
		where: {
			id: {
				[Op.eq]: req.params.id
			}
		},
	})

	if (property) {

	}
	else {
		res.redirect('/404');
	}
}

exports.requests = async (req, res) => {

	const requests = await Request.findAll({
		where: {
			user_id: {
				[Op.eq]: req.session.user.id
			}
		},
		include: {
			model: Property,
			as: 'property'
		}
	});

	res.render('dashboards/tenants/requests', {
		layout: 'layouts/tenant',
		user: req.session.user,
		requests: requests,
		title: 'Requests',
	})
}

exports.requestResponse = async (req, res) => {

	const response = await PropertyVideo.findOne({
		where: {
			request_id: {
				[Op.eq]: req.params.id
			}
		}
	})

	if (response) {
		res.render('dashboards/tenants/request', {
			layout: 'layouts/tenant',
			user: req.session.user,
			response: response,
			title: 'Request Response',
		})
	}
	else {
		req.flash('warning', 'No Response Found for this Request');
		res.redirect('back');
	}
}


exports.bookings = async (req, res) => {

	const bookings = await Booking.findAll({
		where: {
			user_id: {
				[Op.eq]: req.session.user.id
			}
		},
		include: {
			model: RentProperty,
			as: 'property'
		}
	})

	if (bookings) {
		res.render('dashboards/tenants/bookings', {
			layout: 'layouts/tenant',
			user: req.session.user,
			bookings: bookings,
			title: 'Bookings',
		})
	}
	else {
		req.flash('warning', 'No Bookings');
		res.redirect('back');
	}
}

exports.survey = async (req, res) => {

	const booking = await Booking.findOne({
		where: {
			id: {
				[Op.eq]: req.params.id
			}
		},
		include: {
			model: RentProperty,
			as: 'property'
		}
	})

	res.render('dashboards/tenants/survey', {
		layout: 'layouts/tenant',
		user: req.session.user,
		booking: booking,
		title: '',
	})
}

exports.register = async (req, res) => {

	try {
		var baseurl = process.env.BASE_URL;
		let tenant = null;
		let user = await User.findOne({
			where: {
				email: {
					[Op.eq]: req.body.email
				}
			}
		});

		if (user) {

			tenant = await Tenant.findOne({
				where: {
					tenant_id: {
						[Op.eq]: user.id
					}
				}
			})

			if (tenant) {
				res.json({
					error: true,
					message: 'The email has been used for Tenant Account'
				})
			}
		}
		else {
			user = await User.create({
				name: req.body.name,
				email: req.body.email,
				phone: req.body.phone,
				password: bcrypt.hashSync(req.body.password, 10),
				role_id: 3
			});
		}

		if (tenant == null) {

			tenant = await Tenant.create({
				tenant_id: user.id,
				tenant_employment: req.body.employment,
				tenant_income: req.body.income || 0,
				professionals: req.body.professional,
				smoker: req.body.smoke,
				drinker: req.body.drink,
				electricity: req.body.electricity,
				employed: req.body.employed
			})

			if (!user.email_verified) {
				try {
					let message = `
					<!DOCTYPE html>
	<html>
	<head>

	<meta charset="utf-8">
	<meta http-equiv="x-ua-compatible" content="ie=edge">
	<title>Email Confirmation</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style type="text/css">
	/**
	 * Google webfonts. Recommended to include the .woff version for cross-client compatibility.
	 */
	@media screen {
		@font-face {
		font-family: 'Source Sans Pro';
		font-style: normal;
		font-weight: 400;
		src: local('Source Sans Pro Regular'), local('SourceSansPro-Regular'), url(https://fonts.gstatic.com/s/sourcesanspro/v10/ODelI1aHBYDBqgeIAH2zlBM0YzuT7MdOe03otPbuUS0.woff) format('woff');
		}
		@font-face {
		font-family: 'Source Sans Pro';
		font-style: normal;
		font-weight: 700;
		src: local('Source Sans Pro Bold'), local('SourceSansPro-Bold'), url(https://fonts.gstatic.com/s/sourcesanspro/v10/toadOcfmlt9b38dHJxOBGFkQc6VGVFSmCnC_l7QZG60.woff) format('woff');
		}
	}
	/**
	 * Avoid browser level font resizing.
	 * 1. Windows Mobile
	 * 2. iOS / OSX
	 */
	body,
	table,
	td,
	a {
		-ms-text-size-adjust: 100%; /* 1 */
		-webkit-text-size-adjust: 100%; /* 2 */
	}
	/**
	 * Remove extra space added to tables and cells in Outlook.
	 */
	table,
	td {
		mso-table-rspace: 0pt;
		mso-table-lspace: 0pt;
	}
	/**
	 * Better fluid images in Internet Explorer.
	 */
	img {
		-ms-interpolation-mode: bicubic;
	}
	/**
	 * Remove blue links for iOS devices.
	 */
	a[x-apple-data-detectors] {
		font-family: inherit !important;
		font-size: inherit !important;
		font-weight: inherit !important;
		line-height: inherit !important;
		color: inherit !important;
		text-decoration: none !important;
	}
	/**
	 * Fix centering issues in Android 4.4.
	 */
	div[style*="margin: 16px 0;"] {
		margin: 0 !important;
	}
	body {
		width: 100% !important;
		height: 100% !important;
		padding: 0 !important;
		margin: 0 !important;
	}
	/**
	 * Collapse table borders to avoid space between cells.
	 */
	table {
		border-collapse: collapse !important;
	}
	a {
		color: #1a82e2;
	}
	img {
		height: auto;
		line-height: 100%;
		text-decoration: none;
		border: 0;
		outline: none;
	}
	</style>

	</head>
	<body style="background-color: #e9ecef;">

	<!-- start preheader -->
	<div class="preheader" style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
		Talctech Email Verification
	</div>
	<!-- end preheader -->

	<!-- start body -->
	<table border="0" cellpadding="0" cellspacing="0" width="100%">

		<!-- start logo -->
		<tr>
		<td align="center" bgcolor="#e9ecef">
			<!--[if (gte mso 9)|(IE)]>
			<table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
			<tr>
			<td align="center" valign="top" width="600">
			<![endif]-->
			<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
			<tr>
				<td align="center" valign="top" style="padding: 36px 24px;">
				<a href=${baseurl} target="_blank" style="display: inline-block;">
					<img src=${baseurl}/images/logo.jpg alt="Logo" border="0" width="60" style="display: flex; width: 60px; max-width: 60px; min-width: 60px;">
				</a>
				</td>
			</tr>
			</table>
			<!--[if (gte mso 9)|(IE)]>
			</td>
			</tr>
			</table>
			<![endif]-->
		</td>
		</tr>
		<!-- end logo -->

		<!-- start hero -->
		<tr>
		<td align="center" bgcolor="#e9ecef">
			<!--[if (gte mso 9)|(IE)]>
			<table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
			<tr>
			<td align="center" valign="top" width="600">
			<![endif]-->
			<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
			<tr>
				<td align="left" bgcolor="#ffffff" style="padding: 36px 24px 0; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; border-top: 3px solid #d4dadf;">
				<h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 48px;">Confirm Your Email Address</h1>
				</td>
			</tr>
			</table>
			<!--[if (gte mso 9)|(IE)]>
			</td>
			</tr>
			</table>
			<![endif]-->
		</td>
		</tr>
		<!-- end hero -->

		<!-- start copy block -->
		<tr>
		<td align="center" bgcolor="#e9ecef">
			<!--[if (gte mso 9)|(IE)]>
			<table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
			<tr>
			<td align="center" valign="top" width="600">
			<![endif]-->
			<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

			<!-- start copy -->
			<tr>
				<td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
		<h2> Hi ${req.body.name}, </h2>        
				<p style="margin: 0;"> You Have Successfully created an account with Talctech. Tap the button below to confirm your email address. If you didn't create an account with Talctech, you can safely delete this email.</p>
				</td>
			</tr>
			<!-- end copy -->

			<!-- start button -->
			<tr>
				<td align="left" bgcolor="#ffffff">
				<table border="0" cellpadding="0" cellspacing="0" width="100%">
					<tr>
					<td align="center" bgcolor="#ffffff" style="padding: 12px;">
						<table border="0" cellpadding="0" cellspacing="0">
						<tr>
							<td align="center" bgcolor="#1a82e2" style="border-radius: 6px;">
							<a href=${req.protocol + '://' + req.headers.host + '/verify?email=' + user.email} target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Verify Email</a>
							</td>
						</tr>
						</table>
					</td>
					</tr>
				</table>
				</td>
			</tr>
			<!-- end button -->

			<!-- start copy -->
			<tr>
				<td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
				<p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
				<p style="margin: 0;"><a href=${req.protocol + '://' + req.headers.host + '/verify?email=' + user.email} target="_blank">${req.protocol + '://' + req.headers.host + '/verify?email=' + user.email}</a></p>
				</td>
			</tr>
			<!-- end copy -->

			<!-- start copy -->
			<tr>
				<td align="left" bgcolor="#ffffff" style="padding: 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; border-bottom: 3px solid #d4dadf">
				<p style="margin: 0;">Cheers,<br> Talctech Team</p>
				</td>
			</tr>
			<!-- end copy -->

			</table>
			<!--[if (gte mso 9)|(IE)]>
			</td>
			</tr>
			</table>
			<![endif]-->
		</td>
		</tr>
		<!-- end copy block -->

		<!-- start footer -->
		<tr>
		<td align="center" bgcolor="#e9ecef" style="padding: 24px;">
			<!--[if (gte mso 9)|(IE)]>
			<table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
			<tr>
			<td align="center" valign="top" width="600">
			<![endif]-->
			<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">

			<!-- start permission -->
			<tr>
				<td align="center" bgcolor="#e9ecef" style="padding: 12px 24px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; color: #666;">
				<p style="margin: 0;">You received this email because we received a request for signing up for your TALCTECH account. If you didn't request signing up you can safely delete this email.</p>
				</td>
			</tr>
			<!-- end permission -->

			</table>
			<!--[if (gte mso 9)|(IE)]>
			</td>
			</tr>
			</table>
			<![endif]-->
		</td>
		</tr>
		<!-- end footer -->

	</table>
	<!-- end body -->

	</body>
	</html>`;

					emailService.sendMail(req.body.email, message);
				}
				catch (e) {

				}
			}

			req.session.userRole = 3;
			req.session.user = user;
			initSession(req);
			res.json({
				error: false,
				message: 'Account created successfully',
				redirect: '/pay'
			})
		}
	} // Check error
	catch (e) {
		res.json({
			error: true,
			stack: e,
			message: 'Error occur. Please try again'
		})
	}
}