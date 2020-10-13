const axios = require('axios');

(async () => {
    try {
        res = await axios.post('http://127.0.0.1:3000/publish', {content: JSON.parse(process.argv[2]), key: JSON.parse(process.argv[3])});
        console.log(JSON.stringify(res.data));
    } catch(e) {
        console.log("failed");
        console.log(e);
    }
})();