const transactionService = require(
    "../services/transaction.service"
);

exports.index = async (
    req,
    res
) => {

    try {

        const transactions =
            await transactionService.getTransactions(
                req.user.id,
                req.query
            );

        return res.json({
            success: true,
            data: transactions
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

exports.show = async (
    req,
    res
) => {

    try {

        const transaction =
            await transactionService.getTransactionByReference(
                req.user.id,
                req.params.reference
            );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        return res.json({
            success: true,
            data: transaction
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};