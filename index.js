const http = require('http').createServer();
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')


io.on('connection', (socket) => {

    console.log("We have a new connection!")
    socket.on('join', ({ name, room }) => {

        const { error, user } = addUser({ id: socket.id, name, room });

        if (error){
            socket.emit('error',{error: error});
            return;
        }

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}.` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

        socket.join(user.room);
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        }
    })

    socket.on('getRoomData',()=>{
        const user = getUser(socket.id);
        socket.emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    })
    socket.on('sendMessage', (message) => {
        const user = getUser(socket.id);
        socket.broadcast.to(user.room).emit('message', { user: user.name, text: message })
    })
})

http.listen(PORT, () =>  console.log(`server listening on port: ${PORT}`))