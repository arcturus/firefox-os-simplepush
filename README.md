Firefox OS SimplePush Example
-----------------------------

Server (needs mongodb) and Web app to showcase the SimplePush API in FirefoxOS


Server deployed in appfog
-------------------------

* Register
Post your channel id as post parameter 'client' to url: http://simplepushclient.eu01.aws.af.cm/api/v1/register

* Unregister 
Post your channel id as post parameter 'client' to url: http://simplepushclient.eu01.aws.af.cm/api/v1/unregister

* Send a message
Post your channel id as 'client' and your message as 'message' to url: http://simplepushclient.eu01.aws.af.cm/api/v1/

* Receive a message
Get your channel id as get parameter 'client' to url: http://simplepushclient.eu01.aws.af.cm/api/v1/[message number]?client=[client]