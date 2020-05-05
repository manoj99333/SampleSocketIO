const express = require('express');

const app = express();
const httpsPort = 3000;

var https = require('https');

var fs = require('fs');  
var options = {  
    key: fs.readFileSync('./key.pem', 'utf8'),  
    cert: fs.readFileSync('./server.crt', 'utf8')  
};


var secureServer = https.createServer(options, app).listen(httpsPort, () => {  
    console.log(">> CentraliZr listening at port " + httpsPort);  
}); 



///////////////////////////////////////////////websocket///////////////////////////////////


var users=[];
var rooms=[];
var empty=[];
var emptyuser=[];
var sendempty=[];


var useridroommap=new Map();						///{key,value}; key=username,value=roomname;
var roomusersmap=new Map();                   ///{key,[]} key=room name,[]=username;


var io = require('socket.io').listen(secureServer);

io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		var msgObj = JSON.parse(message);
		log('Got message: ', message);
    // For a real app, should be room only (not broadcast)
		//socket.broadcast.emit('message', message);
		var numClients = io.sockets.clients(msgObj.displayName).length;
		
			
		//log('-------------Room ' + msgObj.displayName + ' has ' + numClients + ' client(s)');
		//io.sockets.in(msgObj.displayName).emit('message', message);
		socket.broadcast.to(msgObj.displayName).emit('message', message);
	});


	
	
	
	socket.on('username entry', function (username) {
		log('Got message: for user entry ', username);
		if(useridroommap.get(username)==null)
		{
			
			useridroommap.set(username,"");
			log("username**************************888"+useridroommap.get(username));
			
			//socket.broadcast.emit('roomdetails', roominfoarray);
		    socket.emit('roomdetails', JSON.stringify(Array.from(roomusersmap)));
			
		}else{
			socket.emit('Error', "Username already exixt....");
		}
		
		
	});

	socket.on('create room', function (userroomstr) {
		var userroomstrsplit=userroomstr.split(",");
		
		var username=userroomstrsplit[0];
		var roomname=userroomstrsplit[1];
		log('Got message: for room creation ', username+".....>>>"+roomname);
		
		//var searchroom=false;
		roomusersmap.forEach(function(values,keys)
		{
		   if(keys==roomname){
			   socket.emit('Error', "Room already exixt....");
			   return;
		   }
		  
		});
		useridroommap.set(username,roomname);
		log("Getting room name from user map----------->>>>>>>>>>"+useridroommap.get(username));
		var tempusrnamearray=[];
		tempusrnamearray.push("Default");
		
		roomusersmap.set(roomname,tempusrnamearray);
		//log(roomusersmap);
		//log(JSON.stringify(Array.from(roomusersmap)));
		//log(JSON.stringify(Array.from(useridroommap)));
		socket.broadcast.emit('roomdetails',JSON.stringify(Array.from(roomusersmap)) );
		socket.emit('roomdetails', JSON.stringify(Array.from(roomusersmap)));
		//socket.join(roomname);
	});
	
	socket.on('join room', function (userroomstr) {
		var userroomstrsplit=userroomstr.split(",");
		
		var username=userroomstrsplit[0];
		var requestroomname=userroomstrsplit[1];
		log('Got message: for room joing from user-------->>>>>>', username);
		log('Got message: for room joing-------->>>>>>', requestroomname);
		
		//var searchroom=false;
		
		var currentroomname=useridroommap.get(username);
		log(useridroommap);
		log('Got message: for room joing ', currentroomname);
		if(currentroomname===""){
			socket.join(requestroomname);
			useridroommap.set(username,requestroomname);
			log('useridroommap map updated: for user---------'+username+'-------- joinng room --------- ', useridroommap.get(username));
			var tempusrnamearray=roomusersmap.get(requestroomname);
			log('Got message: for room joing ', tempusrnamearray);
			tempusrnamearray.push(username);
			roomusersmap.set(requestroomname,tempusrnamearray);
			
		}else{
			
			socket.leave(currentroomname);
			socket.join(requestroomname);
			useridroommap.set(username,requestroomname);
			
			var tempusrnamearray=roomusersmap.get(currentroomname);
			if(tempusrnamearray!=null){
			const index = tempusrnamearray.indexOf(username);
			if (index > -1) {
			tempusrnamearray.splice(index, 1);
			}
			
			roomusersmap.set(currentroomname,tempusrnamearray);
			}
			
			var tempusrnamearray=roomusersmap.get(requestroomname);
			if(tempusrnamearray!=null){
			tempusrnamearray.push(username);
			roomusersmap.set(requestroomname,tempusrnamearray);
			}
		}
		
				
		//log(JSON.stringify(Array.from(roomusersmap)));
		//log(JSON.stringify(Array.from(useridroommap)));
		socket.broadcast.emit('roomdetails',JSON.stringify(Array.from(roomusersmap)) );
		socket.emit('roomdetails', JSON.stringify(Array.from(roomusersmap)));
		socket.emit('room joined', requestroomname);
		
	});
	
	
	socket.on('leave room', function (userroomstr) {
		var userroomstrsplit=userroomstr.split(",");
		
		var username=userroomstrsplit[0];
		var newroomname=userroomstrsplit[1];
		log('Got message: for room joing from user-------->>>>>>', username);
		log('Got message: for room joing-------->>>>>>', newroomname);
		
		//var searchroom=false;
		
		var oldroomname=useridroommap.get(username);
		//var oldroom=currentroomname;
		log(useridroommap);
		log('Got message: for room joing ', oldroomname);
		if(oldroomname===""){
			/*socket.join(newroomname);
			useridroommap.set(username,newroomname);
			log('useridroommap map updated: for user---------'+username+'-------- joinng room --------- ', useridroommap.get(username));
			var tempusrnamearray=roomusersmap.get(newroomname);
			log('Got message: for room joing ', tempusrnamearray);
			tempusrnamearray.push(username);
			roomusersmap.set(newroomname,tempusrnamearray);*/
			
		}else{
			
			
			
			//useridroommap.set(username,newroomname);
			
			var tempusrnamearray=roomusersmap.get(oldroomname);
			
			if(tempusrnamearray!=null){
			const index = tempusrnamearray.indexOf(username);
			
			
			if (index > -1) {
			tempusrnamearray.splice(index, 1);
			}
			
			roomusersmap.set(oldroomname,tempusrnamearray);
			}
			
			/*var tempusrnamearray=roomusersmap.get(newroomname);
			if(tempusrnamearray!=null){
			tempusrnamearray.push(username);
			roomusersmap.set(newroomname,tempusrnamearray);}*/
		}
		log("old room"+oldroomname);
		//log("new room"+newroomname);
		socket.leave(oldroomname);
		//socket.join(newroomname);	
		socket.broadcast.to(oldroomname).emit('delete mytagfromusers', (username+","+newroomname));
		
		socket.emit('delete othertagfromself', JSON.stringify(roomusersmap.get(oldroomname)));
			
		//log(JSON.stringify(Array.from(roomusersmap)));
		//log(JSON.stringify(Array.from(useridroommap)));
		socket.broadcast.emit('roomdetails',JSON.stringify(Array.from(roomusersmap)) );
		socket.emit('roomdetails', JSON.stringify(Array.from(roomusersmap)));
		//socket.emit('delete usrtag', (username+","+oldroom));
		
	});
	
	
	
	
	
	
	/*
	
	socket.on('create or join', function (room) {
		log("got message from client room info-----"+room);
		var roomname=room.split(",");
		console.log(users.length);
		
		
				
		if(userdetails.get(roomname[0])==null){
			var emptyroom=[];
			var emptyusers=[];
			roomuser.set(socket.id,emptyroom.push(roomname[0]));
			userdetails.set(roomname[0],emptyusers.push(roomname[1]))
			
		}
		
		
		var numClients = io.sockets.clients(roomname[0]).length;
		
			
		log('Room ' + roomname[0] + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', roomname[0]);
		
		log('rooms details');
        log('rooms details'+rooms);
		
		
		
					///////////////////////////////////////////
		
		////////////////////////////////////////////	
		
		if (numClients == 0){
			socket.join(roomname[0]);
			
            var roomdata=roomuser.get(socket.id);
						
			socket.emit('created', roomdata);
		} else if (numClients < 5) {
			
			
			socket.join(roomname[0]);
			
			
			
			io.sockets.in(roomname[0]).emit('roomdetails', message);
			
			socket.emit('roomdetails', message);
			
			
			io.sockets.in(roomname[0]).emit('join', message);
			
			socket.emit('joined', message);
		
		
		
		} else { // max two clients
			socket.emit('full', roomname[0]);
		}
		//socket.emit('emit(): client ' + socket.id + ' joined room ' + roomname[0]);
		//socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + roomname[0]);

	});
			*/

	socket.on('disconnect', function(){
		log("ondisconnect call");
		
  //delete usernames[socket.username];
 // io.sockets.emit('updateusers', usernames);
  //socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
 });
});