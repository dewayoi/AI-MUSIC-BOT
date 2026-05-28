const thumbnailPrompts =
  require("./thumbnailPrompts");

function buildThumbnailPrompt({
  genre,
  mood,
  title
}) {

  const genrePrompt =
    thumbnailPrompts[genre] || "";

  return `

Thumbnail Title:
${title}

Visual Style:
${genrePrompt}

Mood:
${mood}

High quality cinematic composition,
high detail,
professional YouTube thumbnail,
beautiful lighting,
high emotional impact

`;

}

module.exports = {
  buildThumbnailPrompt
};