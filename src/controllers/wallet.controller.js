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