/**
 * Created by jack8 on 2015/11/8.
 */


var authPath = "/authenticated/j_security_check";
var authenticate = function (request, rootUrl, username, password) {
    request.get(rootUrl, function(err) {
       if (err) {
           console.log('Error: ' + err.message);
           return 'Can not connect to Sever';
       } else {
           var authUrl = rootUrl + authPath;
           request.post({url: authUrl, form: {j_username: username, j_password: password}}, function(err, res) {
               if (err) {
                   console.log('Auth Error: ' + err.message);
                   return 'Auth Error' + err.message;
               } else {
                    var authMsg = res.headers['X-com-ibm-team-repository-web-auth-msg'];
                    //Auth failed!
                    if (authMsg && (authMsg === 'authrequired' || isLogined === 'authfailed')) {
                        return 'AuthFailed';
                    } else {
                        return null;
                    }
               }
           });
       }
    });
};

module.exports = authenticate;