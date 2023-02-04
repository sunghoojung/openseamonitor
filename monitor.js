const proxys = proxy.split(":");
const httpsAgent = new HttpsProxyAgent({
  host: proxys[0],
  port: parseInt(proxys[1]),
  auth: `${proxys[2]}:${proxys[3]}`,
});
const axiospog = axios.create({ httpsAgent });
async function sendWebhook(message, image, link) {
  let webhookdata = {
    content: `${message}`,
    embeds: [
      {
        title: "Restocked!",
        url: link,
        color: 11332077,
        thumbnail: {
          url: image,
        },
      },
    ],
    username: "Monitor",
  };
  await axios.post(discordWebhook, webhookdata);
}

async function sendRequest() {
  try {
    let checkerreponse = await axiospog.get(
        `https://api.opensea.io/api/v1/events?account_address=${address}&limit=${getRandomNumber(1,1000000000000000)}&limit=1`,
      {
        headers: {
          Host: "api.opensea.io",
        },
      }
    );
    let checker = checkerreponse.data.asset_events[0].created_date;

    while (true) {
      let link = `https://api.opensea.io/api/v1/events?account_address=${address}&limit=${getRandomNumber(1,10000000000000000)}&limit=1`;
      let response = await axiospog.get(link, {
        headers: {
          Host: "api.opensea.io",
        },
      });
      let itemLink = response.data.asset_events[0].asset.permalink;
      console.log(`cache: ${response.headers["cf-cache-status"]} ${itemLink}`);

      if (response.data.asset_events[0].created_date !== checker) {
        console.log("new item!");
        if (
          response.data.asset_events[0].from_account.address ==
          "0x0000000000000000000000000000000000000000"
        ) {
          console.log("Newly minted item!");
          if (
            collectionName ==
            response.data.asset_events[0].asset.collection.name
          ) {
            sendWebhook(
              `${response.data.asset_events[0].asset.name} link is ${itemLink} Transaction type: Mint`,
              response.data.asset_events[0].asset.image_url,
              itemLink
            );
          }
          let newTimestamp1 = await axiospog.get(link, {
            headers: {
              Host: "api.opensea.io",
            },
          });
          checker = newTimestamp1.data.asset_events[0].created_date;
          await sleep(delay);
        }

        if (
          response.data.asset_events[0].from_account.address == address &&
          response.data.asset_events[0].to_account == null
        ) {
          console.log("Newly listed item!");
          if (
            collectionName ==
            response.data.asset_events[0].asset.collection.name
          ) {
            sendWebhook(
              `${response.data.asset_events[0].asset.name} link is ${itemLink} Transaction type: List`,
              response.data.asset_events[0].asset.image_url,
              itemLink
            );
          }
          let newTimestamp2 = await axiospog.get(link, {
            headers: {
              Host: "api.opensea.io",
            },
          });
          checker = newTimestamp2.data.asset_events[0].created_date;
          await sleep(delay);
        }
      }
      await sleep(delay);
    }
  } catch (error) {
    console.log(error.response);
    setTimeout(function () {
      sendRequest();
    }, 2000);
  }
}
sendRequest();