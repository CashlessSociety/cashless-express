const axios = require('axios');

(async () => {
    res = await axios.post('http://127.0.0.1:3000/getPromises', {id: process.argv[2]});
    for (var i=0; i<res.data.length; i++) {
        console.log(res.data[i].value.content);
    }
})();