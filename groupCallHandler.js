const createPeerServerListeners=(peerServer)=>
{
    peerServer.on('connection',(client)=>
    {
        console.log("Group call succesfully connected");
        console.log(client.id);
    })
};


module.exports=
{
    createPeerServerListeners
};