const userModel = require('../model').User;
const productModel = require('../model').product;
const locationModel = require('../model').location;
const mongoose = require('mongoose');
const db = mongoose.connection
const bcrypt = require('bcrypt')
const accountSid = "AC573c9ef404b3613f64e85c56b8fa04fc";
const authToken = "2208ffb2fd146a3aa97459540a374ed5";
const serviceId = "VA07e93405cd0ff9e369a87c7e282ed2af"
const client = require("twilio")(accountSid, authToken);
module.exports = {
    doSignup: (data) => {
            return new Promise(async(resolve, reject) => {
            let user =await new userModel(data)
            user.password = await bcrypt.hash(user.password,10)
            user.role = 'user'
            user.premium = true    
            try {
                await user.save()
                resolve(user)
            } catch (err) {
                resolve(err.message)
            }
        })
    },
    doLogin:(data) => {
        return new Promise(async(resolve, reject) => {
            await userModel.findOne({email:data.email}).then(async(user) => {
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
            })
        })
    },

    getCategory:(category) =>{
        return new Promise(async(resolve, reject)=> {
            productModel.find({category:category}).then((products) => {
                resolve(products)
            })
        })
    },

    getAllProducts:() => {
        return new Promise((resolve, reject)=> {
            productModel.find({toplist: true}).then((product) => {
                resolve(product)
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
            locationModel.findOne({u_id: data}).then((response) => {
                resolve(response)
            })
        })
    },
    sellProduct:(data,user) => {
        return new Promise(async(resolve, reject)=> {
            let premium = user.premium
            if(premium){
                data.toplist=true
            }
            let product =await new productModel(data)
            try {
                await product.save()
                resolve(product._id)
            } catch (err) {
                resolve(err.message)
            }
        })
    },
    getProduct:(proId) => {
        return new Promise((resolve, reject)=>{
            productModel.findOne({_id:proId}).then((product) => {
                resolve(product)
            })
        })
    },
    getFavorites:(userId) => {
        return new Promise(async(resolve, reject)=>{
                let favorites = db.collection('users').aggregate([
                    {
                        $match:{_id : userId}
                    },
                    {
                        $lookup:{
                            from: 'prooducts',
                            let : {prodlist : '$favorites'},
                            pipeline : [
                                {
                                    $match:{
                                        $expr:{
                                            $in: ['$_id', '$$prodlist']
                                        }
                                    }
                                }
                            ],
                            as:'favorites'
                        }
                    }
                ])
                console.log(favorites)
        })
    },
    addFavorite:(proId,uId) => {
        return new Promise((resolve, reject)=>{
            userModel.findByIdAndUpdate(uId,
                { 
                    "$push": { 
                        "favorites": proId
                    } 
                },
                {
                    "new": true,
                    "upsert": true 
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    getOtp: (data) => {
        return new Promise((resolve, reject)=>{
            client.verify.services(serviceId)
             .verifications
             .create({to: '+917356877448', channel: 'sms'})
             .then(verification => console.log(verification.sid));
            resolve('sussess')
        })
    }
}