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

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    // create database
    const database = client.db("HabitTracker");
    const habitCollection = database.collection("habits");

    // post request
    app.post("/addHabit", async (req, res) => {
      const habitData = req.body;
      console.log(habitData);
      const result = await habitCollection.insertOne(habitData);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // will remove this later
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
