/**
 * Created by jack8 on 2015/11/15.
 */
var fs = require('fs'),
    Fetcher = require('./fetcher.js'),
    Parser = require('./parsers/parser.js'),
    mongoose = require('mongoose'),
    Project = require('./models/project.js').Project,
    User = require('./models/user.js').User,
    Updater = require('./updater.js'),
    UpdateService = require('./updateService.js'),
    Modifier = require('./modifier.js');



var rootUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var username = "jack";
var password = "jack";
var updater = new Updater(rootUrl, username, password);


//connet to MongoDB
var connect = function() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect('mongodb://localhost/rtc', options);
};
connect();

mongoose.connection.on('error', console.log);
//try to reconnect to mongodb when disconnected
mongoose.connection.on('disconnected', connect);

User.find({ username: username }, function (err, user) {
    if (err) {
        console.log("Find user: " + username + " error.");
    }
    if (user.length <= 0) {
        var newUser = new User();
        newUser.password = password;
        newUser.username = username;
        newUser.server.host = "https://opentechtest.chinacloudapp.cn";
        newUser.server.port = 9443;
        newUser.server.context = "jazz";
        newUser.save();
    }
});

/*var updateService = new UpdateService(20);
updateService.start();*/


/*updater.authenticate(function (err) {
    if (err) {
        console.log("Login failed!");
    } else {
        /!*updater.updateSingleWorkitem("https://opentechtest.chinacloudapp.cn:9443/jazz/resource/itemName/com.ibm.team.workitem.WorkItem/116"
            , function (err) {
                if (err) {
                    console.log("asfsd");
                }
                console.log("asfsd");
            });
        updater.getModifiedTimeOfWorkitem("https://opentechtest.chinacloudapp.cn:9443/jazz/resource/itemName/com.ibm.team.workitem.WorkItem/116"
            , function (err, date) {
                if (err) {
                    console.log("eerr");
                }
                console.log(date);
            });*!/
        //updater.updateSingleWorkitem()
        /!*var url = "https://opentechtest.chinacloudapp.cn:9443/jazz/oslc/contexts/_AaqqEpD0EeWXese5nM0f4w/workitems";
        request.get(url, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(res.body);
        }).pipe(fs.createWriteStream('tast_new.xml'));*!/
        /!*updater.updateProjects(function (err, result) {
            console.log(result);
        })*!/
        /!*updater.updateWorkitems('_AaqqEpD0EeWXese5nM0f4w', function (err) {
            if (err)
                console.log("update workitems failed: " + err);
            else
                console.log("successfully");
        });*!/
        /!*updater.updateAllWorkitems(function (err) {
           if (err) {
               console.log("failed: " + err);
           } else {
               console.log("successfully");
           }
        });*!/
        /!*updater.updateProjects(function (err, projects) {
           if (err) {
               console.log("update project failed: " + err);
           } else {
               console.log("successfully : " + projects);
           }
        })*!/
        /!*updater.updateAllComments(function (err) {
            if (err) {
                console.log("update comments failed: " + err)
            } else {
                console.log("successfully");
            }
        })*!/
    }
});*/

var modifier = new Modifier("https://opentechtest.chinacloudapp.cn:9443/jazz", 'jack', 'jack');

modifier.authenticate(function (err) {
    if (err) {
        console.log(err);
        return;
    }
    modifier.getJSESSIONID(function (err, id) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(id);
    });

  //  var json='{"dc:description":"New Comment Jack Auto"}';
    var json = { 'dc:description': 'JSON format test1' };
    modifier.post('POST', 'https://opentechtest.chinacloudapp.cn:9443/jazz/oslc/workitems/118/rtc_cm:comments', json, function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('done');
    });
});







