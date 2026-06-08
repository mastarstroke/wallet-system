const prisma = require("../config/prisma");

const createAuditLog = async ({
    userId,
    action,
    entityType,
    entityId = null,
    description,
    metadata = null
}) => {

    return prisma.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            description,
            metadata
        }
    });
};

const getAuditLogs = async (
    userId,
    page = 1,
    limit = 20
) => {

    const skip =
        (page - 1) * limit;

    const logs =
        await prisma.auditLog.findMany({
            where: {
                userId
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        });

    const total =
        await prisma.auditLog.count({
            where: {
                userId
            }
        });

    return {
        data: logs,
        pagination: {
            page,
            limit,
            total
        }
    };
};

module.exports = {
    createAuditLog,
    getAuditLogs
};