var express = require('express');
const adminHelper = require('../helpers/adminHelper');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (req.session.admin){
  adminHelper.getUserCount().then((userCount) => {
    adminHelper.getRevenue().then((revenue) => {
      adminHelper.allUsers().then((allUsers) => {
        res.render('admin-home',{admin: true,userCount,revenue,allUsers});
      })
    })
  })
}else{
  res.redirect('/logout')
}
});

router.get('/user/:user',(req, res)=>{
  adminHelper.userDetails(req.params.user).then((response)=>{
    let details = response.details[0]
    let productCount = response.products[0].productCount
    let orderCount = response.orders[0].orderCount
    let salesCount = response.sales[0].salesCount
    let city = response.city[0].city
    res.render('user-details',{details,productCount,orderCount,salesCount,city});
  })
})

router.get("/logout", (req, res) => {
  req.session.admin = null;
  res.redirect("/login");
});
module.exports = router;