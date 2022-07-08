const express = require('express')
const fileUpload = require('express-fileupload')
const path = require('path')

const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
var multipart = require('parse-multipart');

const connStr = "BlobEndpoint=https://icecapstorage.blob.core.windows.net/;QueueEndpoint=https://icecapstorage.queue.core.windows.net/;FileEndpoint=https://icecapstorage.file.core.windows.net/;TableEndpoint=https://icecapstorage.table.core.windows.net/;SharedAccessSignature=sv=2021-06-08&ss=b&srt=s&sp=rwdlacitfx&se=2022-07-09T06:32:43Z&st=2022-06-30T22:32:43Z&spr=https&sig=6jIFG4AwobEOTUCfZUCjwDZafjWN59jqps1FK%2BebVrU%3D";
const blobSasUrl = "https://icecapstorage.blob.core.windows.net/?sv=2021-06-08&ss=bfqt&srt=s&sp=rwdlacupitfx&se=2022-07-09T07:26:07Z&st=2022-06-30T23:26:07Z&spr=https&sig=QCH89hm2gfjq4x7xDZG5m1TT7e7Dxjl%2FtPLhAJGIcaw%3D";
//this is good
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);

async function main() {
  let i = 1;
  let containers = blobServiceClient.listContainers();
  for await (const container of containers) {
    console.log(`Container ${i++}: ${container.name}`);
  }
}

main();
const app = express()

app.set('view engine', 'ejs')

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 },
  })
)

app.get('/', async (req, res, next) => {
  res.render('index')
})

const getBlobName = originalName => {
  const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
  return `${identifier}-${originalName}`;
};
// https://icecapstorage.blob.core.windows.net/training-model/blockblob
// training-model/blockblob/
// https://icecapstorage.blob.core.windows.net/training-model/blockblob?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupitfx&se=2022-07-09T23:33:57Z&st=2022-07-01T15:33:57Z&spr=https&sig=g9n0rnQnZiATc9ar8Xfd%2FbzvzJmgDHHZXaPwQ143riA%3D
app.post('/single', async (req, res, next) => {
  try {

    const file = req.files.mFile
    console.log('*****************')
    console.log(file)

    const fileName = new Date().getTime().toString() + path.extname(file.name)
    const savePath = path.join(__dirname, 'public', 'uploads', file.name)
    console.log('File name: ' + file.name)
    console.log('*****************')
    if (file.truncated) {
      throw new Error('File size is too big...')
    }

    console.log("================")
    console.log("Path: " + savePath)
    await file.mv(savePath)
    const blobName = getBlobName(req.files.mFile.name);
    const connectionString = "BlobEndpoint=https://icecapstorage.blob.core.windows.net/;QueueEndpoint=https://icecapstorage.queue.core.windows.net/;FileEndpoint=https://icecapstorage.file.core.windows.net/;TableEndpoint=https://icecapstorage.table.core.windows.net/;SharedAccessSignature=sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupitfx&se=2022-07-09T23:49:31Z&st=2022-07-01T15:49:31Z&spr=https&sig=i9kZk5o9QscupFi1pC0AF7aYOa%2BawwNJJWx%2FBEkUy%2F4%3D";
    const blobServiceA = new BlockBlobClient(connectionString, "training-model-input", blobName)
    const result = await blobServiceA.uploadFile(savePath)
    console.log("================")
    console.log(result)
    res.redirect('/')
  } catch (error) {
    console.log(error)
    res.send('Error uploading file')
  }
})


app.post('/multiple', async (req, res, next) => {
  try {
    const files = req.files.mFiles ? req.files.mFiles : req.files.files
    files.forEach(file => {
      console.log('*****************')
      console.log(file)
      const savePath = path.join(__dirname, 'public', 'uploads', file.name)
      console.log('File name: ' + file.name)
      console.log('*****************')
      if (file.truncated) {
        throw new Error('File size is too big...')
      }
      console.log("================")
      console.log("Path: " + savePath)
      file.mv(savePath)
      const blobName = getBlobName(file.name);
      const connectionString = "BlobEndpoint=https://icecapstorage.blob.core.windows.net/;QueueEndpoint=https://icecapstorage.queue.core.windows.net/;FileEndpoint=https://icecapstorage.file.core.windows.net/;TableEndpoint=https://icecapstorage.table.core.windows.net/;SharedAccessSignature=sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupitfx&se=2022-07-09T23:49:31Z&st=2022-07-01T15:49:31Z&spr=https&sig=i9kZk5o9QscupFi1pC0AF7aYOa%2BawwNJJWx%2FBEkUy%2F4%3D";
      const blobServiceA = new BlockBlobClient(connectionString, "training-model-input", blobName)
      const result = blobServiceA.uploadFile(savePath).then(res => {
        console.log("================\n\n")
        console.log(res)
      })
    })
    res.redirect('/')
  } catch (error) {
    console.log(error)
    res.send('Error uploading files...')
  }
})

app.listen(3001, () => console.log('🚀 server on port 3001'))
