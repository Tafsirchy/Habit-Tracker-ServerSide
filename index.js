const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://HabitTracker:xnYQBDrTuiGna1l6@taftech.rxdwt12.mongodb.net/?appName=Taftech";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("HabitTracker");
    const habitCollection = database.collection("habits");

    // ---------------------------------------------------
    // POST: ADD NEW HABIT (with timestamp)
    // ---------------------------------------------------
    app.post("/habits", async (req, res) => {
      const habitData = req.body;

      // Add createdAt timestamp
      habitData.createdAt = new Date();

      const result = await habitCollection.insertOne(habitData);
      res.send(result);
    });

    // ---------------------------------------------------
    // GET: Fetch habits sorted by newest first
    // limit: 6 items only
    // ---------------------------------------------------
    app.get("/habits", async (req, res) => {
      const result = await habitCollection
        .find()
        .sort({ createdAt: -1 }) // NEWEST → OLDEST
        .limit(6) // only 6 latest habits
        .toArray();

      res.send(result);
    });

    console.log("Connected to MongoDB");
  } finally {
    // keeping connection open
  }
}

run().catch(console.dir);

// ROOT
app.get("/", (req, res) => {
  res.send("Hello World");
});

// START SERVER
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
