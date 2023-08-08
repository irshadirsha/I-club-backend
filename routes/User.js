const express = require('express');
const router = express.Router();
// const authMiddleware =require('../middleware/auth')
const userController = require ('../controller/userController')
const clubController = require ('../controller/clubController')
const eventController =require ('../controller/eventController')
const verifyToken = require('../middleware/auth')
router.get('/',userController.userHome)

router.post('/signup',userController.userSignup)

router.post('/login',userController.userLogin)
router.post('/sendmail',userController.SendEmail)
router.post('/reset-password',userController.ResetPassword)
router.post('/new-password',userController.SetNewPass)
router.post('/googleAuth',userController.googleoAuth)
router.post('/user-profileupdate',verifyToken,userController.updateProfile)
router.post('/getuser-profile',verifyToken,userController.GetProfile)
 router.post('/user-profileimgupdate',verifyToken,userController.ImageUpdate)

// CLUB CONTROLLER

router.post('/createclub',verifyToken,clubController.regclub)
router.post('/joinclub',verifyToken,clubController.joinClub)
router.post('/clubhome',verifyToken,clubController.ClubHome)


//EVENT CONTROLLER
router.post('/add-events',verifyToken,eventController.AddEvents)
router.post('/get-event',verifyToken,eventController.GetEvents)
router.post('/delete-event',verifyToken,eventController.DeleteEvent)
module.exports = router;


