const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@taftech.rxdwt12.mongodb.net/?appName=Taftech`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    console.log("MongoDB Connected ✔");

    const database = client.db("HabitTracker");
    const habitCollection = database.collection("habits");

    // create habit
    app.post("/habits", async (req, res) => {
      const habitData = req.body;

      // normalize data
      habitData.category = habitData.category?.trim().toLowerCase();

      habitData.createdAt = new Date();
      habitData.completionHistory = [];
      habitData.daysCompleted = 0;
      habitData.currentStreak = 0;

      const result = await habitCollection.insertOne(habitData);
      res.send(result);
    });

    // get latest habit for home
    app.get("/habits", async (req, res) => {
      try {
        const query = {};

        const habits = await habitCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();

        res.send(habits);
      } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
      }
    });

    // get habit for search and category
    app.get("/public-habits", async (req, res) => {
      const { category, search } = req.query;
      const query = {};

      if (category && category.trim() !== "") {
        query.category = { $regex: new RegExp(`^${category}$`, "i") };
      }

      if (search && search.trim() !== "") {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      try {
        const habits = await habitCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(habits);
      } catch (error) {
        res.status(500).send({ error: "Server error" });
      }
    });

    // get habit by id
    app.get("/habits/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      res.json(habit);
    });

    //get habits by email
    app.get("/my-habits", async (req, res) => {
      const { email } = req.query;

      const query = { email: email };
      const result = await habitCollection.find(query).toArray();

      res.send(result);
    });

    // update habit
    app.put("/habits/:id", async (req, res) => {
      const data = req.body;

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const updateHabits = { $set: data };
      const result = await habitCollection.updateOne(query, updateHabits);
      res.send(result);
    });

    // delete habit
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await habitCollection.deleteOne(query);
      res.send(result);
    });

    // mark complete
    app.patch("/habits/:id/complete", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      const today = new Date().toISOString().split("T")[0];

      let history = habit.completionHistory || [];

      if (history.includes(today)) {
        return res.json({ ...habit, alreadyCompleted: true });
      }

      // push todays history
      history.push(today);

      history.sort((a, b) => new Date(b) - new Date(a));

      // streak count
      let streak = 1;
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1]);
        const curr = new Date(history[i]);
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);

        if (diff === 1) streak++;
        else break;
      }

      const updatedHabit = {
        ...habit,
        completionHistory: history,
        currentStreak: streak,
        daysCompleted: history.length,
      };

      await habitCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedHabit }
      );

      res.json(updatedHabit);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment You are Successfully Connected to MongoDB!");

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => res.send("Habit Tracker Runnig 🚀"));

app.listen(port, () => console.log(`Server running on port ${port}`));
