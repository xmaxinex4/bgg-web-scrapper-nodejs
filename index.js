
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { getGameDetailsFromBggXmlResult } = require("./helpers/getGameDetailsFromBggXmlResult");

async function performScraping() {  
  const getPageData = async (minPageRange, maxPageRange) => {
    for (let pageIndex = minPageRange; pageIndex <= maxPageRange; pageIndex++) {
      // downloading the target web page
      // by performing an HTTP GET request in Axios
      const browsingBoardGamesPage = await axios.request({
        method: "GET",
        url: `https://boardgamegeek.com/browse/boardgame/page/${pageIndex}`,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            "Cookie": "bggusername=xmaxinex4; bggpassword=kz8wr55wua5gawoisnu1akz2hvec4kp2; SessionID=1b7f18a40905ccf181ab0a8995f94ed2e3638df5u1313617"
        },
      });

      const $ = cheerio.load(browsingBoardGamesPage.data)

      const ids = [];
      $("a.primary").each((index, value) => {
        const id = $(value).attr("href");
  
        if (id){
          ids.push(id.replace("/boardgame/", "").split("/")[0]);
        }
      });

      const { data } = await axios.request({
        method: "GET",
        url: `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1`,
        headers: {
            "Content-Type": "application/xml",   
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        },
    });

    if (data) {
        const result = getGameDetailsFromBggXmlResult(data);
        fs.writeFile(`boardgames_${minPageRange}_${maxPageRange}.json`, JSON.stringify(result), () => {});
    }

    return;
  }};

  const getPageDataPromises = [];

  // bgg currently has 1527 browsing pages
  for (let index = 1; index < 1500; index += 100) {
    getPageDataPromises.push(getPageData(index, index+99));  
  }

  getPageDataPromises.push(getPageData(1501, 1527));

  await Promise.all(getPageDataPromises)
}

performScraping()
