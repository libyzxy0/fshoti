const axios = require('axios');

const getVideoInfo = async url => {
  try {
    let domain = 'https://www.tikwm.com';
    let res = await axios.post(domain + '/api/', {}, {
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        // 'cookie': 'current_language=en; _ga=GA1.1.115940210.1660795490; _gcl_au=1.1.669324151.1660795490; _ga_5370HT04Z3=GS1.1.1660795489.1.1.1660795513.0.0.0',
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

    return {
      error: false,
      user: res.data.data.author ? res.data.data.author : '',
      data: {
        play: domain + res.data.data.play,
        wmplay: domain + res.data.data.wmplay,
        hdplay: domain + res.data.data.hdplay, url: `https://shoti-api.libyzxy0.repl.co/video-cdn/${res.data.data.id}`,
        duration: res.data.data.duration,
      }
    }
  } catch (err) {
    return {
      error: true,
      user: {
        unique_id: null,
        nickname: null
      },
      data: {
        url: "https://shoti-api.libyzxy0.repl.co/err.mp4",
        error: err.message,
        wmplay: null,
        hdplay: null,
        play: null,
        duration: null,
      }
    }
  }
}

module.exports = { getVideoInfo }