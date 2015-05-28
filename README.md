Firefox OS SimplePush Example
-----------------------------

Server (needs mongodb) and Web app to showcase the SimplePush API in FirefoxOS


Server deployed in Heroku
-------------------------

* Register
Post your channel id as post parameter 'client' to url: https://foxypush.herokuapp.com/api/v1/register

* Unregister 
Post your channel id as post parameter 'client' to url: https://foxypush.herokuapp.com/api/v1/unregister

* Send a message
Post your channel id as 'client' and your message as 'message' to url: https://foxypush.herokuapp.com/api/v1/

* Receive a message
Get your channel id as get parameter 'client' to url: https://foxypush.herokuapp.com/api/v1/[message number]?client=[client]

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/arcturus/firefox-os-simplepush/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

