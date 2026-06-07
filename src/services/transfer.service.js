const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");
const { v4: uuid } = require("uuid");

const MAX_RETRIES = 3;

const transferFunds = async (
    senderUserId,
    receiverEmail,
    amount
) => {

const transferAmount = new Prisma.Decimal(amount);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await prisma.$transaction(
                async (tx) => {

                    // Find sender wallet
                    const senderWallet =
                        await tx.wallet.findUnique({
                            where: {
                                userId: senderUserId
                            }
                        });

                    if (!senderWallet) {
                        throw new Error(
                            "Sender wallet not found"
                        );
                    }

                    // Find receiver wallet
                    const receiverUser =
                        await tx.user.findUnique({
                            where: {
                                email: receiverEmail
                            },
                            include: {
                                wallet: true
                            }
                        });

                    if (!receiverUser) {
                        throw new Error(
                            "Receiver not found"
                        );
                    }

                    const receiverWallet = receiverUser.wallet;

                    if (!receiverWallet) {
                        throw new Error(
                            "Receiver wallet not found"
                        );
                    }

                    if (
                        senderWallet.id === receiverWallet.id
                    ) {
                        throw new Error(
                            "Cannot transfer to yourself"
                        );
                    }


                    // Lock both wallets in a consistent order to prevent deadlocks
                    const walletIds = [
                        senderWallet.id,
                        receiverWallet.id
                    ].sort();

                    await tx.$queryRaw`
                        SELECT id
                        FROM "Wallet"
                        WHERE id IN (${walletIds[0]}, ${walletIds[1]})
                        FOR UPDATE
                    `;


                    // Re-fetch wallets to get the locked versions  
                    const lockedSenderWallet =
                        await tx.wallet.findUnique({
                            where: {
                                id: senderWallet.id
                            }
                        });

                    const lockedReceiverWallet =
                        await tx.wallet.findUnique({
                            where: {
                                id: receiverWallet.id
                            }
                        });


                    // Validate sender balance
                    if (
                        lockedSenderWallet.balance.lt(
                            transferAmount
                        )
                    ) {
                        throw new Error(
                            "Insufficient funds"
                        );
                    }

                    const senderBalanceAfter = lockedSenderWallet.balance.minus(transferAmount);
                    const receiverBalanceAfter = lockedReceiverWallet.balance.plus(transferAmount);

                    // Create transfer record
                    const transfer =
                        await tx.transfer.create({
                            data: {
                                reference:
                                    `TRF-${uuid()}`,
                                senderWalletId:
                                    lockedSenderWallet.id,
                                receiverWalletId:
                                    lockedReceiverWallet.id,
                                amount: transferAmount,
                                status: "SUCCESS"
                            }
                        });

                    // DeBIT SENDER
                    await tx.wallet.update({
                        where: {
                            id:
                                lockedSenderWallet.id
                        },
                        data: {
                            balance: {
                                decrement:
                                    transferAmount
                            }
                        }
                    });

                    // CREDiT RECEIVER
                    await tx.wallet.update({
                        where: {
                            id: lockedReceiverWallet.id
                        },
                        data: {
                            balance: {
                                increment: transferAmount
                            }
                        }
                    });

                    // Create transactions for both sender and receiver
                    const senderTransaction =
                        await tx.transaction.create({
                            data: {
                                reference: `DEBIT-${uuid()}`,
                                walletId: lockedSenderWallet.id,
                                amount: transferAmount,
                                type:   "TRANSFER",
                                status: "SUCCESS",
                                description: `Transfer to ${receiverEmail}`
                            }
                        });

                    const receiverTransaction =
                        await tx.transaction.create({
                            data: {
                                reference: `CREDIT-${uuid()}`,
                                walletId: lockedReceiverWallet.id,
                                amount: transferAmount,
                                type: "TRANSFER",
                                status: "SUCCESS",
                                description: `Transfer from ${senderUserId}`
                            }
                        });

                    // LEDGER ENTRY - SENDER
                    await tx.ledgerEntry.create({
                        data: {
                            transactionId: senderTransaction.id,
                            walletId: lockedSenderWallet.id,
                            debit: transferAmount,
                            credit: new Prisma.Decimal(0),
                            balanceAfter: senderBalanceAfter
                        }
                    });

                    // LEDGER ENTRY - RECEIVER
                    await tx.ledgerEntry.create({
                        data: {
                            transactionId: receiverTransaction.id,
                            walletId: lockedReceiverWallet.id,
                            debit: new Prisma.Decimal(0),
                            credit: transferAmount,
                            balanceAfter: receiverBalanceAfter
                        }
                    });

                    return {
                        reference: transfer.reference,
                        amount: transfer.amount,
                        status: transfer.status
                    };

                },

                {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
                }

            );

        } catch (error) {

            const retryableErrors = [
                "P2034"
            ];

            const shouldRetry =
                retryableErrors.includes(
                    error.code
                );

            if (
                shouldRetry &&
                attempt < MAX_RETRIES
            ) {

                console.log(
                    `Retrying transfer... attempt ${attempt}`
                );

                continue;
            }

            throw error;
        }
    }
};


const reverseTransfer = async (
    transferReference
) => {

    return await prisma.$transaction(
        async (tx) => {
            const transfer =
                await tx.transfer.findUnique({
                    where: {
                        reference: transferReference
                    }
                });

            if (!transfer) {
                throw new Error(
                    "Transfer not found"
                );
            }

            if (transfer.reversed) {
                throw new Error(
                    "Transfer already reversed"
                );
            }

            const walletIds = [
                transfer.senderWalletId,
                transfer.receiverWalletId
            ].sort();

            await tx.$queryRaw`
                SELECT id
                FROM "Wallet"
                WHERE id IN (
                    ${walletIds[0]},
                    ${walletIds[1]}
                )
                FOR UPDATE
            `;

            const senderWallet =
                await tx.wallet.findUnique({
                    where: {
                        id:
                            transfer.senderWalletId
                    }
                });

            const receiverWallet =
                await tx.wallet.findUnique({
                    where: {
                        id:
                            transfer.receiverWalletId
                    }
                });

            if (
                receiverWallet.balance.lt(
                    transfer.amount
                )
            ) {
                throw new Error(
                    "Receiver has insufficient balance for reversal"
                );
            }

            const reversalReference =
                `REV-${uuid()}`;

            const reversalTransfer =
                await tx.transfer.create({
                    data: {
                        reference: reversalReference,
                        senderWalletId: receiverWallet.id,
                        receiverWalletId: senderWallet.id,
                        amount: transfer.amount,
                        status: "SUCCESS"
                    }
                });

            await tx.wallet.update({
                where: {
                    id: receiverWallet.id
                },
                data: {
                    balance: {
                        decrement: transfer.amount
                    }
                }
            });

            await tx.wallet.update({
                where: {
                    id: senderWallet.id
                },
                data: {
                    balance: {
                        increment: transfer.amount
                    }
                }
            });

            const debitTransaction =
                await tx.transaction.create({
                    data: {
                        reference: `REV-DEBIT-${uuid()}`,
                        walletId: receiverWallet.id,
                        amount: transfer.amount,
                        type: "REVERSAL",
                        status: "SUCCESS",
                        description: `Reversal debit`
                    }
                });

            const creditTransaction =
                await tx.transaction.create({
                    data: {
                        reference: `REV-CREDIT-${uuid()}`,
                        walletId: senderWallet.id,
                        amount: transfer.amount,
                        type: "REVERSAL",
                        status: "SUCCESS",
                        description: `Reversal credit`
                    }
                });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: debitTransaction.id,
                    walletId: receiverWallet.id,
                    debit: transfer.amount,
                    credit: 0,
                    balanceAfter: receiverWallet.balance.minus(
                            transfer.amount
                        )
                }
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: creditTransaction.id,
                    walletId: senderWallet.id,
                    debit: 0,
                    credit: transfer.amount,
                    balanceAfter: senderWallet.balance.plus(
                            transfer.amount
                        )
                }
            });

            await tx.transfer.update({
                where: {
                    id: transfer.id
                },
                data: {
                    reversed: true,
                    reversedAt: new Date(),
                    reversalReference
                }
            });

            return reversalTransfer;
        },

        {
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable
        }
    );
};

module.exports = {
    transferFunds,
    reverseTransfer
};