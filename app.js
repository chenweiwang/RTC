var newRequest = require('./newRequest.js'),
    authenticate = require('./authenticate.js');

var rootUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var username = "jack";
var password = "jack";
var request = newRequest();

if (authenticate(request, rootUrl, username, password)) {
    console.log("Login failed!");
} else {
    console.log("Login to " + rootUrl + " success!");
}




