const { Router } = require("express");
var express = require("express");
const userHealpers = require("../helpers/userHealpers");
var router = express.Router();

let productdetails;

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.session.user) {
    let user = req.session.user;
    if (req.session.filter) {
      let category = req.session.category;
      userHealpers.getCategory(category).then((products) => {
        res.render("index", { products, user, category });
        req.session.filter = false
      });
    } else {
      userHealpers.getAllProducts().then((products) => {
        res.render("index", { products, user });
      });
    }
  } else {
    res.redirect("/login");
  }
});

router.get("/product/:id", async(req, res) => {
  userHealpers.getProduct(req.params.id).then((product) => {
    res.render("product-details",{product})
  })
})

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", async (req, res) => {
    userHealpers.doSignup(req.body).then((response) => {
      req.session.user = response;
      res.redirect("/");
    })
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else if (req.session.admin) {
    res.redirect("/admin");
  } else {
    res.render("login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});

router.post("/login", async (req, res) => {
  userHealpers.doLogin(req.body).then((response) => {
    if (response.role === "admin") {
      req.session.admin = response;
      res.redirect("/admin");
    } else if (response.role === "user") {
      req.session.user = response;
      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});

router.get("/add_location", (req, res) => {
  res.render("add_location");
});

router.post("/add_location", (req, res) => {
  let id = req.session.user._id;
  userHealpers.addLocation(req.body, id).then((response) => {
    console.log(response);
    res.redirect("/");
  });
});

router.get("/sell_product/:id", (req, res) => {
  userHealpers.findLocation(req.params.id).then((response) => {
    if (response) {
      res.render("sell_product");
    } else {
      res.redirect("/add_location");
      
    }
  });
});

router.post("/sell_product", (req, res) => {
  productdetails = req.body;
  res.render('add-details')
});

router.post('/add-details',(req, res) => {
  productdetails.details=req.body.description;
  res.render("image-upload");
  console.log(productdetails);
})

router.post("/image-upload", (req, res) => {
  let user = req.session.user;
  userHealpers.sellProduct(productdetails, user).then((id) => {
    if (req.files) {
      if (req.files.image1) {
        addImage(req.files.image1, 1, id);
      }
      if (req.files.image2) {
        addImage(req.files.image2, 2, id);
      }
      if (req.files.image3) {
        addImage(req.files.image3, 3, id);
      }
      if (req.files.image4) {
        addImage(req.files.image4, 4, id);
      }
    }
    res.redirect("/");
  });
});

function addImage(image, n, id) {
  image.mv("public/images/product-images/" + id + "(" + n + ")" + ".jpg");
}

router.get('/add-favorites/:p_id',(req, res)=> {
  userHealpers.addFavorite(req.params.p_id,req.session.user._id).then((response)=>{
    console.log(response);
    res.redirect('/')
  })
})

router.get('/favorites',(req, res)=> {
  userHealpers.getFavorites(req.session.user._id).then((response)=>{
    console.log(response);
  })
})

router.get("/category/:category", (req, res) => {
  req.session.filter = true;
  req.session.category = req.params.category;
  res.redirect("/");
});


router.post("/otp", async (req, res) => {
  let otp = req.body.otp;
  // await client.verify
  //   .services(accountSid)
  //   .verificationChecks.create({ to: "+917356877448", code: otp })
  //   .then((verification_check) => console.log(verification_check.status));
  res.redirect("/");
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});
module.exports = router;

// router.post('/verify',(req,res)=>{
// let{ otp }=req.body;
// otp=otp.join("");
// console.log(otp)
//   let phone_number=req.session.number
//   console.log(req.session.number)
//   otpHelpers.verifyOtp(otp,phone_number).then((verification_check)=>{
//     if(verification_check.status=="approved"){
//       console.log("approved")
//       req.session.checkstatus=true

//       userHelpers.doSignup(req.session.whole).then((response)=>{
//        console.log(response)
//        res.redirect('/userlogin')
//      })

//     }else{
//       console.log("not approved")
//       res.redirect('/signup')
//     }

//   })

//  })
