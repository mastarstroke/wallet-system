const prisma = require("../config/prisma");

const getTransactions = async (
    userId,
    query
) => {

    const wallet = await prisma.wallet.findUnique({
        where: {
            userId
        }
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    return await prisma.transaction.findMany({
        where: {
            walletId: wallet.id
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
            createdAt: "desc"
        }
    });
};

const getTransactionByReference = async (
    userId,
    reference
) => {

    const wallet = await prisma.wallet.findUnique({
        where: {
            userId
        }
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    return await prisma.transaction.findFirst({
        where: {
            reference,
            walletId: wallet.id
        },
        include: {
            ledgerEntries: true
        }
    });
};

module.exports = {
    getTransactions,
    getTransactionByReference
};