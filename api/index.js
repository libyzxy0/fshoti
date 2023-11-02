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

async function insertData(obj) {
  try {
    const database = client.db('Shoti');
    const collection = database.collection('shotis');
    const insertResult = await collection.insertMany([
      {
        video_id: obj.id,
        user_id: obj.usr,
        title: obj.title,
        duration: obj.duration,
        username: obj.username,
        nickname: obj.nickname
      }
    ]);
    console.log('Res:', insertResult);
    return insertResult
  } catch (err) {
    console.log(err);
  }
}

async function readData(col) {
  try {
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection(col);
    const query = {};
    const result = await collection.find(query).toArray();
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

app.get('/api', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    let videos = await readData('videos');
    let shuffledVideos1 = shuffle(videos);
    let shuffledVideos = shuffle(shuffledVideos1);
    let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
    let id = video.url;
    let result = await tikwm.getVideoInfo(id);
    res.type('json').send(JSON.stringify({
      code: 200,
      message: 'success', 
      data: {
        region: result.data?.region,
        url: "https://shoti-api.libyzxy0.repl.co/video-cdn/"+ result.data?.id,
        cover: "http://tikwm.com/video/cover/" + result.data?.id + ".webp",
        title: result.data?.title,
        duration: result.data?.duration + "s", 
        user: {
          username: result.data.author.unique_id,
          nickname: result.data.author.nickname,
        }
      }
    }, null, 2) + '\n');
  } catch (err) {
    res.send({ code: 500, error: err.message })
  }
})

app.listen(3000, () => {
  console.log(`App is listening on port 3000.`);
})