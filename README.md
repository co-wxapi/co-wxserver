# co-wxserver
---
## co-wxserver is a tiny out of the box server that interaction wechat servers

### Installation
```shell
npm install -g co-wxserver
```

### Configuration
Define a json file, contains 3 parts. For example:
```javascript
{
  server : {port: 80},
  redis  : {host: 'localhost', port: 6379},
  accounts: {
    myaccount1: {
      appid: 'wxXXXXXXXXXX',
      appkey: 'XXXXXXXXXXXXXXXX',
      timeout: 10000
    }
  }
}
```

### Start server
```javascript
wxserver <configuration>
```
If no configuration file is provided, then wxserver will search .wxrc under current directory or under /etc directory  


### Management
wxserver is a rest API server, we can manage wechat apps by using http request.

> Register apps
```
http://your.domain.name/app/register?appid=myapp&appname=My%20Test%20App&appkey=mykey
```

> Register oauth redirect
For example to register state *test1* with url *http://yourhost/handle*
```
http://your.domain.name/app/oauthRegister?appid=myapp&appkey=mykey&state=test1&redirect=http://yourhost/handle
```
 Open the url in wechat
```
http://your.domain.name/wechat/oauth?state=test1
```
 It will redirect to the state we previously registered
```
http://yourhost/handle?ts=xxxxx&wxapp=xxxx&data=xxxx
  ts - the server timestamp
  wxapp - wechat appid
  data  - the encrypted user info, see encrypt/decrypt below
```

### Data encrypt/decrypt
When data need to be send from co-wxserver to your server, it will be encrypted by using the appkey you registered.
* encrypt process - aes192 encrypt with appkey then url safe base64 encode
* decrypt process - url safe base64 decode then aes192 decrypt with appkey
