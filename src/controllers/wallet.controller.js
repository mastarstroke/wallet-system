const walletService = require(
    "../services/wallet.service"
);

exports.getBalance = async (req, res) => {

    try {

        const wallet = await walletService.getWallet(
            req.user.id
        );

        return res.json({
            success: true,
            data: wallet
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

exports.fundWallet = async (
    req,
    res
) => {

    try {

        const {
            amount,
            description
        } = req.body;

        const result =
            await walletService.fundWallet(
                req.user.id,
                amount,
                description
            );

        return res.status(201).json({
            success: true,
            message:
                "Wallet funded successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};