const express = require('express');
const router = express.Router();
// const authMiddleware =require('../middleware/auth')
const userController = require ('../controller/userController')
const clubController = require ('../controller/clubController')
const eventController =require ('../controller/eventController')
const finaceController =require ('../controller/financeController')
const paymentController = require('../controller/paymentController')
const notificationController =require ('../controller/NotificationController')
const chatController =require ('../controller/chatController')
const bannerController = require('../controller/bannerController')
const verifyToken = require('../middleware/auth')
router.get('/',userController.userHome)

router.post('/signup',userController.userSignup)
router.post('/verify-otp',userController.VerifyOtp)

router.post('/login',userController.userLogin)
router.post('/sendmail',userController.SendEmail)
router.post('/reset-password',userController.ResetPassword)
router.post('/new-password',userController.SetNewPass)
router.post('/googleAuth',userController.googleoAuth)
router.post('/user-profileupdate',verifyToken,userController.updateProfile)
router.post('/getuser-profile',verifyToken,userController.GetProfile)
router.post('/user-profileimgupdate',verifyToken,userController.ImageUpdate)
router.post('/leave-club',verifyToken,clubController.LeaveClub)
router.get('/get-bannerhome',verifyToken,bannerController.GetBannerHome)

// CLUB CONTROLLER

router.post('/createclub',verifyToken,clubController.regclub)
router.post('/joinclub',verifyToken,clubController.joinClub)
router.post('/clubhome',verifyToken,clubController.ClubHome)
router.get('/serch-clubs',verifyToken,clubController.SearchClubs)
router.post('/make-request',verifyToken,clubController.MakeRequest)
router.get('/fetch-reqcount',verifyToken,clubController.FetchCount)

//CLUB AUTHORITY AND ADD MEMMBERS
router.get('/get-authority',verifyToken,clubController.GetClubAuthority)
router.post('/add-member',verifyToken,clubController.AddMember)
router.get('/get-member',verifyToken,clubController.GetMember)
router.post('/delete-member',verifyToken,clubController.DeleteMember)

// CLUB PROFILE
router.post('/add-clubprofile',verifyToken,clubController.AddClubProfile)
router.post('/add-clubpost',verifyToken,clubController.AddClubPost)
router.get('/get-clubprofile',verifyToken,clubController.GetClubProfile)
router.post('/delete-post',verifyToken,clubController.DeletePost)

// UPDATE IN CLUB DATA
router.post('/update-club',verifyToken,clubController.UpdateClub)
router.get('/get-clubform',verifyToken,clubController.GetClubForm)
router.post('/change-committe',verifyToken,clubController.ChangeCommitte)
//EVENT CONTROLLER
router.post('/add-events',verifyToken,eventController.AddEvents)
router.post('/get-event',verifyToken,eventController.GetEvents)
router.post('/delete-event',verifyToken,eventController.DeleteEvent)

// PAMENT CONTROLLER
router.post('/create-payment',verifyToken,paymentController.MakePayment)

//FINANCE CONTROLLER
router.get('/get-financedata',verifyToken,finaceController.GetFinaceData)
router.post('/add-expense',verifyToken,finaceController.AddExpense)
router.get('/get-accounts',verifyToken,finaceController.GetAccounts)

//NOTIFICATION CONTROLLER
router.post('/send-note',verifyToken,notificationController.SendNote)
router.get('/get-note',verifyToken,notificationController.GetNote)
router.post('/delete-note',verifyToken,notificationController.DeleteNote)

// CHAT MESSAGES CONTROLLER
router.post('/send-message',verifyToken,chatController.SendMessage)
router.get('/get-message',verifyToken,chatController.GetChat)

// VIDEOCALL CONTROLLER
router.get('/get-meetingdata',verifyToken,chatController.GetMeetingData)
router.post('/set-conferece',verifyToken,chatController.SetConference)
router.post('/remove-link', verifyToken,chatController.RemoveLink)
module.exports = router;


