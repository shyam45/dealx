const userModel = require('../model').User;
const productModel = require('../model').product;
const locationModel = require('../model').location
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId

module.exports = {
    getUserCount:()=>{
        return new Promise(async(resolve, reject) => {
            let count = await userModel.countDocuments();
            resolve(count);
        })
    },
    getPremiumCount:()=>{
        return new Promise(async(resolve, reject) => {
            let count = await userModel.find({ pincode: { $ne: null } }).count();
            console.log(count);
        })
    },
    getRevenue:()=>{
        return new Promise(async(resolve, reject) => {
            let response = await userModel.aggregate([
                {
                    $match: {
                        role : 'admin'
                    }
                },
                {
                    $project:{
                        _id:0,
                        totalRevenue:1
                    }
                }
            ])
            resolve(response[0].totalRevenue);
        })
    },
    allUsers:()=>{
        return new Promise(async(resolve, reject) => {
            let users = await userModel.find({role :{$ne: 'admin'}})
            resolve(users);
        })
    },
    userDetails:(u_id)=>{
        return new Promise(async(resolve, reject) => {
            let details = await userModel.aggregate([
                {
                    $match:{
                        _id:objectId(u_id)
                    }
                }
            ]);
            let products = await userModel.aggregate([
                {
                    $match : {
                        _id: objectId(u_id),
                    }
                },
                {
                   $project: {
                      _id:0,
                      productCount: { $cond: { if: { $isArray: "$products" }, then: { $size: "$products" }, else: 0} }
                   }
                }
            ] )
            let orders = await userModel.aggregate([
                {
                    $match : {
                        _id: objectId(u_id),
                    }
                },
                {
                   $project: {
                      _id:0,
                      orderCount: { $cond: { if: { $isArray: "$orders" }, then: { $size: "$orders" }, else: 0} }
                   }
                }
            ] )
            let sales = await userModel.aggregate([
                {
                    $match : {
                        _id: objectId(u_id),
                    }
                },
                {
                   $project: {
                      _id:0,
                      salesCount: { $cond: { if: { $isArray: "$sales" }, then: { $size: "$sales" }, else: 0} }
                   }
                }
            ] )
            let location = await locationModel.findOne({u_id: u_id},{'_id':0,'location':1})
            let city
            if (location) {
                city = location.city
            }else{
                city = 'Not Available'
            }
            console.log(city);
            resolve({products,sales,orders,city,details});
        })
    }
}