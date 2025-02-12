const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ID_LENGTH = 6;

function generateShortId() {
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    id += ALPHABET[randomIndex];
  }
  return id;
}

module.exports = { generateShortId };