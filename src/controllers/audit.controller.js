exports.index = async (
    req,
    res
) => {

    const result =
        await auditService.getAuditLogs(
            req.user.id,
            req.query.page,
            req.query.limit
        );

    return res.json({
        success: true,
        ...result
    });
};