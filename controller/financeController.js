const clubCollection =require ('../model/clubModel')
const financeCollection = require ('../model/finaceModel')
const userCollection = require('../model/userModel')
const jwt = require('jsonwebtoken');


const GetFinaceData = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { clubName } = req.query;
        
        const clubExist = await clubCollection.findOne({ clubName: clubName });
        if (!clubExist) {
            return res.json({ error: "Club not found" });
        }

        // Find the user's role for the given club
        const user = await userCollection.findOne({ _id: userId });
        if (!user) {
            return res.json({ error: "User not found" });
        }

        const userRole = user.clubs.find(club => club.club.toString() === clubExist._id.toString())?.role;
        if (!userRole) {
            return res.json({ error: "User role not found for the club" });
        }

        const financedata = await financeCollection.find({ clubName: clubExist._id, status: true }).sort({ _id: -1 });

        const financeexpense = await financeCollection.find({ clubName: clubExist._id, status: false }).sort({ _id: -1 });

        res.json({ financedata, financeexpense, userId, userRole });
    } catch (error) {
        console.log("Error occurred:", error);
        res.json({ error: "Internal server error" });
    }
}

const AddExpense = async (req, res, next) => {
    try {
        const { clubName, name, amount, reason, date } = req.body;
        console.log(clubName, name, amount, reason, date);

        const clubExist = await clubCollection.findOne({ clubName: clubName });

        if (clubExist) {
            const finance = new financeCollection({
                clubName: clubExist._id,
                name: name,
                reason: reason,
                amount: amount,
                date: date,
                status: false, 
                paymentMethod: "cash"
            });

            const added = await finance.save();
            res.json({ added, message: "added successfully" });
        } else {
            res.status(400).json({ error: "Club not found" });
        }
    } catch (error) {
        console.log("Error occurred:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const GetAccounts = async (req, res, next) => {
    try {
        const { clubName } = req.query;
        console.log(clubName);
        const club = await clubCollection.findOne({ clubName: clubName });
        console.log(club);
        const acc = await financeCollection.find({ clubName: club._id, status: true });
        console.log(acc);
        const totalIncome = acc.reduce((total, record) => total + record.amount, 0);
        const accexp=await financeCollection.find({clubName:club._id,status:false})
        const totalexpense = accexp.reduce((total,record)=> total + record.amount,0);
        console.log(totalIncome,totalexpense);
        res.json({ totalIncome,totalexpense });

    } catch (error) {
       console.log("error in acounts");
        res.status(500).json({ error: 'An error occurred' });
    }
};


 module.exports={GetFinaceData,AddExpense,GetAccounts}















// const GetFinaceData= async(req,res,next)=>{
//     try {
//         const userId = req.userId;
//         const { clubName } = req.query;
//         console.log("finannnnceeeeeeeeeeee", clubName);
//         const clubExist=await clubCollection.findOne({clubName:clubName})
//         if(clubExist){
//             const financedata=await financeCollection.find({clubName:clubExist._id, status: true }).sort({ _id: -1 })
//             console.log(financedata)
//             const financeexpense=await financeCollection.find({clubName:clubExist._id, status: false }).sort({ _id: -1 })
//             console.log(financeexpense)
//             res.json({financedata,financeexpense,userId})
//         }
      
//     } catch (error) {
//         console.log("error occur")
//     }
   
// }






















 
// const AddExpense=async(req,res,next)=>{
//     try {
//         const {clubName,name,amount,reason,date}=req.body
//         console.log(clubName,name,amount,reason,date);
//         const clubExist=await clubCollection.findOne({clubName:clubName})
//         if(clubExist){
//             const finance = new financeCollection({
//                 clubName: clubExist._id,
//                 name: name,
//                 reason: reason,
//                 amount: amount,
//                 date: date,
//                 status: fasle,
//                 paymentMethod:"cash"
//             })
//             const added = await finance.save();
//             res.json({added,status:"added successfully"})
//         }
//     } catch (error) {
//         console.log("error occur")
//     }

// }