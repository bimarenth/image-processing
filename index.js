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
  const filePath = `gs://${object.bucket}/${object.name}`;

  console.log(`Getting ${file.name}.`);
  
  try {
    const ext = path.extname(file.name);
    console.log(ext)
    // const reqext = {"jpg", "png", }
    const req = (ext.includes("jpg") || ext.includes("png") || ext.includes("webp") || ext.includes("avif") || ext.includes("jpeg"));
  
    if (req) {
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
  const newfile = `/tmp/${path.parse(file.name).name}`;

    
  // Download file from bucket.
  try {
    await file.download({destination: tempLocalPath});
      
    console.log(`Downloaded ${file.name} to ${tempLocalPath}.`);
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  const thumbimage = (newfile+'_thumb.jpg')
  const avifimage = (newfile+'.avif')
  const webpimage = (newfile+'.webp')
  const jpgimage = (newfile+'.jpg')

  await new Promise((resolve, reject) => {
    const thumb = sharp(tempLocalPath)
      .resize({
        width: 200,
        height: 200,
        fit: sharp.fit.outside
        })
      .toFile(thumbimage, (err, info) => {
        if (err) {
          console.error('Failed to process thumbnail image.', err);
          reject(err);
        } else {
          console.log(`Processed thumbnail image: ${file.name}`);
          resolve(info);
        }
      });

    const webp = sharp(tempLocalPath)
      .toFile(webpimage, (err, info) => {
        if (err) {
          console.error('Failed to process webp image.', err);
          reject(err);
        } else {
          console.log(`Processed webp image: ${file.name}`);
          resolve(info);
        }
      });

    const jpg = sharp(tempLocalPath)
      .toFile(jpgimage, (err, info) => {
        if (err) {
          console.error('Failed to process jpg image.', err);
          reject(err);
        } else {
          console.log(`Processed jpg image: ${file.name}`);
          resolve(info);
        }
      });

    const avif = sharp(tempLocalPath)
      .toFile(avifimage, (err, info) => {
        if (err) {
          console.error('Failed to process avif image.', err);
          reject(err);
        } else {
          console.log(`Processed avif image: ${file.name}`);
          resolve(info);
        }
      });

  });
     
  const destinationBucket = storage.bucket(destinationBucketName);

  const thumbpath = `gs://${destinationBucketName}/${thumbimage}`;
  const jpgpath = `gs://${destinationBucketName}/${jpgimage}`;
  const avifpath = `gs://${destinationBucketName}/${avifimage}`;
  const webppath = `gs://${destinationBucketName}/${webpimage}`;

  try {
    await destinationBucket.upload(thumbimage, {destination: thumbimage
    });
    console.log(`Uploaded thumbnail image to: ${thumbpath}`);
  } catch (err) {
    throw new Error(`Unable to upload thumbnail image to ${thumbpath}: ${err}`);
  }

  try {
    await destinationBucket.upload(jpgimage, {destination: jpgimage
    });
    console.log(`Uploaded jpg image to: ${jpgpath}`);
  } catch (err) {
    throw new Error(`Unable to upload jpg image to ${jpgpath}: ${err}`);
  }

  try {
    await destinationBucket.upload(avifimage, {destination: avifimage
    });
    console.log(`Uploaded avif image to: ${avifpath}`);
  } catch (err) {
    throw new Error(`Unable to upload avif image to ${avifpath}: ${err}`);
  }

  try {
    await destinationBucket.upload(webpimage, {destination: webpimage
    });
    console.log(`Uploaded webp image to: ${webppath}`);
  } catch (err) {
    throw new Error(`Unable to upload webp image to ${webppath}: ${err}`);
  }

  
    // Delete the temporary file.
    return fs.unlink(tempLocalPath);
};
