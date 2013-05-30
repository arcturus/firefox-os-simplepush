var mongoq = require('mongoq'),
    request = require('request');

// Deal with each channel and keeps
// track of the secquence number and history
// Format:
// {
//    "client": "<channel url>",
//    "sequence": <sequenece number>
//    "history": [<msg1>,<msg2>, ...] 
// }
var Client = function Client() {

  var db, messages;

  var init = function init(url) {
    db = mongoq(url, {safe: false});
    messages = db.collection('messages');
  };

  // Propertly saves on the database the client
  var createNewClient = function createNewClient(client, cb) {
    var obj = {
      'client': client,
      'sequence': 0, // This could be the history length
      'history': []
    };

    messages.insert(obj).done(function onDone() {
      cb(obj);
    });
  };

  // Send message to client, using the client url and the sequence number
  // increase sequence number to keep history
  var sendMessage = function sendMessage(client, message, res) {
    var selector = {'client': client};
    messages.findOne(selector).done(function onDone(obj) {
      if (!obj) {
        res.send(404, 'No client ' + client);
        return;
      }

      obj.history.push(message);
      obj.sequence = obj.history.length;

      var sequence = 'version=' + obj.sequence;

      // Update the object in mongo, and after that perform the
      // request to the push notification server
      messages.update(selector, obj).done(function onDone() {
        request({
          method: 'PUT',
          uri: obj.client,
          body: sequence
        }, function onRequest(error, response, body) {
          if (error) {
            res.send(500, error);
            return;
          }

          res.send(response.statusCode, body);
        });

      });
    });
  };

  // Requires parameter client (which is a url)
  var register = function register(req, res) {
    var params = req.body;

    if (!params || !params.client) {
      res.send(404, 'No client on the POST body');
      return;
    }

    messages.find({'client': params.client}).
      count().done(function onDone(num) {
        if (num == 0) {
          createNewClient(params.client, function onCreated(obj) {
            res.send(200, obj);
          });
        }
    });
  };

  // Remove client
  var unregister = function unregister(req, res) {
    var params = req.body;

    if (!params || !params.client) {
      res.send(404, 'No client on the POST body');
      return;
    }

    messages.remove({'client': params.client}).done(function onDone(obj) {
      // TODO: Unregister from push notification server
      res.send(200, obj);
    });    
  };

  var send = function send(req, res) {
    var params = req.body;

    if (!params || !params.client) {
      res.send(404, 'No client on the POST body');
      return;
    }
    if (!params.message) {
      res.send(404, 'No message to send');
    }

    sendMessage(params.client, params.message, res);
  };

  var get = function get(req, res) {
    var index = parseInt(req.params.seq) - 1;
    var client = req.query['client'];

    if (index < 0 || !client) {
      res.send(404, 'No message');
      return;
    }

    messages.findOne({'client': client}).done(function onDone(obj) {
      if (!obj) {
        res.send(404, 'No such client');
        return;
      }

      var messages = obj.history;
      if (messages.length <= index) {
        res.send(404, 'No such message');
        return;
      }

      res.send(200, messages[index]);
    });
  };

  return {
    'init': init,
    'register': register,
    'unregister': unregister,
    'send': send,
    'get': get
  };

}();

module.exports = Client;
