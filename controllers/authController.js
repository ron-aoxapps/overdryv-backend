const prisma = require("../client/prismaClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { sendSuccess, sendError } = require("../utils/responses");
const { CODES } = require("../utils/statusCodes");

const authController = {};

// ----------------- SIGNUP -----------------
authController.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, {}, "All fields are required.", CODES.BAD_REQUEST);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return sendError(res, {}, "Email is already in use.", CODES.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role: "user",
        password: hashedPassword,
        status: "active",
      },
    });

    return sendSuccess(
      res,
      { userId: user.id },
      "Signup completed successfully.",
      CODES.CREATED,
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return sendError(res, error.message, CODES.INTERNAL_SERVER_ERROR);
  }
};

// ----------------- LOGIN -----------------
authController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        {},
        "Email and password are required.",
        CODES.BAD_REQUEST,
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return sendError(res, {}, "User not found.", CODES.BAD_REQUEST);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, {}, "Invalid password.", CODES.BAD_REQUEST);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      "Login successful.",
      CODES.OK,
    );
  } catch (error) {
    console.error("Login Error:", error);
    return sendError(res, error.message, CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = authController;
