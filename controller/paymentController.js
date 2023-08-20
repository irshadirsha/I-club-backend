 const clubCollection =require ('../model/clubModel')
const finaceCollection = require ('../model/finaceModel')
const jwt = require('jsonwebtoken');

const MakePayment = async (req, res, next) => {
    try {
      const { name, reason, amount, clubName, paypalId } = req.body;
  
      const clubcheck = await clubCollection.findOne({ clubName: clubName });
  
      const finance = new finaceCollection({
        clubName: clubcheck._id,
        name: name,
        reason: reason,
        amount: amount,
        date: Date.now(),
        status: true,
        paypalId: paypalId,
        paymentMethod: "paypal"
      });
  
      const added = await finance.save();
      console.log("added successfully", added);
      res.json({ added ,message:"payment successfull"});
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ error: "An error occurred while processing the payment." });
    }
  };
  
  module.exports = { MakePayment };
  



// const clubCollection =require ('../model/clubModel')
// const finaceCollection = require ('../model/finaceModel')
// const jwt = require('jsonwebtoken');

// const MakePayment= async(req,res,next)=>{
//     try {
//         const {name,reason,amount,clubName,paypalId}=req.body
//         console.log("paymentttt",name,reason,amount,clubName,paypalId);
//         const clubcheck = await clubCollection.findOne({ clubName:clubName });
//         console.log(check)
//         const finance = new finaceCollection({
//             clubName: clubcheck._id,
//             name: name,
//             reason: reason,
//             amount: amount,
//             date: Date.now(),
//             status: true,
//             paypalId:paypalId,
//             paymentMethod: "paypal"
//         })
//         const added = await finance.save();
//         console.log("added successfully",added);
//         res.json({added})
//     } catch (error) {
        
//     }
    
// }


// module.exports={MakePayment}