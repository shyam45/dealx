const userModel = require('../model').User;
const productModel = require('../model').product;
const locationModel = require('../model').location
const db = require('mongoose').connection
const bcrypt = require('bcrypt');
const { response } = require('express');
const { default: mongoose } = require('mongoose');
const accountSid = "AC573c9ef404b3613f64e85c56b8fa04fc";
const authToken = "2208ffb2fd146a3aa97459540a374ed5";
const serviceId = "VA07e93405cd0ff9e369a87c7e282ed2af"
const objectId = mongoose.Types.ObjectId
const client = require("twilio")(accountSid, authToken);
module.exports = {
    doSignup: (data) => {
            return new Promise(async(resolve, reject) => {
            let user =await new userModel(data)
            user.password = await bcrypt.hash(user.password,10)
            user.role = 'user'
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
            locationModel.findOne({u_id: data}).then((response0) => {
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
                console.log(product);
                resolve(product)
            })
        })
    },
    getFavorites:(userId) => {
        return new Promise(async(resolve, reject)=>{
            userModel.find({_id:userId},{'_id':0,'favorites':1}).then((response) => {
                console.log(response[0]);
                resolve(response)
            })
    })
    },
    addFavorite:(uId,product) => {
        return new Promise(async(resolve, reject)=>{
           let f_id = new objectId()
            let prodExist=await userModel.findOne({_id:uId,'favorites._id':product._id})
             if(! prodExist){
                userModel.updateOne({_id:uId},
                        { 
                        $push: { 
                            'favorites':{
                                f_id : objectId(f_id),
                                p_id : product._id,
                                name : product.name,
                                category : product.category,
                                description : product.description,
                                price : product.price
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
    getOtp: (data) => {
        return new Promise((resolve, reject)=>{
            client.verify.services(serviceId)
             .verifications
             .create({to: '+917356877448', channel: 'sms'})
             .then(verification => console.log(verification.sid));
            resolve('sussess')
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
            }).then((response)=>{
                console.log(response);
                resolve()
            })
        })
    },
    generateRazorpay: (subscriptionId)=>{
        var options={
            amount : 2999,
            currency:"INR",
            receipt : ""+subscriptionId
        };
        instance.orders.create(options,function(err,order){
            // console.log(order);
            if(err){
                console.log(err);
            }else{
                resolve(order) 
            }
        })
    },
    getPremium: (uId,date)=>{
        return new Promise((resolve,reject)=>{
            let sub_id = new objectId();
            db.collection('users').updateOne({_id:objectId(uId)},
                { 
                    $set: { 
                        'premium':{
                            sub_id : objectId(sub_id),
                            dueDate : date
                        }
                    }  
                }).then(()=>{
                    resolve(sub_id);
                })
        })
    },

    editProduct: (data, pId)=>{
        console.log(data);
        return new Promise((resolve,reject)=>{
            productModel.updateOne({_id : pId},
                {
                    $set : {
                        name : data.name,
                        price : data.price,
                        description : data.description
                    }
                }
            ).then(()=>{
                resolve()
            })
        })
    },

    deleteProduct : (p_id)=>{
        console.log(p_id)
        return new Promise((resolve, reject)=>{
            productModel.deleteOne({_id:p_id}).then((response)=>{
                resolve(response)
            })
        })
    }
}