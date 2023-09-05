const mongoose = require ('mongoose')
require('dotenv').config();
const connect = ()=>{
    mongoose.connect('mongodb+srv://irshadalike:irshad111@cluster0.cwnzwvu.mongodb.net/club', {useNewUrlParser: true, useUnifiedTopology: true,}).then(()=>{
        console.log("db connected");
    })
    
}

module.exports = connect;
