/**
 * Created by v-wajie on 3/14/2016.
 */

var authenticate = require('./authenticate.js'),
    newRequest = require('./newRequest.js'),
    async = require('async');

function Modifier(rootUrl, username, password) {
    this.rootUrl = rootUrl;
    var tmp = newRequest();
    this.request = tmp.request;
    this.jar = tmp.jar;
    this.username = username;
    this.password = password;
    this.hasAuthed = false;
}

module.exports = Modifier;

Modifier.prototype.authenticate = function (callback) {
    var self = this;
    if (!self.hasAuthed) {
        authenticate(this.request, this.rootUrl, this.username, this.password, function (err) {
            if (err) {
                console.log("Login Authenticated Failed.! Error: " + err);
                callback(err);
            } else {
                self.hasAuthed = true;
                callback(null);
            }
        })
    } else {
        callback(null);
    }
};

Modifier.prototype.getJSESSIONID = function (callback) {
    var self = this;
    if (!self.hasAuthed) {
        return callback('Please authenticate first!');
    }

    var cookies = self.jar.getCookies(self.rootUrl);

    for (var i = 0; i < cookies.length; ++i) {
        if (cookies[i].key === 'JSESSIONID') {
            return callback(null, cookies[i].value);
        }
    }

    return callback('Cookie JESSIONID can not find.');
};

Modifier.prototype.upload = function (method, url, json, callback) {
    var self = this;
    if (!self.hasAuthed) {
        return callback('Please authenticate first!');
    }

    async.waterfall([
        function (callback) {
            self.getJSESSIONID(callback);
        },
        function (JsessionId, callback) {
            var options = {
                method: method,
                url: url,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Jazz-CSRF-Prevent': JsessionId
                },
                body: JSON.stringify(json)
            };

            self.request(options, function (err, response) {
                if (!err && (response.statusCode === 200 || response.statusCode === 201)) {
                    return callback(null);
                }

                callback('Modifier.Upload failed: ' + response.statusCode);
            })
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        return callback(null);
    });
};

Modifier.prototype.addComment = function (workitemId, json, callback) {
    var self = this;
    var url = self.rootUrl + '/oslc/workitems/' + workitemId + '/rtc_cm:comments';
    self.upload('POST', url, json, function (err) {
        if (err) {
            console.log('POST comment ERROR: ' + err);
            return callback(err);
        }
        callback(null);
    })
};

Modifier.prototype.modifyWorkitem = function (workitemId, json, callback) {
    var self = this;
    var url = self.rootUrl + '/oslc/workitems/' + workitemId;
    self.upload('PUT', url, json, function (err) {
        if (err) {
            console.log('PUT workitem attributes: ' + json.toString() + 'ERROR: ' + err);
            return callback(err);
        }
        callback(null);
    })
};




