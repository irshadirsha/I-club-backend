const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken =async  (req, res, next) => {
  if(!req.headers.authorization){
    return 
  }
  
const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  try {
    const data = jwt.verify(token,process.env.jwtSecretKey);
    req.userId = data.sub;
     const action=data.Role
     console.log(action);
     if( action === "User"){
      console.log("MATCHING")
       next();
     }
  } catch (error) {
    console.log(error)
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
};

module.exports = verifyToken;


































