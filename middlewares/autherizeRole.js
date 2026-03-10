const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Unauthorized role." });
    }
    next();
  };
};

module.exports = authorizeRole;
``;
