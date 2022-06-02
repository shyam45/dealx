const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: 'name is required',
        minlength:4
    },
    email:{
        type : String,
        required: 'Email is required',
        lowercase: true,
        unique: true
    },
    role:{
        type: String,

    },
    phone:{
        type : Number,
        required: 'Phone number is required',
        minlength:9
    },
    password:{
        type : String,
        required: 'Password is required',
        minlength:8
    },
    favorites:{
        type : Array
    }
})

const User = mongoose.model('User',userSchema)

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: 'name is required',
        minlength:4
    },
    category:{
        type: String,
        required: 'category is required',
    },
    description:{
        type : String,
        required: 'description is required',
    },
    price:{
        type : Number,
        required: 'Price is required',
        minlength:9
    },
    details:{
        type : String,
        required: 'Details is required',
    },
    toplist:{
        type : Boolean
    }
})

const product = mongoose.model('Prooducts',productSchema)

const locationSchema = new mongoose.Schema({
    u_id:{
        type: String,
    },
    name:{
        type: String,
        required: 'name is required',
        minlength:4
    },
    phone:{
        type: Number,
        required: 'PhoneNumber is required',
    },
    houseName:{
        type : String,
        required: 'HouseName is required',
    },
    city:{
        type : String,
        required: 'City is required',
    },
    pincode:{
        type : Number,
        required: 'pincode is required',
        minlength:6
    }
})

const location = mongoose.model('location',locationSchema)


module.exports = {User,product,location};