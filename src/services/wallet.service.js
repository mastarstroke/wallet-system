const prisma = require("../config/prisma");

const getWallet = async (userId) => {

    const wallet = await prisma.wallet.findUnique({
        where: {
            userId
        }
    });

    return wallet;
};


const fundWallet = async (
    userId,
    amount,
    description
) => {

    return await prisma.$transaction(
        async (tx) => {

            const wallet = await tx.wallet.findUnique({
                where: {
                    userId
                }
            });

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            const balanceBefore = Number(wallet.balance);

            const balanceAfter =
                balanceBefore + Number(amount);

            const transaction =
                await tx.transaction.create({
                    data: {
                        reference:
                            `FUND-${Date.now()}`,
                        walletId: wallet.id,
                        amount,
                        type: "FUNDING",
                        status: "SUCCESS",
                        description
                    }
                });

            await tx.wallet.update({
                where: {
                    id: wallet.id
                },
                data: {
                    balance: balanceAfter
                }
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId:
                        transaction.id,
                    walletId: wallet.id,
                    debit: 0,
                    credit: amount,
                    balanceAfter
                }
            });

            return {
                transaction,
                balanceAfter
            };
        }
    );
};


module.exports = {
    getWallet,
    fundWallet
};
