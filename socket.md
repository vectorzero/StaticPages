server.js
```js
var express = require('express');
var app = express();
var server = app.listen(8666); 

var io = require('socket.io').listen(server);
io.sockets.on('connection', (socket) => {
  console.log('client connect server, ok!');

  // io.emit()方法用于向服务端发送消息，参数1表示自定义的数据名，参数2表示需要配合事件传入的参数
  // io.emit('serverMessage', {msg:'client connect server success'});

  // socket.broadcast.emit()表示向除了自己以外的客户端发送消息
  // socket.broadcast.emit('server message', {msg:'broadcast'});

  // 监听断开连接状态：socket的disconnect事件表示客户端与服务端断开连接
  // socket.on('disconnect', ()=>{
  //   console.log('connect disconnect');
  // });
  
  // 与客户端对应的接收指定的消息
  socket.on('clientMessage', (data)=>{
  	if (data === 'sumbit') {
		console.log('sende ok');
  		io.emit('serverMessage', 'ok');
  	}
  });

  // socket.disconnect();
});
```

main.js
```js
import VueSocketio from 'vue-socket.io';
import socketio from 'socket.io-client';

const SocketInstance = socketio.connect('http://10.5.9.23:8666');
Vue.use(new VueSocketio({
  debug: true,
  connection: SocketInstance
}));
```
index.vue

```js
sockets: {
    connect() {
      // console.log(this.$socket.id)
    },
    serverMessage(data) {  //监听message事件，方法是后台定义和提供的
     if (data === 'ok') {
       this.getAllGrades();
     }
    }
  },
methods: {
  updateSocket() {  //添加按钮事件向服务端发送数据
    this.$socket.emit('clientMessage', 'sumbit');
   }
}
```
