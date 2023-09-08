var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors =require ('cors')
const http = require ('http');
require('dotenv').config();

var userRouter = require('./routes/User');
const adminRouter = require('./routes/Admin');

var app = express();


// app.use(cors({
//   origin: process.env.Client_Side_URL ,
//   methods: ["GET", "POST"],
//   credentials: true
// }))
app.use(cors({
  origin: process.env.Client_Side_URL || 'http://localhost:3000', 
  methods: ["GET", "POST"],
  credentials: true
}));


app.use(logger('dev'));
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', userRouter);
app.use('/admin', adminRouter);



const connect = require('./config/connection');
connect();




const httpServer = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer, {
  cors: {
    origin: process.env.Client_Side_URL,
    methods: ['GET', 'POST'],
  },
});

const port = process.env.PORT;
httpServer.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

io.on('connection', (socket) => {
  socket.on('chatMessage', (chatMessage) => {
    io.emit('chatMessage', chatMessage); 
  });

  socket.on('disconnect', () => {
  });
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

// app.listen(process.env.PORT,()=>{
//   console.log("server started port 4000")
// })

module.exports = app;
