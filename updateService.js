var dgram = require('dgram');
// s 这里是个全局的 socket
var s = dgram.createSocket('udp4');
//载入事件包
var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 
var net = require('net');
var fs=require('fs');
var needle = require('needle'); //一个轻量级的http client模块
var exec = require('child_process').exec;
var http = require('http');
var querystring = require('querystring');

//xml处理
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var builder = new xml2js.Builder({headless:true,cdata:true}); //去掉 <?xml version="1.0" encoding="UTF-8" standalone="yes"?>

var serverIP = '115.159.39.71';



//定时任务，需要安装 node-schedule包
	var schedule = require("node-schedule");
	var rule = new schedule.RecurrenceRule();
	var times = [];
	for(var i=1; i<60; i++){
		times.push(i);
		}
	rule.second = times;
	var Timer = 0;
	var j = schedule.scheduleJob(rule, function(){
		fs.readFile('./config.json', function (err, data) {
			if (err) throw err;
			
			//console.log("--------timer config data---------------");
			//timer 的 设置
			timerLimit = JSON.parse(data).timer;
			//console.log("timerLimit:["+timerLimit+"]");
			//console.log("----------------------------------------");
			
			Timer++;
			//console.log("Current timer: "+Timer);
			if (Timer>timerLimit){
				Timer = 0;
				reConnectServer();
				}
			});
		});


function resetTimer(){
	Timer = 0;
	console.log("Timer reseted");
}

// 服务器重连，Socket通信
function reConnectServer(){
	//这里connect函数返回一个socket对象，所以这之后的client为socket对象
	client = net.connect({host:remoteIp,port: remotePort},function() {
		console.log('connected to server!');
		connected = 1;
	});
	client.setKeepAlive(true,1000);
	client.on('data', function(data) {
	console.log("Data received:"+data.toString());
	if(data=="ID"){
		client.write("ID="+appID); 
	}
			  	  
	//网络服务器发来的看门狗喂食信息
	if(data.slice(0,12).toString() == "connectionOK"){
		resetTimer();  //重设看门狗Timer
		}
			  
	//这里判断网络服务器发来消息...		  			
				
	});
					
	client.on('end', function() {
		console.log('disconnected from server');
	});		
}



//读取config里的信息,并且存入变量,初始化,注意json里的参数前面无var，所以作为全局变量
fs.readFile('./config.json', function (err, data) {
	if (err) throw err;
	console.log("--------------config data---------------");
	//本程序UDP ip 及 port
	localIp = JSON.parse(data).localIp;
	console.log("LocalIP:["+localIp+"]");
	localUDPPort = JSON.parse(data).localUDPPort;
	console.log("LocalUDPPort:["+localUDPPort+"]");
	//本地AS程序UDP port
	localASUDPPort = JSON.parse(data).localASUDPPort;
	console.log("localASUDPPort:["+localASUDPPort+"]");
	
	//appID
	appID = JSON.parse(data).appID;
	console.log("appID:["+appID+"]");
			
	//网络服务器连接
	remoteIp = JSON.parse(data).remoteIp;
	console.log("remoteIp:["+remoteIp+"]");
	remotePort = JSON.parse(data).remotePort;
	console.log("remotePort:["+remotePort+"]");
	remoteDownloadPort = JSON.parse(data).remoteDownloadPort;
	console.log("remoteDownloadPort:["+remoteDownloadPort+"]");
	console.log("----------------------------------------");
			

	/****************************初始化********************/
	//这里首次连接网络服务器，Socket通信
	client = net.connect({host:remoteIp,port: remotePort},
		function(err) {
			if(err){
				console.log("error: ["+err+"]");
			}else{
				console.log('connected to server!');
				connected = 1;
			}
	});
	client.setKeepAlive(true,1000);

	client.on('data', function(data) {
		console.log(data.toString());
		if(data=="ID"){
		client.write("ID="+appID); 
		}
			  
		//网络服务器发来的看门狗喂食信息
		if(data.slice(0,12).toString() == "connectionOK"){
			resetTimer();  //重设看门狗Timer
		}
		
		if(data.slice(0,2)=='{"'){
			//console.log(data);
			var jsonData = JSON.parse(data);
			if(jsonData.result == 'update finished'){
				console.log("Download code received");
				//console.log(data);
				
				var savePath = jsonData.savePath;
				var fileName = jsonData.fileName;
				var appid = jsonData.appid;
				var path = jsonData.path;
				var fileNameUncap = delExtension(fileName);

				var multiData = {savePath:savePath,fileName:fileName,appid:appid,path:path};
				console.log("Receive download remind for: "+path);
				needle.request('post', remoteIp+':'+remoteDownloadPort+'/download', multiData, function(err, resp) {
					if (!err && resp.statusCode == 200){
						console.log("start writefile...");						
						fs.writeFile("D:/zip/"+fileNameUncap+".zip", resp.body,function(err){
							if(err){
								console.log(err);
								}else{
									console.log("write file:"+fileNameUncap+".zip in:./ finished"); // here you go, mister.
									console.log("start unzip file:"+fileNameUncap+".zip...");
									exec("unzip.exe -o D:/zip/"+fileNameUncap+".zip -d "+savePath);
									
									//exec("unzip.exe -o "+file_name+" -d "+savePath);
									//client.write("downloaded");
									//UDP发消息
									/*
									var buf = new Buffer('{"path":"'+save_path+'","name":"'+file_name+'"}', 'utf-8');
									s.send(buf, 0, buf.length, localASUDPPort, localIp, function(err) {
										if(err){
											console.log("error:"+err+" socket closed");
											s.close();
											}
										});
									*/	
									}
							});												
						}
					});
					
				}
			
			if(jsonData.result == 'getModuleInfo'){
				console.log("loading moduleInfo...");
				fs.readFile("../config.xml",function(err,data){
					if(err){
						console.log(err);
						}else{		
							parser.addListener('end', function(result){								
								console.log(data.toString('utf8'));
								console.log(result);								
								var jsonMsg = {command:"saveModuleInfo",appid:jsonData.appid,moduleInfo:result};
								console.log("saving moduleInfo...");
								console.log(JSON.stringify(jsonMsg));								
								var postData = querystring.stringify({'data':JSON.stringify(jsonMsg)});
								console.log(postData);
								console.log("-----------------------------------");
								//发送请求						
								sendPostData(postData);
								});				
							parser.parseString(data);
							}		
					});
				}

			if(jsonData.result == 'getPageInfo'){
				console.log("loading page info...");
				fs.readFile(jsonData.pagePath,function(err,data){
					if(err){
						console.log(err);
						}else{
							parser.addListener('end', function(result){								
								console.log(data.toString('utf8'));
								//console.log(result);								
								var jsonMsg = {command:"savePageInfo",appid:jsonData.appid,pageEname:jsonData.pageEname,pageInfo:result};
								console.log("saving pageInfo...");
								//console.log(JSON.stringify(jsonMsg));								
								var postData = querystring.stringify({'data':JSON.stringify(jsonMsg)});
								//console.log(postData);
								console.log("-----------------------------------");
								//发送请求
								sendPostData(postData);
								});				
							parser.parseString(data);
							}		
					});
				}

			if(jsonData.result == 'modPageInfo'){
				console.log("request for pageInfo from server...");
				var jsonMsg = {command:"getPageInfo",appid:jsonData.appid,pageEname:jsonData.pageEname,pagePath:jsonData.pagePath};
				var postData = querystring.stringify({'data':JSON.stringify(jsonMsg)});
				sendPostDataCallback(postData,function(receivedData){
					//console.log("received data:"+receivedData);
					var receivedJson = JSON.parse(receivedData);
					var pageInfo = receivedJson.data.pageInfo;
					console.log("pageInfo :"+JSON.stringify(pageInfo));
					console.log("constructing page info...");
					
					var xml = builder.buildObject(pageInfo);
					fs.writeFile("./test.xml",xml,function(err){
						if(err){
							console.log(err);
							}else{
								console.log("finish writing xml file.");
								}
						});					
					
					});

				
				
				
				

				
				
				
				/*
				fs.writeFile(jsonData.pagePath,function(err,data){
					if(err){
						console.log(err);
						}else{
							parser.addListener('end', function(result){								
								console.log(data.toString('utf8'));
								console.log(result);								
								var jsonMsg = {command:"savePageInfo",appid:jsonData.appid,pageEname:jsonData.pageEname,pageInfo:result};
								console.log("saving pageInfo...");
								console.log(JSON.stringify(jsonMsg));								
								var postData = querystring.stringify({'data':JSON.stringify(jsonMsg)});
								console.log(postData);
								console.log("-----------------------------------");
								//发送请求
								sendPostData(postData);
								});				
							parser.parseString(data);
							}		
					});
				*/
				}			
			}	
		});
		
			
	client.on('end',function(){
		console.log("disconnected from server");
		});		

			

	//UDP通信端口绑定,用于指定UDP监听message端口		
	s.bind(localUDPPort,localIp);
			
	console.log("UDP datagrame bind to ["+localIp+"] on port ["+localUDPPort+"].");			
			
	s.on('message',function(msg,rinfo){
		console.log("UDP message got:["+msg+"] from " +rinfo.address+":"+rinfo.port);
		//这里判断UDP发来消息...
	});			
	/****************************初始化********************/	
});



function sendPostData(postData){
	console.log("sending msg to "+serverIP);
	var options = {
		hostname: serverIP,
		port: 6007,
		path: '',
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded','Content-Length': postData.length}
		};
	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
		console.log('BODY: ' + chunk);
	  });
	  res.on('end', function() {
		console.log('No more data in response.')
	  })
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(postData);
	req.end();	
}


function sendPostDataCallback(postData,callback){
	console.log("sending msg to "+serverIP);
	var options = {
		hostname: serverIP,
		port: 6007,
		path: '',
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded','Content-Length': postData.length}
		};
	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  var receivedData = "";
	  res.on('data', function (chunk) {
		//console.log('BODY: ' + chunk);
		receivedData += chunk;
	  });
	  res.on('end', function() {
		console.log('No more data in response.');
		//console.log(receivedData);
		callback(receivedData);
		receivedData = "";
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(postData);
	req.end();	
}


//去掉后缀
function delExtension(str){
	var reg = /\.\w+$/;
	return str.replace(reg,'');
	}
