const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminVerify = async (req, res, next) => {
    console.log("TOKEN",req.headers.authorization);
    console.log("SECRET", process.env.jwtSecretKey);
  
    
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    console.log("admin Token",token);
    try {
        const decodedToken = jwt.verify(token, process.env.jwtSecretKey);
        req.adminId = decodedToken.sub; // Assuming your token payload has a 'sub' field representing admin ID
        admin=req.adminId
        console.log("admin id  from middleware",admin);
        next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({ message: 'Token expired or invalid' });
    }
};

module.exports = adminVerify;




























// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const adminVerify=async (req,res,next)=>{
//     const token= req.headers.authorization;
//     console.log(token, '----------------------token');
// }


// module.exports = adminVerify;