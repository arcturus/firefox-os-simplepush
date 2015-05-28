var SimplePushTest = function SimplePushTest() {

  var app,
      subscribeButton,
      unsbuscribeButton,
      closeButton,
      notifications,
      channel,
      lastMessage;

  var init = function init() {
    notifications = [];

    updateUI();
  };

  var updateUI = function updateUI() {
    if (closeButton == null) {
      closeButton = document.getElementById('closeButton');
      subscribeButton = document.getElementById('subscribeButton');
      unsubscribeButton = document.getElementById('unsubscribeButton');
      closeButton.addEventListener('click', handleEvent);
      subscribeButton.addEventListener('click', handleEvent);
      unsubscribeButton.addEventListener('click', handleEvent);
    }
    
    // localStorage is DEVIL, but have no time :P
    channel = localStorage.channel;
    lastMessage = localStorage.lastMessage;

    subscribeButton.disabled = channel != null;
    unsubscribeButton.disabled = channel == null;

    var msgArea = document.getElementById('lastMessage');
    if (lastMessage != null) {
      msgArea.firstChild.nextSibling.textContent = lastMessage; // I do this cause I'm a bad boy
      msgArea.classList.remove('hide');
    } else {
      msgArea.classList.add('hide');
    }
  };


  var handleEvent = function onEvent(evt) {
    switch (evt.target.id) {
      case 'closeButton':
        window.close();
        break;
      case 'subscribeButton':
        subscribe();
        break;
      case 'unsubscribeButton':
        unsubscribe();
        break;
      default:
        break;
    }
  };

  // Register for notifications, once we got the channel (endpoint),
  // tell the server side of this app where it can reach us
  var subscribe = function subscribe() {
    if (!navigator.push) {
      alert('No SimplePush API :(');
      return;
    }

    subscribeButton.disabled = true;

    // Here comes the magic
    var req = navigator.push.register();

    req.onsuccess = function onSuccess(evt) {
      // We get an unique channel identifier
      var endpoint = req.result;

      // Send to the console, so we can use it to send messages via curl
      console.log('NEW PUSH NOTIFICATION CHANNEL :::: ' + endpoint);

      // In our case we send it to our server, so both
      // servers in the cloud can communicate
      var data = new FormData();
      data.append('client', endpoint);
      doRequest('POST', '/api/v1/register', data, function onRequest(err, res) {
        if (err) {
          subscribeButton.disabled = false;
          console.error('Error sending our channel ::: ' + err.target.status);
          alert('Could not register channel ' + endpoint);
        } else {
          localStorage.channel = endpoint;
          updateUI();
        }
      });
    };

    req.onerror = function onError(evt) {
      alert('Preview push server not available :(');
    }
  };

  var unsubscribe = function unsubscribe() {
    if (channel == null) {
      return;
    }
    var data = new FormData();
    data.append('client', channel);
    doRequest('POST', '/api/v1/unregister', data, function onRequest(err, res) {
      delete localStorage.channel;
      updateUI();
    });
  };

  // Each time that we receive a push  notification message is just
  // a version, a sequence. 
  // With our current implementation we get that sequence number, our channel
  // and ask our server (not the push server), to deliver the message for us.
  var onPushMessage = function onPushMessage(version) {
    doRequest('GET', '/api/v1/' + version + '?client=' + channel, null,
      function onRequest(err, data) {
        if (err) {
          console.error(err);
          return;
        }

        localStorage.lastMessage = data;
        updateUI();
        createNotification(data);
    });
  };

  var getAppReference = function getAppReference(cb) {
    var request = navigator.mozApps.getSelf();
    request.onsuccess = function onApp(evt) {
      cb(evt.target.result);
    };
  };

  var getAppIcon = function getAppIcon(cb) {
    function buildIconURI(a) {
      var icons = a.manifest.icons;
      return a.installOrigin + icons['60'];
    }

    if (app != null) {
      cb(buildIconURI(app));
      return;
    }

    getAppReference(function onsuccess(a) {
      app = a;
      cb(buildIconURI(app));
    });
  };

  // Perform a request against the simplepushclient server
  var doRequest = function doPost(type, endPoint, data, cb) {
    var uri = 'https://foxypush.herokuapp.com' + endPoint;
    var xhr = new XMLHttpRequest({mozSystem: true});

    xhr.onload = function onLoad(evt) {
      if (xhr.status === 200 || xhr.status === 0) {
        cb(null, xhr.response);
      } else {
        cb(xhr.status);
      }
    };
    xhr.open(type, uri, true);
    xhr.onerror = function onError(e) {
      console.error('onerror en xhr ' + xhr.status);
      cb(e);
    }
    xhr.send(data);
  };

  var createNotification = function createAdvancedNotification(msg) {
    getAppIcon(function onAppIcon(icon) {
      var notification = navigator.mozNotification.createNotification(
        'SimplePush Test',
        msg,
        icon);

      notification.onclick = function onclick() {
        forgetNotification();
        app.launch();
      };

      notification.onclose = function onclose() {
        console.log('Notification closed');
        forgetNotification();
      };

      notification.show();
      notifications.push(notification);
    });
  };

  var forgetNotification = function onForget(not) {
    notifications.splice(notifications.indexOf(not), 1);
  };

  return {
    'init': init,
    'getAppReference': getAppReference,
    'onPushMessage': onPushMessage
  };


}();

SimplePushTest.init();

window.navigator.mozSetMessageHandler('notification', function onNotification(message) {
  var imageUrl = message.imageURL;
  SimplePushTest.getAppReference(function onApp(app) {
    app.launch();
  });
});

// Listen to push notifications
window.navigator.mozSetMessageHandler('push', function onPush(evt) {
  var channel = evt.pushEndpoint; // We dont use it, but could have several channels per app
  var version = evt.version;

  SimplePushTest.onPushMessage(version);
});
