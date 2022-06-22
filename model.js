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
    orders:{
        type: Array,
    },
    products:{
        type:Array
    },
    sales:{
        type: Array
    },
    favorites:{
        type : Array
    },
    totalRevenue:{  
        type: Number
    }
})

const User = mongoose.model('User',userSchema)

const productSchema = new mongoose.Schema({
    s_id: {
        type: String,
    },
    p_id:{
        type: String
    },
    status:{
        type: String
    },
    location:{
        type: Object
    },
    product:{
        type: Object
    }
})

const product = mongoose.model('Products',productSchema)

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
    email:{
        type: String,
        required: 'Email is required'
    },
    address:{
        type : String,
        required: 'Address is required',
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