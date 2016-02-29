var fs = require('fs');
var gm = require('gm').subClass({imageMagick:true});
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});

exports.handler = function(event, context) {
    console.log(JSON.stringify(event, null, 2));
    console.log(JSON.stringify(context, null, 2));

    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;

    s3.getObject({
        Bucket: bucket,
        Key: key,
        IfMatch: event.Records[0].s3.object.eTag
    }, function(err,data) {
        if (err) {
            context.done('error getting object', err);
        } else {
            console.log(data);

            var contentType = data.ContentType;
            var extension = contentType.split('/').pop();

            gm(data.Body).size(function(err, size) {
              var width  = 300;

               this.resize(width)
                   .toBuffer(extension, function(err, stdout) {
                       if (err) {
                           next(err);
                       } else {
                          var thumbnailBucket = bucket + "-thumbnail";
                          //var thumbnailKey = key.split('.')[0] + "-thumbnail." + extension;
                          var thumbnailKey = key;
                          s3.putObject({
                              Bucket: thumbnailBucket,
                              Key: thumbnailKey,
                              Body: new Buffer(stdout, 'binary'),
                              ContentType: contentType
                          }, function(err, res) {
                              if (err) {
                                  context.done('error putting object', err);
                              } else {
                                  console.log(JSON.stringify(res, null, 2));
                                  context.done();
                              }
                          });
                       }
                   });
            });
        }
    });
};
