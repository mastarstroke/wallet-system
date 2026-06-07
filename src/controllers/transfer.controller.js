const transferService = require(
    "../services/transfer.service"
);

exports.transfer = async (
    req,
    res
) => {

    try {

        const transfer =
            await transferService.transferFunds(
                req.user.id,
                req.body.receiverEmail,
                req.body.amount
            );

        return res.status(201).json({
            success: true,
            data: transfer
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

exports.reverse = async (
    req,
    res
) => {

    try {

        const transfer =
            await transferService.reverseTransfer(
                req.params.reference
            );

        return res.json({
            success: true,
            data: transfer
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message
        });

    }
};