const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const {
    createAuditLog
} = require("./audit.service");

const register = async (data) => {

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,

      wallet: {
        create: {}
      }
    },
    include: {
      wallet: true
    }
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: "REGISTER",
    entityType: "USER",
    entityId: user.id,
    description: "User registered account"
  });

  return user;
};

const login = async (email, password) => {

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(
    password,
    user.password
  );

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  // Audit log
  await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      description: "User logged in"
  });

  return user;
};

module.exports = {
  register,
  login
};