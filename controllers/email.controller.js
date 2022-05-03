"use strict";

const nodemailer = require("nodemailer");

const sendEmail = async (from, to, subject, body) => {
	const transport = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: +process.env.SMTP_PORT,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_KEY
		}
	});
	if (await transport.verify()) {
		return await transport.sendMail({ from, to, subject, html: body });
	}
	return false;
};

module.exports = { sendEmail };