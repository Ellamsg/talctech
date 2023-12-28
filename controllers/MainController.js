const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const resizeOptimizeImages = require('resize-optimize-images');


// Models
const User = require("../models").User;
const Property = require("../models").Property;
const RentProperty = require("../models").RentProperty;

exports.propertyDetails = async (req, res) => {
	const prop = req.query.properties;
	console.log(prop);
	let property;
	if (prop === "short") {
		property = await RentProperty.findOne({
			where: {
				id: req.params.id
			},
			include: {
				model: User,
				as: 'user'
			}
		});
		
	}
	if (prop === "normal") {
		property = await Property.findOne({
			where: {
				id: req.params.id
			},
			include: {
				model: User,
				as: 'user'
			}
		});
		
	}
	// console.log(property,req.params.id);

	res.render('base/property', {
		user: req.session.user,
		property: property,
		isShortTerms: false,
	});
}

exports.shortTermsPropertyDetails = async (req, res) => {
	const property = await RentProperty.findOne({
		where: {
			id: {
				[Op.eq]: req.params.id
			}
		},
		include: {
			model: User,
			as: 'user'
		}
	});

	res.render('base/property', {
		user: req.session.user,
		property,
		isShortTerms: true,
	});
}

exports.dashboard = async (req, res) => {

	if(req.session.user.role_id == 3 || req.session.user.role_id == 5) {
		res.redirect('/tenant');
	}
	else if(req.session.user.role_id == 4) {
		res.redirect('/renter');
	}
	else if(req.session.user.role_id == 1) {
		res.redirect('/admin');
	}
	else {
		res.redirect('/landlord');
	}
}

exports.prepVideo = async (req, res) => {
	res.send('Soon');
}