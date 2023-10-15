const express = require('express');
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

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/cdn/:id', (req, res) => res.redirect('https://www.tikwm.com/video/media/hdplay/' + req.params.id + '.mp4'));

app.get('/api', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    let videos = await readData('shotis');
    let shuffledVideos1 = shuffle(videos);
    let shuffledVideos = shuffle(shuffledVideos1);
    let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];

    res.type('json').send(JSON.stringify({
      url: 'https://fshoti.vercel.app/cdn/' + video.video_id,
      username: video.username,
      nickname: video.nickname,
      title: video.title,
      duration: video.duration
    }, null, 2) + '\n');
  } catch (err) {
    res.send({ code: 500, error: err.message })
  }
})
app.post('/api', async (req, res) => {
  try {
    let { authkey, url } = req.body;
    let resu = await tikwm(url);
    if (!!resu.data) {
      if (authkey != process.env.AUTHKEY) {
        res.send({ code: 401, message: 'who u' });
      } else {
        let r = await insertData({
          id: resu.data.id,
          usr: resu.data.author.id,
          title: resu.data.title,
          duration: resu.data.duration,
          username: resu.data.author.unique_id,
          nickname: resu.data.author.nickname
        });
        res.send({ code: 200, message: 'success' });
      }
    } else {
      res.send({ code: 400, message: 'error' })
    }
  } catch (err) {
    console.log(err)
    res.send({ code: 500, message: 'server error' })
  }
})

app.listen(3000, () => {
  console.log(`App is listening on port 3000.`);
})