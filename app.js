var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');require('mongoose');
const db = mongoose.connection
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars')
const Handlebars = require('handlebars');
var app = express();
var fileUpload = require('express-fileupload')
var session=require('express-session')
const dotenv  = require('dotenv')

dotenv.config()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');



Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
app.engine( 'hbs', hbs.engine( {extname: 'hbs',defaultLayout: 'layout',layoutsDir: __dirname + '/views/layout/',partialsDir: __dirname + '/views/partials/'}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({
  name: 'user',
  secret:'key',
  resave: false,
  saveUninitialized: false,
  cookie:{maxAge:86400000}}))
app.use((req,res,next)=>{
    res.set('Cache-Control','no-store')
    next()
  })

mongoose.connect(process.env.MONGODB)

db.on('error',console.error.bind(console,'connection error'));

db.once('open',function(){
  console.log('Connected successfully');
})


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
