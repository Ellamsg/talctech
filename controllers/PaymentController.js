const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const axios = require('axios');
const resizeOptimizeImages = require('resize-optimize-images');

// Models
const User = require("../models").User;
const Property = require("../models").Property;
const RentProperty = require("../models").RentProperty;
const Payment = require("../models").Payment;
const Booking = require("../models").Booking;
const parameters = require('../config/params');

const header = {
    headers: {
        Authorization: 'Bearer ' + parameters.RAVE_SECRET_KEY
    }
}

const makePayment = async (req, res, title, amount, plan = '') => {

    const post = {
        name: req.session.user.name,
        email: req.session.user.email,
        amount: amount,
        plan: plan,
        callback_url: req.protocol + '://' + req.headers.host + '/payment-redirect'
     }

    const header = {
        headers: {
            Authorization: 'Bearer ' + parameters.SECRET_KEY
        }
    }

    axios.post('https://api.paystack.co/transaction/initialize', post, header)
        .then(response => {
            if(response.data.status) {
                res.redirect(response.data.data.authorization_url);
            }
        })
        .catch(e => {
            req.flash('warning', "Payment could not initialized");
            res.redirect("back");
        });
}

exports.payment = async (req, res) => {
    if(req.session.paymentReason == 'Property') {
        makePayment(req, res, 'Property Posting Fee', parameters.PROPERTY_FEE);
    }
    else if(req.session.paymentReason == 'Upgrade') {
        makePayment(req, res, 'Account Upgrade Payment', parameters.EXECUTIVE_FEE, parameters.EXECUTIVE_PLAN_CODE);
    }
    else {
        req.flash('warning', "Payment could not initialized");
        res.redirect("back");
    }
}

exports.executive = async (req, res) => {

	const post = {
        tx_ref: 'talctech-tx-' + Math.random().toString(36).substr(2, 5),
        amount: 420000,
        currency: 'NGN',
        redirect_url: req.protocol + '://' + req.headers.host + 'payment-redirect',
        payment_options: 'card',
        payment_plan: parameters.EXECUTIVE_PLAN_CODE,
        customer: {
            name: req.session.user.name,
            email: req.session.user.email,
            phonenumber: req.session.user.phone
        },
        customizations: {
            title: 'Executive Tenant Plan',
            destination: '',
            logo: req.protocol + '://' + req.headers.host + 'assets/img/logo.jpg'
        }
    }

    axios.post('https://api.flutterwave.com/v3/payments', post, header)
        .then(response => {
            if(response.data.status) {
                res.redirect(response.data.data.link);
            }
        })
        .catch(e => {
            req.flash('warning', "Payment could not initialized");
            res.redirect("back");
        });
}


exports.landlord = async (req, res) => {

	const post = {
        tx_ref: 'talctech-tx-' + Math.random().toString(36).substr(2, 5),
        amount: 100,
        currency: 'NGN',
        redirect_url: req.protocol + '://' + req.headers.host + '/payment-redirect',
        payment_options: 'card',
        payment_plan: 13220,
        customer: {
            name: req.session.user.name,
            email: req.session.user.email,
            phonenumber: req.session.user.phone
        },
        customizations: {
            title: 'Upgrade To Executive',
            destination: '',
            logo: 'http://localhost:3000/images/logo.jpg'
        }
    }

    axios.post('https://api.flutterwave.com/v3/payments', post, header)
        .then(response => {
            if(response.data.status) {
                res.redirect(response.data.data.link);
            }
        })
        .catch(e => {
            req.flash('warning', "Payment could not initialized");
            res.redirect("back");
        });
}


exports.tenant = async (req, res) => {

	const post = {
        tx_ref: 'talctech-tx-' + Math.random().toString(36).substr(2, 5),
        amount: 100,
        currency: 'NGN',
        redirect_url: req.protocol + '://' + req.headers.host + '/payment-redirect',
        payment_options: 'card',
        payment_plan: 13220,
        customer: {
            name: req.session.user.name,
            email: req.session.user.email,
            phonenumber: req.session.user.phone
        },
        customizations: {
            title: 'Upgrade To Executive',
            destination: '',
            logo: 'http://localhost:3000/images/logo.jpg'
        }
    }

    axios.post('https://api.flutterwave.com/v3/payments', post, header)
        .then(response => {
            if(response.data.status) {
                res.redirect(response.data.data.link);
            }
        })
        .catch(e => {
            req.flash('warning', "Payment could not initialized");
            res.redirect("back");
        });
}


exports.renter = async (req, res) => {

	const post = {
        tx_ref: 'talctech-tx-' + Math.random().toString(36).substr(2, 5),
        amount: 100,
        currency: 'NGN',
        redirect_url: req.protocol + '://' + req.headers.host + '/payment-redirect',
        payment_options: 'card',
        payment_plan: 13220,
        customer: {
            name: req.session.user.name,
            email: req.session.user.email,
            phonenumber: req.session.user.phone
        },
        customizations: {
            title: 'Upgrade To Executive',
            destination: '',
            logo: 'http://localhost:3000/images/logo.jpg'
        }
    }

    axios.post('https://api.flutterwave.com/v3/payments', post, header)
        .then(response => {
            if(response.data.status) {
                res.redirect(response.data.data.link);
            }
        })
        .catch(e => {
            req.flash('warning', "Payment could not initialized");
            res.redirect("back");
        });
}

exports.paymentResponse = async (req, res) => {

    const reference = req.query.reference;
    const header = {
        headers: {
            Authorization: 'Bearer ' + parameters.SECRET_KEY
        }
    };

    axios.get('https://api.paystack.co/transaction/verify/' + reference, header)
        .then(async (response) => {
            // console.log(response);
            if(response.data.data.status == 'success') {
              
                let userSession = req.session.user;
                console.log('Emailsession',req.session.email);
                console.log('user Session: ',userSession, );
                const user = await User.findOne({
                    where: {
                        email: {
                            [Op.eq]: userSession.email
                        }
                    }
                });

                // Save payment details
                await Payment.create({
                    tx_ref: req.query.trxref,
                    transaction_id: reference,
                    tx_id: response.data.data.id,
                    amount: response.data.data.amount,
                    user_id: user.id
                });

                const reason = req.session.paymentReason;
                console.log(reason);
                console.log('here 1');
                // Registration
                if(reason && reason == 'Registration') {
                    console.log('here 2');
                    await User.update({
                        status: true
                    },
                    {
                        where: {
                            id: user.id
                        }
                    });

                    console.log('here 3');
                    
                    req.flash('success', 'Account created successfully');
                    res.redirect('/login');    
                }

                // Account Upgrade
                if(reason && reason == 'Upgrade') {

                    // axios.get('https://api.paystack.co/customer/' + req.session.user.email, header)
                    //     .then(response => {
                    //         console.log(response.data.data.subscriptions);

                    //     })
                    //     .catch(e => {

                    //     }) 
                    
                    await User.update({
                        role_id: 5,
                        upgraded: true
                    },
                    {
                        where: {
                            id: {
                                [Op.eq]: user.id
                            }
                        }
                    });

                    req.session.user.role_id = 5
                    req.flash('success', 'Account Upgraded successfully');
                    res.redirect('/dashboard');    
                }

                // Property Booking
                if(reason == 'Booking') {

                    await Booking.create({
                        user_id: user.id,
                        property_id: req.session.propertyID
                    });

                    req.flash('success', 'Property Booked successfully');
                    res.redirect('/dashboard');
                }

                // Property Posting
                if(reason == 'Property') {
                    await Property.update({ active: true }, {
                        where: {
                            id: {
                                [Op.eq]: req.session.property.id
                            }
                        }
                    });

                    req.flash('success', 'Property Added successfully');
                    res.redirect('/dashboard');
                }
            }
            else {
                res.send('Payment could not be verified');
            }
        })
        .catch(e => {
            console.log('Errorrr', e);
            res.send('Payment could not be verified '+e);
        })
        
}

exports.paymentFailure = async (req, res) => {
	res.send('Payment not made!')
}

exports.book = async (req, res) => {

    const property = await RentProperty.findOne({
        where: {
            id: {
                [Op.eq]: req.params.id
            }
        }
    })

    if(property) {
        req.session.paymentReason = 'Booking';
        req.session.propertyID = property.id;
        makePayment(req, res, 'Book Property', 100);
    }
    else {
        req.flash('warning', 'Property ID not recognized');
        res.redirect('back');
    }
}