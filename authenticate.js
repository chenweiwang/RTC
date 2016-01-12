/**
 * Created by jack on 2015/11/8.
 *
 * Authentication参考文档： https://jazz.net/wiki/bin/view/Main/NativeClientAuthentication
 *
 The following example lists the appropriate responses when a native client performs
 a POST to j_security_check POST:
     POST https://localhost:9443/jts/j_security_check
     j_username=ADMIN&j_password=ADMIN
 The response needs to be analyzed for the following possibilities:
    1. If there is a header X-com-ibm-team-repository-web-auth-msg, check whether its value is
        authfailed: This implies the provided credentials are invalid.
       Anything else: This should not happen and implies a server configuration problem.
    2. Or, if there is no such header, but the status code is 302 and The URI for the Location
       header contains the path /auth/authfailed: This implies the provided credentials are also invalid.
       All other cases of a 302: This implies that the authentication succeeded.
    3. Or, if the response code is 200: This also implies that the authentication succeeded.
    4. Any other response means there is some other non-authentication related error.
 */


var authPath = "/authenticated/j_security_check";
var authenticate = function (request, rootUrl, username, password, callback) {
    request.get(rootUrl, function (err) {
        if (err) {
            console.log('Error: ' + err.message);
            return callback('Can not connect to Sever');
        } else {
            var authUrl = rootUrl + authPath;
            request.post({url: authUrl, form: {j_username: username, j_password: password}}, function (err, res) {
                if (err) {
                    console.log('Auth Error: ' + err.message);
                    return callback('Auth Error' + err.message);
                } else {
                    var authMsg = res.headers['X-com-ibm-team-repository-web-auth-msg'];
                    //Auth failed!
                    if (authMsg) {
                        if (authMsg === 'authrequired' || authMsg === 'authfailed') {
                            return callback('AuthFailed');
                        }
                        return callback(null);
                    } else if (res.statusCode === 200){
                        return callback(null);
                    } else if (res.statusCode === 302) {
                        if (res.headers['Location'].contains('auth/authfailed')) {
                            return callback('AuthFailed');
                        } else {
                            return callback(null);
                        }
                    } else {
                        return callback("AuthFailed, Server internal error.");
                    }
                }
            });
        }
    });

};

module.exports = authenticate;