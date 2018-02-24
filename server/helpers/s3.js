require('dotenv').config();
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import aws from 'aws-sdk';

function getS3Config(S3_BUCKET, fileType, fileName) {
  // We should Make this options a helper method:
  aws.config.region = 'us-west-2';
  // const fileName = 'record-red-bg-180-2.png'; // This can be anything
  // const fileType = 'image/png'; // req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60, // in seconds
    ContentType: fileType,
    ACL: 'public-read'
  };
  return s3Params;
}

function signS3(S3_BUCKET, fileType, newFileName, cbSuccess, cbError) {
  // Probably only need to do this once:
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  const s3Params = getS3Config(S3_BUCKET, fileType, newFileName);
  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      return cbError(err);
    }
    const returnData = {
      signedRequest: data, // <-- the useful one
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${newFileName}`
    };
    cbSuccess(returnData);
  });

}

export default {
  signS3
};
