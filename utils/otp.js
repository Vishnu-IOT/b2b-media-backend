const crypto = require('crypto');

// 6-digit numeric OTP, e.g. "042817" (kept as a string so a leading zero isn't lost)
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

module.exports = { generateOtp, generateToken };
