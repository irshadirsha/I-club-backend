var express = require('express');
var router = express.Router();
const adminController = require ('../controller/adminController')


router.post('/adminLogin',adminController.adminsingin)
router.post('/admin-dashboard',adminController.adminDashboard)
router.get('/admin-usermanage',adminController.UserManage)
router.post('/block-user',adminController.BlockUser)
router.post('/unblock-user',adminController.UnBlockUser)


router.post('/get-clubdata',adminController.GetClubdata)
router.post('/set-blacklist',adminController.SetBlacklist)
router.get('/club-details',adminController.ViewClubData)
module.exports = router;




/* GET home page. */
// router.get('/', function(req, res, next) {
//    res.send("hello iam backend")
// });