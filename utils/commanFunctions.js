const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { decrypt } = require("dotenv");
const nodemailer = require("nodemailer");
require("dotenv").config();

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = process.env.ENCRYPTION_KEY;
const IV = process.env.IV;

const hashPassword = async (password) => {
  try {
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY, "utf8"),
      IV
    );
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (err) {
    console.error("Error hashing password:", err);
    throw err;
  }
};

const decryptPassword = (encryptedPassword) => {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY, "utf8"),
      IV
    );
    let decrypted = decipher.update(encryptedPassword, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Error decrypting password:", err);
    throw err;
  }
};

const comparePassword = async (password, storedEncryptedPassword) => {
  try {
    const decryptedPassword = decryptPassword(storedEncryptedPassword);
    return password === decryptedPassword;
  } catch (err) {
    console.error("Error comparing password:", err);
    throw err;
  }
};

const generatePassword = (length = 12) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  let password = "";
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }

  return password;
};

const sendEmail = async (to, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = {
  hashPassword,
  comparePassword,
  generatePassword,
  decryptPassword,
  sendEmail,
};
