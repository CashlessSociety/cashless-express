const axios = require('axios');
require("dotenv").config();

(async () => {
    try {
        res = await axios.post("/publish", {content: JSON.parse(process.argv[2]), key: JSON.parse(process.argv[3])});
        console.log(JSON.stringify(res.data));
    } catch(e) {
        console.log("failed");
        console.log(e);
    }
})();