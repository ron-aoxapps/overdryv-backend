const prisma = require("../client/prismaClient");

const checkWritePermissions = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user ID provided" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.permissions !== "read_write") {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not have write permissions" });
    }

    next();
  } catch (error) {
    console.error("Error checking permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = checkWritePermissions;
