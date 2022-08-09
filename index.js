'use strict';

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const {Storage} = require('@google-cloud/storage');
const {resolve} = require('path');
const {info} = require('console');
const storage = new Storage();

const {DESTINATION_BUCKET_NAME} = process.env;

exports.imageprocessing = async event => {
  const object = event;

  const file = storage.bucket(object.bucket).file(object.name);
  const filePath = `gs://${object.bucket}/image/${object.name}`;

  console.log(`Getting ${file.name}.`);
  
  try {
    const ext = await path.ext(file.name)
    const req = [".jpg", ".webp", "avif"]
  
    if (ext.includes(req)) {
      console.log(`File ${file.name} will be processed.`);
      return await imageprocess(file, DESTINATION_BUCKET_NAME);
    } else {
      console.log(`File ${file.name} will not processed.`);
    }
  } catch (err) {
    console.error(`Failed to detect ${file.name}.`, err);
    throw err;
  } 
};

const imageprocess = async (file, destinationBucketName) => {

  const tempLocalPath = `/tmp/${path.parse(file.name).base}`;
  const thumbnail = `/tmp/${path.parse(file.name).name}`;
    
  // Download file from bucket.
  try {
    await file.download({destination: tempLocalPath});
      
    console.log(`Downloaded ${file.name} to ${tempLocalPath}.`);
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  await new Promise((resolve, reject) => {
    sharp(tempLocalPath)
      .resize({
        width: 200,
        height: 200,
        })
      .toFile(tempLocalPath, (err, info) => {
        if (err) {
          console.error('Failed to process image.', err);
          reject(err);
        } else {
          console.log(`Processed image: ${file.name}`);
          resolve(info);
        }
      });

});
    
/*   
  const webp = sharp(tempLocalPath)
      .toFormat('webp');

  const jpg = sharp(tempLocalPath)
      .toFormat('jpg');
      
*/    
  const destinationBucket = storage.bucket(destinationBucketName);

  const gcsPath = `gs://${destinationBucketName}/${file.name}`;
  try {
    await destinationBucket.upload(tempLocalPath, {destination: file.name});
    console.log(`Uploaded processed image to: ${gcsPath}`);
  } catch (err) {
    throw new Error(`Unable to upload processed image to ${gcsPath}: ${err}`);
  }

    // Delete the temporary file.
    return fs.unlink(tempLocalPath);
};
