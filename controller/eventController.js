const clubCollection =require ('../model/clubModel')
const eventCollection = require ('../model/eventModel')
const jwt = require('jsonwebtoken');


const AddEvents = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { messages,club} = req.body;
      const clubdata = await clubCollection.findOne({ _id: club });
  
      if (!clubdata) {
        return res.status(404).json({ error: "Club not found" });
      }
  
      let eventAuthor = "-Secretary";
  
      if (userId.toString() === clubdata.president.toString()) {
        eventAuthor = "-President";
      }
  
      const event = new eventCollection({
        clubName: clubdata._id,
        event: messages.message,
        location:messages.location,
        time:messages.time,
        auther: eventAuthor,
      });
  
      const added = await event.save();
      return res.json({ added,message: "event added successfully" })
    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  };

  const GetEvents=async(req,res,next)=>{
    try {
        const {clubName}=req.body
        const club=await clubCollection.findOne({clubName:clubName})
      const eventdata= await eventCollection.find({clubName:club._id}).sort({date:-1})
      const modifiedEventData = eventdata.map(event => ({
        event:event.event,
        location:event.location,
        time:event.time,
        auther: event.auther,
        date: event.date,
        _id:event._id
      }));
      res.json({modifiedEventData}) 
    } catch (error) {
        console.log("error occured")
    }
     
  }
  const DeleteEvent=async(req,res,next)=>{
    try {
        const {id}=req.body
    let deleted = await eventCollection.deleteOne({ _id:id })
    res.json({deleted,message:"deleted successfully"});
    } catch (error) {
        console.log("error occur")
    }
  }
  
module.exports={AddEvents,GetEvents,DeleteEvent}






// const AddEvents=async(req,res,next)=>{
//     try {
//         const {message,club,user}=req.body
//         console.log(message,club,user);
//         const clubdata = await clubCollection.findOne({_id:club})
//         if (user.toString() === clubdata.president.toString()) {
//             const event = new eventCollection({
//               clubName: clubdata._id,
//               event: message,
//               auther: "-President"
//             });
//             const added = await event.save();
//             res.json({added})
//         }else{
//             const event = new eventCollection({
//                 clubName: clubdata._id,
//                 event: message,
//                 auther: "-Secretary"
//               });
//               const added = await event.save();
//               res.json({added})
//         }
//     } catch (error) {
//         res.json({error:"error occur"})
//     }
  
// }
