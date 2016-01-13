/**
 * Created by jack8 on 2015/11/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var commentSchema = new Schema({
    projectUuid: { type: String},
    workitemId: { type: Number },
    description: { type: String },
    createdTime: { type: Date },
    creator: { type: String }
});

var comment = mongoose.model('comment', commentSchema);

module.exports = {
    Comment: comment
};