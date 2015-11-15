/**
 * Created by jack8 on 2015/11/8.
 */
var process = require('process'),
    request = require('request');

module.exports = function () {
    //to fix the self-signed certificate error
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    //enable cookie manager!
    return request.defaults({jar: true, followAllRedirects: true});
}




