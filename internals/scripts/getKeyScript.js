const axios = require('axios');

(async () => {
    try {
        res = await axios.post('http://127.0.0.1:3000/genKey');
        console.log(JSON.stringify(res.data));
    } catch(e) {
        console.log("failed");
        console.log(e);
    }
})();