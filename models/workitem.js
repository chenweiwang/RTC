/**
 * Created by v-wajie on 2015/11/25.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var workitemSchema = new Schema({
    projectUuid: { type: String, require: true, trim: true },
    id: { type: Number, require: true, trim: true, index: { unique: true } },
    type: { title: {type: String, trim: true }, identifier: { type: String, trim: true },  url: { type: String, trim: true } },
    filedAgainst: { title: { type: String }, url: { type: String, trim: true } },
    ownedBy: { name: { type: String }, url: { type: String, trim: true } },
    createdBy: { name: { type: String }, url: { type: String, trim: true } },
    createdTime: { type: Date },
    lastModifiedTime: { type: Date },
    title: { type: String },
    decription: { type: String },
    priority: { title: { type: String }, url: { type: String, trim: true } },
    severity: { title: { type: String }, url: { type: String, trim: true } },
    commentsUrl: { type: String, trim: true },
    subscribersUrl: { type: String, trim: true },
    plannedFor: { title: { type: String }, url: { type: String, trim: true } },
    dueDate: { type: Date }
});

var workitem = mongoose.model('workitem', workitemSchema);

module.exports = {
    Workitem: workitem
};
