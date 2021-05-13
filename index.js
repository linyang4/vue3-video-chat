const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors')
app.use(cors())
const server = require('http').createServer(app.callback())

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
})

io.on('connection', (socket) => {
  // 向客户端推送连接成功消息, socketId作为userId
  socket.emit('connected', socket.id)
  // 客户端断开连接
  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  })

  // 向指定用户拨打视频电话
  socket.on('call-user', ({ fromUser, toUserId }) => {
    io.to(toUserId).emit('waiting-accept', fromUser)
  })

  // 接通电话
  socket.on('call-accept', ({ fromUser, toUserId }) => {
    io.to(toUserId).emit('accepted', fromUser)
  })

  // 挂断电话

  // 拒接接听
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
})