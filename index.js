const express = require("express"); // Import Express.js framework
const fs = require("fs").promises; // Import file system module with promises
const path = require("path"); // Import path module for handling file paths
const { generateShortId } = require("./genShortId"); // Import custom function to generate short IDs

// Initialize Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

// Define application constants
const PORT = 3000; // Server port number
const DB_PATH = path.join(__dirname, "urls.json"); // Path to the database file

// Function to initialize the database file
async function initializeDB() {
  try {
    await fs.access(DB_PATH); // Check if database file exists
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({})); // If not, create empty JSON file
  }
}

// Database helper functions
async function readDB() {
  const data = await fs.readFile(DB_PATH, "utf8"); // Read database file
  return JSON.parse(data); // Parse JSON data and return
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2)); // Write data to file with formatting
}

// Function to validate URL format
function isValidUrl(url) {
  try {
    new URL(url); // Attempt to create URL object
    return true; // Return true if successful
  } catch {
    return false; // Return false if URL is invalid
  }
}

// Route Handlers

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Send static HTML file
});

// Handle URL shortening requests
app.post("/shorten", async (req, res) => {
  try {
    const { url } = req.body; // Extract URL from request body

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    const db = await readDB(); // Read current database

    // Check if URL already exists in database
    let existingId = null;
    for (const id of Object.keys(db)) {
      if (db[id] === url) {
        existingId = id;
        break;
      }
    }

    // Return existing short URL if found
    if (existingId) {
      return res.json({ shortUrl: `http://localhost:${PORT}/${existingId}` });
    }

    // Generate new unique short ID
    let shortId = generateShortId();
    while (shortId in db) {
      // Ensure ID is unique
      shortId = generateShortId();
    }

    // Save new URL mapping
    db[shortId] = url;
    await writeDB(db);

    // Return new short URL
    const shortUrl = `http://localhost:${PORT}/${shortId}`;
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Handle URL redirection
app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params; // Get short ID from URL parameters
    const db = await readDB(); // Read database

    const originalUrl = db[shortId]; // Look up original URL
    if (!originalUrl) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.redirect(originalUrl); // Redirect to original URL
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Handle URL deletion
app.delete("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params; // Get short ID from URL parameters
    const db = await readDB(); // Read database

    // Check if URL exists
    if (!(shortId in db)) {
      return res.status(404).json({ error: "URL not found" });
    }

    delete db[shortId]; // Remove URL from database
    await writeDB(db); // Save updated database

    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Server initialization
async function startServer() {
  await initializeDB(); // Initialize database file
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Start the server
startServer();

