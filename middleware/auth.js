const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken =async  (req, res, next) => {
  console.log('Middleware executedddddddddddddddddddddddddddddddddddddddddddd');
  // console.log(req.headers)
  const token = req.headers.authorization.split(" ")[1];

  // const token=token1.toString()
  console.log(token, '----------------------token');
  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  try {
    const data = jwt.verify(token,process.env.jwtSecretKey);
    req.userId = data.sub;
     console.log("midddddd",req.userId);
    next();
  } catch (error) {
    console.log(error)
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
};

module.exports = verifyToken;




















// const jwt = require('jsonwebtoken');
// require('dotenv').config()

// const verifyToken = (req, res, next) => {
//   console.log('Middleware executedddddddddddddddddddddddddddddddddddddddddddd');
//   const token = req.headers.authorization;
//   console.log(token);
//   if (!token) {
//     return res.status(401).json({ message: 'Token not provided' });
//   }
//  console.log(process.env.jwtSecretKey);
// const data=  jwt.verify(token, process.env.jwtSecretKey, (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ message: 'Token expired or invalid' });
//     console.log("Token expired or invalid");
//     }
//     req.userId = decoded.sub;
//     console.log(req.userId);
//     console.log("exicuted fully");
//     next();
//   });
// };

// module.exports = verifyToken;





























// function verifyToken(token) {
//     try {
//       return jwt.verify(token, process.env.jwtSecretKey);
//     } catch (error) {
//       return null; // Token verification failed
//     }
//   }
  
//   module.exports = {
//     userAuthentication(req, res, next) {
//       const token = req.headers.authorization;
//       if (!token) {
//         return res.status(401).send({
//           message: "Unauthenticated"
//         });
//       }

//       const decoded = verifyToken(token);
  
//       if (!decoded) {
//         return res.status(401).send({
//           message: "Unauthenticated"
//         });
//       }
//       req.headers.userId = decoded.sub;
//       next(); 
//     }
//   };
  



























// const jwt = require('jsonwebtoken');

// // Custom function to verify the token and return the decoded user data
// function verifyToken(token) {
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_USER_SECRETKEY);
//     return decoded;
//   } catch (error) {
//     // Token verification failed
//     return null;
//   }
// }

// module.exports = {
//   userAuthentication(req, res, next) {
//     const token = req.headers.authorization;
//     if (!token) {
//       return res.status(401).send({
//         message: "Unauthenticated"
//       });
//     }

//     // Custom function (verifyToken) to validate the token and get user details
//     const decoded = verifyToken(token);

//     if (!decoded) {
//       return res.status(401).send({
//         message: "Unauthenticated"
//       });
//     }

//     // Assuming the user ID is stored in the 'userId' field of the decoded token
//     req.headers.userId = decoded.userId;
//     next();
//   }
// };



// const jwt = require('jsonwebtoken');

// function verifyToken(token) {
//   try {
//     return jwt.verify(token, process.env.jwtSecretKey);
//   } catch (error) {
//     return null; // Token verification failed
//   }
// }

// module.exports = {
//   userAuthentication(req, res, next) {
//     const token = req.headers.authorization;
//     if (!token) {
//       return res.status(401).send({
//         message: "Unauthenticated"
//       });
//     }

//     // Validate the token and get user details
//     const decoded = verifyToken(token);

//     if (!decoded) {
//       return res.status(401).send({
//         message: "Unauthenticated"
//       });
//     }

//     // Assuming the user ID is stored in the 'sub' field of the decoded token
//     req.headers.userId = decoded.sub;
//     next();
//   }
// };
