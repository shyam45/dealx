var express = require("express");
const userHealpers = require("../helpers/userHealpers");
const productHelpers = require('../helpers/productHealper');
var router = express.Router();
const fs = require('fs');
let sub_id;
let productdetails = {};
let filterResult
let searchResult
let otpGenerator,searchKeyword 
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn)
  {
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log(process.env.KEY_ID)
  if (req.session.user) {
    let user = req.session.user;
      productHelpers.getAllProducts(user.premium).then((products) => {
        console.log(products);
        productHelpers.getTopdeals().then((topdeals) => {
          res.render("index", { products, user ,topdeals  });
        })
    })
  } else {
    res.redirect("/login");
  }
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", async (req, res) => {
  req.session.user= req.body
  otpGenerator = await Math.floor(1000 + Math.random() * 9000);
  userHealpers.sendVerifyMail(req.body.name, req.body.email, otpGenerator).then(() => { 
    res.render('otp')
  })  
});

router.get('/search', (req, res) => {
  res.render('search-results',{searchResult});
})

router.get('/search-results',(req, res) => {
  if (req.body.search) {
    searchKeyword = req.body.search
    userHealpers.search(searchKeyword).then((result) => {
      searchResult = result
      res.redirect('/search')
    })
  }
})

router.post("/verify-otp",async(req,res)=>{
  let data = req.body
  let userotp = await data.otp1+data.otp2+data.otp3+data.otp4;
  if(userotp == otpGenerator){
    userHealpers.doSignup(req.session.user).then((response)=>{
      req.session.user = response
      res.session.otpGenerator=null
      res.redirect('/login')
    })
  }else{
    res.render('otp')
  }
})

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
      req.session.loggedIn = true;
      res.redirect("/admin");
    } else if (response.role === "user") {
      req.session.user = response;
      userHealpers.premiumDate(req.session.user)
      req.session.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login"); 
    }
  });
});

router.get("/product/:id",verifyLogin, async(req, res) => {
  productHelpers.getProduct(req.params.id).then((product) => {
    res.render("product-details",{product})
  })
})

router.post("/products/filter",(req, res) => {
  let data = req.body
  let [lt,gt]=data.price;
    let filter = []     
    for (let i of data.city) {
      filter.push({ 'location.city': i })
    }
    productHelpers.filterProduct(filter,lt,gt).then((response) => {
      filterResult=response
      if (data.sort == "sort") {
        res.json({status: true});
      }
      if (data.sort == 'lh') {
        filterResult.sort((a, b) => {
          return a.product.price - b.product.price
        })
        res.json({status:true});
      }
      if (data.sort == 'hl') {
        filterResult.sort((a, b) => {
          return b.product.price - a.product.price
        })
        res.json({status: true});
      }
  //     res.json({products}) 
    })
})

router.get("/add_location",verifyLogin, (req, res) => {
  let user = req.session.user      
  res.render("add_location",{user});
});

router.post("/add_location", (req, res) => {
  let id = req.session.user._id;
  req.body.email = req.session.user.email;
  userHealpers.addLocation(req.body, id).then((response) => {
    res.redirect("/sell_product");
  });
});

router.get("/sell_product",verifyLogin, (req, res) => {
  userHealpers.findLocation(req.session.user._id).then((location) => {
    if (location) {
      productdetails.location = location;
      res.render("sell_product");
    } else {
      res.render("add_location");
    }
  });
});

router.post("/sell_product", (req, res) => {
  productdetails.product = req.body;
  res.render('add-details')
});

router.post('/add-details',(req, res) => {
  productdetails.product.details=req.body.description;
  res.render("image-upload");
})

router.post("/image-upload", (req, res) => {
  let user = req.session.user;
  productHelpers.sellProduct(productdetails, user).then((id) => {
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

router.get('/book-product/:p_id',verifyLogin,(req, res) => {
  productHelpers.getProduct(req.params.p_id).then((product) => {
    let user = req.session.user;
    userHealpers.findLocation(user._id).then((location) => {
      if (location){
      userHealpers.bookProduct(user._id,product.product,product.s_id,location).then(() => {
        let p_name = product.product.name
        userHealpers.sendMail(p_name,location).then(() => {
          res.redirect("/my-orders");
        })
    })
  }else{
    res.render('add_location')
  }
    })
  })
})

router.get('/add-favorites/:p_id',verifyLogin,(req, res)=> {
  productHelpers.getProduct(req.params.p_id).then((product)=> {
    userHealpers.addFavorite(req.session.user._id,product).then(()=>{
      res.redirect('/')
    })
  })
})

router.get('/wishlist',verifyLogin,(req, res)=> {
  userHealpers.getFavorites(req.session.user._id).then((response)=>{
    let favorites = response[0].favorites
    if (favorites.length > 0) {
    res.render('products',{favorites})
    }else {
      res.redirect('/')
    }
  })
})

router.get('/delete-favorite/:id',verifyLogin,(req, res)=> {
    userHealpers.deleteFavorites(req.params.id).then((response)=>{
      res.redirect('/wishlist')
    })
})

router.get("/category/:category", (req, res) => {
  productHelpers.getCategory(req.params.category).then((category)=>{
    filterResult= category
    res.redirect('/products');
  })
});

router.get('/products', (req, res) => {
  res.render('products', {filterResult})
})

router.get('/premium',verifyLogin,(req, res)=>{
  res.render('premium',{'user': req.session.user})
})

router.post('/premium',verifyLogin,(req, res)=>{
  userHealpers.generateRazorpay().then((response) => {
    sub_id = response.subscriptionId;
    response.order.user = req.body.user
    res.json(response.order)
  })
})

router.post('/verifyPayment',(req, res)=>{
  userHealpers.verifyPayment(req.body).then(() => {
    let userId = req.body['order[user]']
    let dueDate = new Date()
    userHealpers.getPremium(userId,dueDate,sub_id).then(()=>{
      res.redirect('/')
    })
  })
})

router.get('/dashboard',verifyLogin,(req, res)=>{
  let user = req.session.user
  userHealpers.getSales(user._id).then((response)=>{
    let products = response[0].sales
    userHealpers.getProductCount(user._id).then((response)=>{ 
      let productCount = response[0].productCount
      userHealpers.soldProduct(user._id).then((response)=>{ 
        let soldProduct = response
        res.render('user-dashboard',{user,products,productCount,soldProduct})
      });
    });
  })
})

router.get('/my-orders',verifyLogin,(req, res)=>{
  let user = req.session.user
  userHealpers.getOrders(user._id).then((response)=>{
    let orders = response[0].orders
    res.render('orders',{user,orders})
  })
  })
router.get('/my-products',verifyLogin,(req, res)=>{
  let user = req.session.user
  userHealpers.getUserProducts(user._id).then((response)=>{
    let products = response[0].products
    res.render('user-products',{user,products})
  })
})

router.get('/edit-product/:id',verifyLogin,(req, res)=>{
  productHelpers.getProduct(req.params.id).then((product)=>{
    res.render('edit-product',{product})
  })
})

router.post('/edit-product/:id',(req, res)=>{
  let id = req.params.id
  productHelpers.editProduct(req.body,req.params.id).then(()=>{
    res.redirect('/')
    if (req.files.image) {
      let image = req.files.image
      image.mv("public/images/product-images/" + id + "(1)" + ".jpg")
    }
  });
})

router.get('/delete-product/:id',verifyLogin,(req, res)=>{
  productHelpers.deleteProduct(req.params.id).then(()=>{
    fs.unlinkSync("public/images/product-images/" + req.params.id + "(1)" + ".jpg")
    res.redirect('/my-products')
  })
})

router.get('/report_issue',(req, res)=>{
  res.render("report")
})

router.post('/report-issue',verifyLogin,(req, res)=>{
  userHealpers.report(req.body,req.session.user._id).then(()=>{
    res.redirect('/')
  })
})

router.get('/sales-action/:action/:s_id/:p_id/:price',(req, res)=>{
  let action = req.params.action
  let sId = req.params.s_id
  let pId = req.params.p_id
  let price = req.params.price
  userHealpers.salesAction(action,sId).then(() =>{
    userHealpers.totalRevenue(pId,price).then(() =>{
      if (action === 'approved') {
        productHelpers.productSold(pId)
        res.redirect('/dashboard')
      }else{
        res.redirect('/dashboard')
      }
    })
  })
})

router.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});
module.exports = router;
