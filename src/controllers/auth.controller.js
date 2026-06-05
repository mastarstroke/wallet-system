const { validationResult } = require("express-validator");

const authService = require("../services/auth.service");

const { generateToken } = require("../utils/jwt");

exports.register = async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array()
      });
    }

    const user = await authService.register(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

exports.login = async (req, res) => {

  try {

    const user = await authService.login(
      req.body.email,
      req.body.password
    );

    const token = generateToken(user);

    return res.json({
      success: true,
      token
    });

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: error.message
    });

  }
};