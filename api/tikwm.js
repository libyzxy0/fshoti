const axios = require('axios');

const getVideoInfo = async url => {
  try {
    let domain = 'https://www.tikwm.com';
    let res = await axios.post(domain + '/api/', {}, {
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
      },
      params: {
        url: url,
        count: 12,
        cursor: 0,
        web: 1,
        hd: 1
      }
    })

    return res.data
  } catch (err) {
    console.log(err);
    return null
  }
}
const getVideoInfoV2 = async (id) => {

  const options = {
    method: 'GET',
    url: 'https://tiktok-video-no-watermark2.p.rapidapi.com/',
    params: {
      url: id,
      hd: '1'
    },
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data
  } catch (error) {
    return null
  }
}
module.exports = { getVideoInfo, getVideoInfoV2 };