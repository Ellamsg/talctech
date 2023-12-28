const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const resizeOptimizeImages = require('resize-optimize-images');
require('dotenv').config()

// Models
const User = require("../../models").User;
const Tenant = require("../../models").TenantTerm;
const Landlord = require("../../models").LandlordTerm;
const Pairing = require("../../models").Pairing;
const RentProperty = require("../../models").RentProperty;
const Payment = require("../../models").Payment;
const Renter = require("../../models").Renter;

const emailService = require('../../services/EmailService');

const initSession = (req) => {
    req.session.email = req.body.email;
    req.session.phone = req.body.phone;
    req.session.name  = req.body.name;  
    req.session.paymentReason = 'Registration';                            
}

exports.addProperty = async (req, res) => {
	res.render('dashboards/renters/addProperty', {
		layout: 'layouts/renter',
		user: req.session.user || null,
		edit: false
	})
}

exports.editProperty = async (req, res) => {

	const property = await RentProperty.findOne({
        where: {
            id: {
                [Op.eq]: req.params.id
            }
        }
    });

    if(property) {
    	res.render('dashboards/renters/addProperty', {
			layout: 'layouts/renter',
			user: req.session.user || null,
			edit: true,
			property: property
		})
    }
    else {
    	req.flash('error', "Invalid property!");
        res.status(404).render('base/404');
    }
}

exports.payments = async (req, res) => {
	const payments = await Payment.findAll({
		where: {
			user_id: {
                [Op.eq]: req.session.userId
            }
		}
	});

	res.render('dashboards/renters/payments', {
		layout: 'layouts/renter',
		payments: payments,
		user: req.session.user || null
	});
}

// constants
const storage = multer
    .diskStorage({
        destination: "./public/uploads/shortproperties/",
        filename: async function (req, file, cb) {
            cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
        },
    });

const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|JPEG|JPG|PNG|GIF/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Images only!"));
    }
}

// init upload 
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).fields([{
        name: 'image_front'
    },
    {
        name: 'image_side'
    },
    {
        name: 'image_rear'
    }
]);

exports.saveProperty = async (req, res) => {

	upload(req, res, async (e) => {
		if(e) {
			req.flash('error', "Check images and try again!");
            res.redirect("back");
		}

		// if(req.files.image_front == "" || req.files.image_front == null || req.files.image_front == undefined) {
	 //        req.flash('warning', "Enter front image");
	 //        res.redirect("back");
	 //    }

        if((req.files.image_front == "" || req.files.image_front == null) && req.body.front == "") {
            req.flash('warning', "Upload front image OR select from the Default");
            res.redirect("back");
        } 

        const side = (req.files.image_side) ? req.files.image_side[0].filename : req.body.side;
        const rear = (req.files.image_rear) ? req.files.image_rear[0].filename : req.body.rear;
        const front = (req.files.image_front) ? req.files.image_front[0].filename : req.body.front;

		// Prep
		let user_id = req.session.userId;
	    let property_type = req.body.property;
	    let offer_type = req.body.offer;
	    let price = req.body.price;
	    let city = req.body.city;
	    let neighbourhood = req.body.neighbourhood;
	    let bedrooms = req.body.bedrooms;
	    let bathrooms = req.body.bathrooms;
	    let image_front = front;
        let image_side = side;
        let image_rear = rear;

	    // Save
	    const create = await RentProperty.create({
	        user_id,
	        property_type,
	        offer_type,
	        price,
	        city,
	        neighbourhood,
	        bedrooms,
	        bathrooms,
	        image_front,
	        image_side,
	        image_rear
	    });

	    if(create) {

	    	const options = {
	            images: [
	            	`./public/uploads/shortproperties/${image_front}`,
	                `./public/uploads/shortproperties/${image_side}`,
	                `./public/uploads/shortproperties/${image_rear}`
	            ],
	            width: 800,
	            height: 500,
	            quality: 100
	        };

	        await resizeOptimizeImages(options);

	        req.flash('success', "Property added successfully");
	        res.redirect("/renter/properties");
	    }
	    else {
	    	req.flash('warning', "Property not added");
	        res.redirect("back");
	    }
	});	
}

exports.updateProperty = async (req, res) => {
    upload(req, res, async (e) => {
		if(e) {
			req.flash('error', "Check images and try again!");
            res.redirect("back");
		}

		// if(req.files.image_front == "" || req.files.image_front == null || req.files.image_front == undefined) {
	 //        req.flash('warning', "Enter front image");
	 //        res.redirect("back");
	 //    }

        if((req.files.image_front == "" || req.files.image_front == null) && req.body.front == "") {
            req.flash('warning', "Upload front image OR select from the Default");
            res.redirect("back");
        } 

        const side = (req.files.image_side) ? req.files.image_side[0].filename : req.body.side;
        const rear = (req.files.image_rear) ? req.files.image_rear[0].filename : req.body.rear;
        const front = (req.files.image_front) ? req.files.image_front[0].filename : req.body.front;
        const id = req.body.id

		// Prep
		let user_id = req.session.userId;
	    let property_type = req.body.property;
	    let offer_type = req.body.offer;
	    let price = req.body.price;
	    let city = req.body.city;
	    let neighbourhood = req.body.neighbourhood;
	    let bedrooms = req.body.bedrooms;
	    let bathrooms = req.body.bathrooms;
	    let image_front = front;
        let image_side = side;
        let image_rear = rear;

	    // Save
	    const create = await RentProperty.update({
	        user_id,
	        property_type,
	        offer_type,
	        price,
	        city,
	        neighbourhood,
	        bedrooms,
	        bathrooms,
	        image_front,
	        image_side,
	        image_rear
	    }, {where:{id}});

	    if(create) {

	    	const options = {
	            images: [
	            	`./public/uploads/shortproperties/${image_front}`,
	                `./public/uploads/shortproperties/${image_side}`,
	                `./public/uploads/shortproperties/${image_rear}`
	            ],
	            width: 800,
	            height: 500,
	            quality: 100
	        };

	        await resizeOptimizeImages(options);

	        req.flash('success', "Property updated successfully");
	        res.redirect("/renter/properties");
	    }
	    else {
	    	req.flash('warning', "Property not added");
	        res.redirect("back");
	    }
	});	
}

exports.properties = async (req, res) => {
	RentProperty.findAll({
        where: {
            user_id: {
                [Op.eq]: req.session.userId
            }
        }
    })
    .then(properties => {
        res.render("dashboards/renters/properties", {
        	layout: 'layouts/renter',
        	user: req.session.user || null,
            properties: properties
        });
    })
    .catch(error => {
        req.flash('error', "Server error!");
        res.redirect("back");
    });
}

exports.home = async (req, res) => {

    const properties = await RentProperty.findAll({
        where: {
            user_id: {
                [Op.eq]: req.session.user.id
            }
        },
        limit: 5
    });

	res.render('dashboards/renters/index', { 
		layout: 'layouts/renter',
		edit: false,
        properties,
        type: "short"
	})
}

exports.register = async (req, res) => {

	try {

        var baseurl = process.env.BASE_URL;
        let renter = null;

        let user = await User.findOne({
            where: {
                email: {
                    [Op.eq]: req.body.email
                }
            }
        });

        if(user) {

            renter = await Renter.findOne({
                where: {
                    user_id: {
                        [Op.eq]: user.id
                    }
                }
            })

            if(renter) {
                res.json({
                    error: true,
                    message: 'The email has been used for renter Account'
                });
            }
        }
        else {
            user = await User.create({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: bcrypt.hashSync(req.body.password, 10),
                role_id: 4,
                status: true
            });
        }

        if(renter == null) {
            renter = await Renter.create({
                user_id: user.id,
                tenant_employment: req.body.employed,
                tenant_income: req.body.income,
                professionals: req.body.professional,
                smoker: req.body.smoker,
                drinker: req.body.drinker,
                electricity: req.body.electricity
            })

            if(!user.email_verified) {
               try{

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
               catch(e) {
                   console.log('Error', e);
               }
            }
            req.session.user = user;

            res.json({
                error: false,
                message: 'Account created successfully',
                redirect: '/login'
            })
        }
    }
    catch(e) {
        res.json({
            error: true,
            message: 'Error occur. Please try again'
        })
    }
}