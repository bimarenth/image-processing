'use strict';

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const {BLURRED_BUCKET_NAME} = process.env;

export.imageprocessing = async event => {
    const object = event;

    const file = storage.bucket(object.bucket).file(object.name);
    const filePath = `gs://${object.bucket}/${object.name}`;

    console.log(`Getting ${file.name}.`);
}

const tempLocalPath = `/tmp/${path.parse(file.name).base}`;
  // Download file from bucket.
  try {
    await file.download({destination: tempLocalPath});
    console.log(`Downloaded ${file.name} to ${tempLocalPath}.`);
    }

  catch (err) {
    throw new Error(`File download failed: ${err}`);
    }

const thumbnail = sharp(tempLocalPath)
    .resize({
        width: 200,
        height: 200,
    })
    .toFormat('png')