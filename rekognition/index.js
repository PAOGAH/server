const AWS = require('aws-sdk');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

let params = {
  "Image": {
      "S3Object": {
          "Bucket": "pakogah-project",
          "Name": "plaaaaaaaaaaaaaat.png"
      }
  }
}

rekognition.detectText(params, function(err, data) {
  if (err) {
    console.log(err, err.stack);
  }
  else {
    const platCriteria = //

    let detectedText = data.TextDetections.map(detect => detect.DetectedText); 
    let plat = detectedText.filter
    console.log(detectedText);
    // console.log(JSON.stringify(data.TextDetections));
  }
});