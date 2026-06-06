const prisma = require("../config/prisma");

const getWallet = async (userId) => {

    const wallet = await prisma.wallet.findUnique({
        where: {
            userId
        }
    });

    return wallet;
};

module.exports = {
    getWallet
};