const productModel = require('../model').product;
const userModel = require('../model').User;
const db = require('mongoose').connection
const { response } = require('express');
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId

module.exports = {
    getCategory:(category) =>{
        return new Promise(async(resolve, reject)=> {
            productModel.aggregate([{$match:{'product.category':category}}]).then((products) => {
                resolve(products);
            })
        })
      
    },

    getAllProducts:() => {
        return new Promise((resolve, reject)=> {
            productModel.aggregate([
                {
                    $match : {
                        $or:[
                            {
                                "product.badge": "toplist"
                            },
                            {
                                date : {
                                    $gte : new Date()
                                }
                            }
                        ]
                    }
                }
            ]).then((products) => {
                resolve(products)
            })
        })
    },

    getTopdeals:()=>{
        return new Promise((resolve, reject)=> {
            productModel.find({'product.badge': 'toplist'}).sort({"_id":-1}).limit(4).then((product) => {
                resolve(product)
            })
        })
    },
    sellProduct: async(data,user) => {
        return new Promise(async(resolve, reject)=> {
            console.log(data);
            let p_id = new objectId()
            data.p_id = p_id
            data.s_id = user._id

            data.product.status = 'unsold'
            data.product.price = parseInt(data.product.price)
            console.log(data.product.price)
            let premium = user.premium
            if(premium){
                data.product.badge='toplist'
            }
            data.product.date= new Date()
            const product =await new productModel(data)
            try {
                product.save()
             } catch (err) {
                 console.log(err.message)
             }
             product.product.p_id = p_id
            db.collection('users').updateOne({_id:objectId(user._id)},
            {
                $push: {
                    'products': product.product
                }
            }).then(() => {
                resolve(p_id)
            })
        })
    },
    getProduct:(proId) => {
        return new Promise((resolve, reject)=>{
            productModel.findOne({p_id:proId}).then((product) => {
                resolve(product)

            })
        })
    },
    editProduct: (data, pId)=>{
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
        return new Promise((resolve, reject)=>{
            productModel.deleteOne({p_id:p_id}).then(()=>{
                userModel.updateOne({"products.p_id": objectId(p_id) },
                {
                    $pull: {
                        products : { p_id: objectId(p_id) } 
                    } 
                }
        ).then((response)=>{
                    resolve()
                })
            })
        }) 
    },
    filterProduct : (filter,lt,gt)=>{
        return new Promise(async(resolve, reject)=>{
            gt=parseInt(gt)
            lt=parseInt(lt)
            console.log(filter);
            let result
            if (filter.length > 0) {
                result = await productModel.aggregate([
                    {   
                        $match:{$or:filter}
                    },
                    {
                        $match:{'product.price': {$lte:gt} }
                    } 
                ])
            }else { 
                result = await productModel.aggregate([
                    {
                        $match: {'product.price': {$gte:gt} }
                    } ,
                    {
                        $match:{'product.price': {$lte:lt} }
                    }
                ])
            }
            console.log(result);
            resolve(result)  
        })
    },
    productSold : (pId) => {
        return new Promise((resolve, reject) => {
            productModel.deleteOne({p_id:objectId(pId)}).then((response)=>{
                resolve()
            })
    })
}
}