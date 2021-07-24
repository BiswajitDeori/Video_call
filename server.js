
const express=require('express')
const socket=require('socket.io')

const {v4:uuidv4} =require('uuid');

const {ExpressPeerServer} = require('peer');

const groupCallHandler =require('./groupCallHandler')



const port =5000;


const app=express()

const server=app.listen(port,()=>{console.log(`running in ${port}`)})

const broadcastEventTypes={

    ACTIVE_USERS:'ACTIVE_USERS',
    GROUP_CALL_ROOMS:'GROUP_CALL_ROOMS'

}

const io=socket(server,{
cors:
{
    origin:'*',
    methods:['GET','POST']
}

});

let peers=[];

let groupCallRooms=[];
const peerServer=ExpressPeerServer(server,
    {
        debug:true
    });
app.use('/peerjs',peerServer);

groupCallHandler.createPeerServerListeners(peerServer);


io.on('connection',(socket)=>
{
socket.emit('connection',null);
console.log('new user connected')
console.log(socket.id);

socket.on('register-new-user',(data)=>
{
peers.push({
    Username:data.Username,
    socketId:data.socketId
});

console.log('Register new User');
console.log(peers);

io.emit('broadcast',{
    event:broadcastEventTypes.ACTIVE_USERS,
    activeUsers:peers


});




});


socket.on('disconnect',()=>
{
console.log('disconnect a user')
console.log(socket.id)
peers=peers.filter(peers=>peers.socketId!=socket.id)


io.emit('broadcast',{
    event:broadcastEventTypes.ACTIVE_USERS,
    activeUsers:peers


});


});

socket.on('pre-offer',(data)=>
{
console.log(`pre-offer handle ${data.callee.socketId}`);

io.to(data.callee.socketId).emit('pre-offer',{
    callerUsername:data.caller.username,
    callerSocketId:socket.id
})


})
socket.on('pre-offer-answer',(data)=>
{
    console.log(`pre answer ${data.answer}`);
    console.log(`the target user ${data.callerSocketId}`)
    io.to(data.callerSocketId).emit('pre-offer-answer',{
        answer:data.answer
    });
});

socket.on('webRTC-offer',(data)=>
{
    console.log('handle webRTC offer');
    io.to(data.calleeSocketId).emit('webRTC-offer',
    {
        offer:data.offer
    })
});

socket.on('webRTC-answer',(data)=>
{
    console.log('webrtc answer');

    io.to(data.callerSocketId).emit('webRTC-answer',{
answer:data.answer

    });
});

socket.on('webRTC-candidate',(data)=>{

    // console.log("ice candidate enter");
    io.to(data.connectedUserSocketId).emit('webRTC-candidate',{
        candidate:data.candidate

    });
})

socket.on('user-hanged-up',(data)=>
{
    // console.log('user hanged up');

    io.to(data.connectedUserSocketId).emit('user-hanged-up');

});
//
socket.on('group-call-register',(data)=>
{
    const roomId=uuidv4();
    socket.join(roomId);
    const newGroupRoom={
        peerId:data.peerId,
        hostName:data.username,
        sokcetId:socket.id,
        roomId:roomId


    };
    groupCallRooms.push(newGroupRoom);
    console.log(`ftech data${newGroupRoom}`)
    console.log(`new group call${groupCallRooms}`)
    io.emit('broadcast',{
        event:broadcastEventTypes.GROUP_CALL_ROOMS,
        groupCallRooms
    });

})
});

