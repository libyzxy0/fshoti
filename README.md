# F-Shoti | Shoti API
A Fast and Free api for sending random shoti videos.

## Getting Started
Install axios package, so we can fetch the data.
```sh
npm install axios
```

Getting Result
```js
const axios = require('axios');

(async function() {
  const response = await axios.get('https://fshoti.vercel.app/api');
  console.log(response.data) //Returns an object
})()
```
The result will look like this:
```json
{
  "url": "htrps://example.com/video.mp4",
  "username": "libyzxy0",
  "nickname": "Liby",
  "title": "Shoti everyday",
  "duration": 0
}
```