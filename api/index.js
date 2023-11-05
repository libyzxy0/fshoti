const express = require('express');
const cors = require('cors');
const app = express();
const tikwm = require('./tikwm');
const {
  MongoClient
} = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

(async function() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
})()

async function writeData(col, data) {
  try {
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection(col);
    const result = await collection.insertOne(data)
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function readData(col) {
  try {
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection(col);
    const result = await collection.find({}).toArray();
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function updateData(col, dataID, newData) {
  try {
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection(col);
    const result = await collection.findOneAndUpdate(
      { _id: dataID },
      { $set: newData }
    );
    return result;
  } catch (error) {
    console.log(error);
  }
}

function shuffle(array) {
  let shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray
}
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/api/info', async (req, res) => {
  let { f } = req.body;
  let apikeyList = await readData('apikeys');
  console.log(f)
  if (f == 'leaderboard') {
    apikeyList.sort((a, b) => b.requests - a.requests);
    let top = apikeyList.slice(0, 100);
    const final = top.filter(item => item.requests !== 0)
    res.type('json').send(JSON.stringify(final, null, 2) + '\n');
  } else if (f == 'stats') {
    let count = await readData('videos');
    const requests = apikeyList.reduce((accumulator, currentItem) => accumulator + currentItem.requests, 0);
    res.send({ 
      videos: count.length, 
      users: apikeyList.length,
      requests
    })
  } else {
    res.send({ msg: "method not allowed" })
  }
})

app.post('/api/createkey', async (req, res) => {
  try {
  const { username } = req.body;
  if(!username) {
    res.send({ success: false })
    return;
  }
  console.log(username)
  const uniqueId = Date.now().toString(32) + Math.random().toString(32).substr(3);
  let rs = await writeData('apikeys', {
    username: username ? username : 'Unknown',
    apikey: `$shoti-${uniqueId}`,
    requests: 0,
    createdAt: new Date()
  })
  res.send({ success: true, apikey: '$shoti-' + uniqueId, username: rs })
    
 } catch (err) {
    res.send({ success: false })
 }
})

app.post('/api/v1/add', async (req, res) => {
  try {
    const { url, apikey } = req.body;
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(3);
    let videos = await readData('videos');
    let apikeys = await readData('apikeys');
    let v = videos.find((vid) => vid.url === url);
    if (!v) {
      res.send({ success: false })
      return;
    }
    let k = apikeys.find((key) => key.apikey === apikey);
    if (!k) {
      res.send({ success: false })
      return;
    }
    writeData('videos', {
      url: url,
      id: uniqueId,
      addedDate: new Date()
    }).then(() => {
      res.send({ success: true, id: uniqueId })
    }).catch((err) => {
      console.log(err);
      res.send({ success: false })
    })
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
})

app.post('/api/v1/get', async (req, res) => {
  let { apikey } = req.body;
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    let keys = await readData('apikeys');
    keys.sort((a, b) => b.requests - a.requests);
    const top = keys.slice(0, 100);
    let rd = keys.find((key) => key.apikey === apikey);
    if (!rd) {
      res.type('json').send(JSON.stringify({
        code: 401,
        message: "error-apikey-invalid"
      }, null, 2) + '\n');
      return;
    }
    updateData('apikeys', rd._id, {
      requests: rd.requests + 1,
    })
    const rank = top.findIndex(item => item.apikey === rd.apikey) + 1;
    let cookedData;

    async function generate() {
      try {
      let videos = await readData('videos');
      let shuffledVideos1 = shuffle(videos);
      let shuffledVideos = shuffle(shuffledVideos1);
      let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
      let id = video.url;
      let result = await tikwm.getVideoInfo(id);
      let data = {
        code: result ? 200 : 400,
        message: result ? 'success' : 'error',
        data: {
          _shoti_rank: rank,
          region: result.data?.region,
          url: "https://shoti-api.libyzxy0.repl.co/video-cdn/" + result.data?.id,
          cover: "http://tikwm.com/video/cover/" + result.data?.id + ".webp",
          title: result.data?.title,
          duration: result.data?.duration + "s",
          user: {
            username: result.data.author.unique_id,
            nickname: result.data.author.nickname,
          }
        }
      }
        return data
      } catch (err) {
        console.log(err)
        return null
      }
    }

    let rst = await generate();
    if(rst) {
      cookedData = rst;
      console.log('GET-SHOTI:', rd.username + `#${rank}`);
    }
    if (!rst && rst.code != 200) {
      console.log("Error:", rst)
      async function gen() {
        let rst1 = await generate();
         cookedData = rst1;
      }
      gen()
      return;
    }
    res.type('json').send(JSON.stringify(cookedData, null, 2) + '\n');

  } catch (err) {
    res.send({ code: 500, error: err.message })
  }
})

app.listen(3000, () => {
  console.log(`App is listening on port 3000.`);
})