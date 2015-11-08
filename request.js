/**
 * Created by jack8 on 2015/11/8.
 */

var fs = require('fs'),
    request = require('request'),
    process = require('process');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var request = request.defaults({ jar : true});

var url = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var authUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz/authenticated/j_security_check";
var rootServicesUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz/rootservices";

request.get(url, function (err, res) {
    if (err) {
        console.log('Error: ' + err.message);
    } else {
        request.post({ url:authUrl, form: { j_username:'jack', j_password:'jack'} }, function(err, res) {
            if (err) {
                console.log('Error: ' + err.message);
            } else {
                console.log(res.headers);
                var options = {
                    url: rootServicesUrl,
                    headers: {
                        'Accept': 'application/json'
                    }
                };
                request.get(options, function(err, res) {
                    console.log(res.body);
                }).pipe(fs.createWriteStream('services.json'));
            }
        });
    }
});