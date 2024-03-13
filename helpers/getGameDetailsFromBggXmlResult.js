const xmlConverter = require("xml-js");

function getGameDetailsFromBggXmlResult(xml) {
  const convertedJson = JSON.parse(xmlConverter.xml2json(xml, { compact: true }));
  const result = [];

  if (!(convertedJson && convertedJson?.items?.item)) {
    console.log("Could not convert game xml to json");
    return result;
  }

  const gameItems = convertedJson.items.item;

  if (!gameItems) {
    console.log("Game item was not found");
    return result;
  }

  gameItems.forEach(gameItem => {
    // skip expansions
    if (gameItem._attributes.type !== "boardgame") {
      console.log(`found non boardgame type: ${gameItem._attributes.type}`);
      return;
    }

    // game name either returns one non-array if only one name
    // or game name returns an array if multiple names (the first is primary so we use that)
    let gameName = "";
    if (gameItem?.name?.length > 0) {
      gameName = gameItem?.name?.[0]?._attributes?.value;
    } else {
      gameName = gameItem?.name?._attributes?.value || "";
    }

    const categoriesAndMechanics = [];
    if (gameItem?.link && gameItem.link.length > 0){
      gameItem.link.forEach((link)=> {
          const linkType = link._attributes.type;
          if (linkType === "boardgamecategory" || linkType === "boardgamemechanic") {
              categoriesAndMechanics.push(link._attributes.value);
          }
        }
      );
    }
      
    result.push({
      bggId: gameItem._attributes.id,
      name: gameName,
      description: gameItem.description._text,
      minPlayers: parseInt(gameItem.minplayers._attributes.value, 10),
      maxPlayers: parseInt(gameItem.maxplayers._attributes.value, 10),
      minPlayTime: parseInt(gameItem.minplaytime._attributes.value, 10),
      maxPlayTime: parseInt(gameItem.maxplaytime._attributes.value, 10),
      minAge: parseInt(gameItem.minage._attributes.value, 10),
      categoriesAndMechanics,
      rating: parseFloat(gameItem.statistics.ratings.average._attributes.value) / 2,
      complexity: parseFloat(gameItem.statistics.ratings.averageweight._attributes.value),
      urlThumb: gameItem?.thumbnail?._text,
      urlImage: gameItem?.image?._text,
    });
  });

  return result;
}

module.exports = { getGameDetailsFromBggXmlResult };
