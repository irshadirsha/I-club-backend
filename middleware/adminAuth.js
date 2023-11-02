const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminVerify = async (req, res, next) => {
    if(!req.headers.authorization){
        return res.status(401).json({ message: 'Token not provided' });
    }
    
    const token = req.headers.authorization.split(" ")[1];
    // if (!token) {
    //     return res.status(401).json({ message: 'Token not provided' });
    // }
    try {
        const decodedToken = jwt.verify(token, process.env.jwtSecretKey);
        req.adminId = decodedToken.sub; 
        admin=req.adminId
        const action= decodedToken.Role
        if(action === "Admin"){
            next();
            console.log("Match")
        }else{
            return res.json({message:"No Access Token Founded"})
        }
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