const userModel = require('../model').User;
const productModel = require('../model').product;
const locationModel = require('../model').location
const db = require('mongoose').connection
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId
const Razorpay = require('razorpay');
var nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config()

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});
module.exports = {
    sendVerifyMail :  (name, email, otpGenerator) => {
        return new Promise((resolve, reject) => {
            try {
              const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                service: 'gmail',
                port: 587,
                secure: false,
                auth: {
                    user: 'shm24677@gmail.com',
                    pass: 'ucncblfxgbydpgtp'
                },
                tls: {
                  rejectUnauthorized: false
                }
              })
          
              console.log(otpGenerator);
              const mailOptions = {
                from: 'shm24677@gmail.com',
                to: email,
                subject: 'for email verification',
                text: 'Hey ' + name + ',\n\n Your otp code is ' + otpGenerator
              }
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error)
                }
                else {
                  console.log("mail has been send", info.response)
                }
              })
              resolve()
            }
            catch (error) {
              console.log(error);
            }
        })
          },
    doSignup: (data) => {
            return new Promise(async(resolve, reject) => {
            let user =await new userModel(data)
            user.password = await bcrypt.hash(user.password,10)
            user.role = 'user'
            user.totalRevenue = 0;
            try {
                await user.save()
                resolve(user)
            } catch (err) {
                resolve(err.message)
            }
        })
    },
    doLogin:(data) => {
        return new Promise((resolve, reject) => {
            userModel.findOne({email:data.email}).then(async(user) => {
                if (user) {
                    let status = await bcrypt.compare(data.password,user.password)
                    if (status){
                            resolve(user)
                        }
                    else {
                        resolve(false)
                    }
                }else{
                    resolve(false)
                }
            });
        })
    },

    premiumDate:(uId)=>{
        let currentdate = new Date()
        return new Promise(async(resolve, reject) => {
            userModel.aggregate([
                {
                    $match:{
                        _id: objectId(uId)
                    }
                },
                {
                    $project:{
                        _id: 0,
                        expire : {
                            $cond : {
                                if : {
                                    $gte : ["premium.dueDate",currentdate]
                                }, 
                                then : false, 
                                else : true
                            }
                        }
                    }
                }
            ]).then(async(response)=>{
                let isExpire = response[0].expire
                if (isExpire) {
                    await userModel.updateOne(
                        {_id: objectId(uId)},
                        { $unset: { premium: ""}}
                    )
                    await productModel.aggregate([
                        {
                            $match:{s_id:objectId(uId)},
                        },
                        {
                            $set:{
                                'product.badge':'expired'
                            }
                        }
                    ])
                }else{
                    resolve()
                }
            })
        })
    },

    addLocation:(data,id) => {
        return new Promise(async(resolve, reject)=> {
            data.u_id = id
            let location =await new locationModel(data)   
            try {
                await location.save()
                resolve(location)
            } catch (err) {
                resolve(err.message)
            }
        })
    },
    findLocation:(data) => {
        return new Promise(async(resolve, reject)=> {
            locationModel.findOne({u_id: data},{'_id':0,'name':1,'phone':1,'email':1,'address':1,'city':1,'pincode':1}).then((response) => {
                resolve(response)
            })
        })
    },
    
    bookProduct: (uId,product,sId,user)=>{
        return new Promise(async(resolve, reject) => {
            let prodExist = await userModel.findOne({'orders.product.p_id':product.p_id})
            if (! prodExist) { 
                let id = new objectId()
                db.collection('users').updateOne({ _id: objectId(uId) },
                {
                    $push: {
                        'orders': {
                            o_id : objectId(id),
                            status : 'pending',
                            product : product
                        }
                    }
                }).then(() => {
                    db.collection('users').updateOne({ _id: objectId(sId) },
                    {
                        $push: {
                            'sales': {
                                s_id : objectId(id),
                                status : 'pending',
                                product : product,
                                buyer : user
                            }
                        }
                    }
                    );
                }).then(()=>{
                    resolve();
                })
            }else{
                resolve()
            }
            });
    },

    sendMail: (p_name,buyer)=>{
        return new Promise((resolve, reject) => {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'shm24677@gmail.com',
              pass: 'ucncblfxgbydpgtp'
            }
          });
        var mailOptions = {
            from: 'shm24677@gmail.com',
            to: buyer.email,
            subject: 'Your product is booked',
            text: "Your Product "+p_name+" was booked by "+buyer.name+".\n The details of user is given below.\n Name :"+buyer.name+"\n Phone :"+buyer.phone+"\n Address :"+buyer.address+"\n City :"+buyer.city+"\n Pincode :"+buyer.pincode
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              resolve()
            }
          });
        })
    },
        
    getFavorites:(userId) => {
        return new Promise(async(resolve, reject)=>{
            userModel.find({_id:userId},{'_id':0,'favorites':1}).then((response) => {
                resolve(response)
            })
    })
    },
    addFavorite:(uId,product) => {
        return new Promise(async(resolve, reject)=>{
           let f_id = new objectId()
            let prodExist=await userModel.findOne({_id:uId,'favorites.p_id':product.p_id})
             if(! prodExist){
                userModel.updateOne({_id:uId},
                        { 
                        $push: { 
                            'favorites':{
                                f_id : objectId(f_id),
                                p_id : product.p_id,
                                name : product.product.name,
                                category : product.product.category,
                                description : product.product.description,
                                price : product.product.price
                            }
                        }  
                    }
                ).then((response) => {
                    resolve(response)
                })
            } else{
                 resolve()
            }
        })
    },
    deleteFavorites: (id) => {
        return new Promise((resolve, reject)=>{
            userModel.updateOne({ "favorites.f_id": objectId(id) },
                {
                    $pull: {
                        favorites: { f_id: objectId(id) } 
                    } 
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    getSales:(userId) => {
        return new Promise(async(resolve, reject)=>{
            userModel.find({_id:userId},{'_id':0,'sales':1}).then((response) => {
                resolve(response)
            })
    })
    },
    getUserProducts:(userId) => {
        return new Promise(async(resolve, reject)=>{
            userModel.find({_id:userId},{'_id':0,'products':1,'status':1}).then((response) => {
                resolve(response)
            })
    })
    },
    getOrders:(userId) => {
        return new Promise(async(resolve, reject)=>{
            userModel.find({_id:userId},{'_id':0,'orders':1}).then((response) => {
                resolve(response)
            })
    })
    },
    report: (data,uId) => {
        return new Promise((resolve, reject)=>{
            let r_id = new objectId()
            db.collection('users').updateOne({role: 'admin'},
            {
                $push : {
                    complaints : {
                        r_id : r_id,
                        u_id : uId,
                        content : data
                    }
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    generateRazorpay: ()=>{
        return new Promise((resolve, reject)=>{
            let subscriptionId = new objectId()
            var options={
                amount : 2999*100,
                currency:"INR",
                receipt : ""+subscriptionId
            };
            instance.orders.create(options,function(err,order){
                if(err){
                    console.log(err);
                }else{
                    resolve({order,subscriptionId}) 
                }
            })
        })
    },
    getPremium: (uId,date,sub_id)=>{
        return new Promise(async(resolve,reject)=>{
            await db.collection('users').updateOne({_id:objectId(uId)},
            { 
                $set: { 
                    'premium':{
                        sub_id : objectId(sub_id),
                        dueDate : date
                    }
                }  
            })
            await userModel.updateOne({role: 'admin'},{$inc:{totalRevenue:2999}})
            resolve()
        })
    }, 

    verifyPayment: (details) => {
        return new Promise(async (resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'P8ebn9gARuTf5udSoBgaorPy')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    getProductCount : (uId) => {
        return new Promise((resolve, reject) => { 
            userModel.aggregate([
                {
                    $match : {
                        _id: objectId(uId),
                    }
                },
                {
                   $project: {
                      _id:0,
                      productCount: { $cond: { if: { $isArray: "$products" }, then: { $size: "$products" }, else: 0} }
                   }
                }
             ] )
            .then((response) => {
                resolve(response);
            })
        })
    },
    soldProduct : (uId) => {
        return new Promise(async(resolve, reject) => { 
            userModel.aggregate([
                {
                    $match :{
                        _id: objectId(uId)
                    }
                },
                {
                    $unwind :'$sales'
                },
                {
                    $match : {"sales.status":'approved'}
                },
                {
                    $count :'salesCount'
                }
            ]).then((count)=>{
                if (count[0]) {
                    resolve(count[0].salesCount);
                } else {
                    resolve(0);
                }
                ;
            })
        })
    },
    salesAction : (action,id,pId) => {
        return new Promise((resolve, reject) => {
            userModel.updateOne({'sales.s_id': objectId(id)},
            {
                $set: {
                    'sales.$.status' : action,
                    'products.$.status' : 'sold'
                }
            }).then(()=>{
                userModel.updateOne({'orders.o_id':objectId(id)},
                {
                    $set: {
                        'orders.$.status' : action
                    }
                }).then(()=>{
                    resolve()
                })
            })
        })
    },
    totalRevenue : (pId,price)=>{
        return new Promise((resolve, reject) => {
        userModel.updateOne({'products.p_id': objectId(pId)},
            {
                $inc: {
                    totalRevenue: price
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    // search : (text)=>{
    //     console.log(text)
    //     return new Promise((resolve, reject) => {
    //         let result = await productModel.aggregate([
    //             {
    //                 $project: {
    //                     _id: 0,
    //                     products: {
    //                         $filter: {
    //                             input: '$product',
    //                             as: 'products',
    //                             cond: {
    //                                 $or: [
    //                                     {
    //                                         $regexMatch: {
    //                                             input: '$$product.category',
    //                                             regex: text,
    //                                             options: 'i'
    //                                         }
    //                                     },
    //                                     {
    //                                         $regexMatch: {
    //                                             input: '$$product.name',
    //                                             regex: text,
    //                                             options: 'i'
    //                                         }
    //                                     }
    //                                 ]
    //                             }
    //                         }
    //                     }
    //                 }
    //             },
                
    //         ])
    //         console.log(result);
    //         resolve(result)
    //     })
    // },
}

  
  
