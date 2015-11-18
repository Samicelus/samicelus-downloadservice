# samicelus-downloadservice
download service with samicelus-ctrl product management system 

Install
================

You should have Node.js installed on your server.
The current version is tested on Windows 7 Premium Service Pack 1 64x.
* [node-v0.10.26-x64](http://pan.baidu.com/s/1i3JbpIl) -node for windows 64bit

Then download unzip.exe and put it in the same directory which has updateService.js
* [unzip.exe](http://pan.baidu.com/s/1o6MUNUi) -unzip.exe


Initialize Client
================

Configurate the config.json , settle your localIP, serverIP, serverPort
```js
{
"localIp":"127.0.0.1",
"localIpName":"本机IP",
"localUDPPort":"9001",
"localUDPPortName":"本服务UDP端口",
"localASUDPPort":"7001",
"localASUDPPortName":"本地AS程序UDP端口",
"remoteIp":"127.0.0.1",
"remoteIpName":"网络服务器IP",
"remotePort":"10095",
"remotePortName":"网络服务器Socket端口",
"remoteDownloadPort":"5901",
"remoteDownloadPortName":"网络服务器下载端口",
"remoteDatabasePort":6007,
"remoteDatabasePortName":"网络服务器product数据服务端口",
"appID":"TESTTEST00010001",
"appIDName":"新添加端口测试",
"timer":60,
"timerName":"看门狗最迟喂狗周期"
}
```
