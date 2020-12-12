const argv = require('./argv');
require("dotenv").config();

module.exports = parseInt(argv.port || process.env.PORT || '3000', 10);
