const AWS = require('aws-sdk');

module.exports = (params) => {
  return new Promise ((resolve, reject) => {
    const s3 = new AWS.S3();
    
    s3.upload(params, (err, data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
};