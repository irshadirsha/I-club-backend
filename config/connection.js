const mongoose = require ('mongoose')
require('dotenv').config();
const connect = ()=>{
    mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true,}).then(()=>{
        console.log("db connected");
    })
    
}

module.exports = connect;
