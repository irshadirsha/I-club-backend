const mongoose = require ('mongoose')

const connect = ()=>{
    mongoose.connect('mongodb://127.0.0.1:27017/club', {useNewUrlParser: true, useUnifiedTopology: true,}).then(()=>{
       console.log("db connected");
    })
   
}

module.exports = connect;