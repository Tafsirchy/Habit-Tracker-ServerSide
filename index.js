const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

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
    console.log("MongoDB Connected ✔");

    const database = client.db("HabitTracker");
    const habitCollection = database.collection("habits");

    // CREATE HABIT
    app.post("/habits", async (req, res) => {
      const habitData = req.body;

      habitData.createdAt = new Date();
      habitData.completionHistory = [];
      habitData.daysCompleted = 0;
      habitData.currentStreak = 0;

      const result = await habitCollection.insertOne(habitData);
      res.send(result);
    });

    // GET LATEST HABITS
    app.get("/habits", async (req, res) => {
      const habits = await habitCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(habits);
    });

    // GET HABIT BY ID
    app.get("/habits/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      res.json(habit);
    });

    app.get("/my-habits", async (req, res) => {
      const { email } = req.query;

      const query = { email: email };
      const result = await habitCollection.find(query).toArray();

      res.send(result);
    });

    app.put("/update/:id", async (req, res) => {
      const data = req.body;
      const id = req.params;
      const query = { _id: new ObjectId(id) };

      const updateHabits = {
        $set: data,
      };

      const result = await habitCollection.updateOne(query, updateHabits);
      res.send(result);

      
    });

    // browse habits
    // app.get("/habits", async (req, res) => {
    //   try {
    //     const habits = await habitCollection
    //       .find({})
    //       .sort({ createdAt: -1 })
    //       .toArray();

    //     const clean = habits.map((habit) => ({
    //       ...habit,
    //       _id: habit._id.toString(),
    //       createdAt:
    //         habit.createdAt instanceof Date
    //           ? habit.createdAt
    //           : new Date(
    //               Number(habit.createdAt?.$date?.$numberLong) || Date.now()
    //             ),
    //       currentStreak: Number(habit.currentStreak) || 0,
    //       daysCompleted: Number(habit.daysCompleted) || 0,
    //     }));

    //     res.json(clean);
    //   } catch (error) {
    //     console.error("PUBLIC HABIT ERROR:", error);
    //     res.status(500).json({ error: "Internal server error" });
    //   }
    // });

    // MARK COMPLETE
    app.patch("/habits/:id/complete", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id))
        return res.status(400).json({ error: "Invalid ID" });

      const habit = await habitCollection.findOne({ _id: new ObjectId(id) });
      if (!habit) return res.status(404).json({ error: "Habit not found" });

      const today = new Date().toISOString().split("T")[0];
      let history = habit.completionHistory || [];

      if (history.includes(today)) {
        return res.send({ message: "Already completed today", habit });
      }

      history.push(today);
      history.sort((a, b) => new Date(b) - new Date(a));

      // Calculate streak
      let streak = 1;
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1]);
        const curr = new Date(history[i]);
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);

        if (diff === 1) streak++;
        else break;
      }

      const updated = await habitCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            completionHistory: history,
            currentStreak: streak,
            daysCompleted: history.length,
          },
        },
        { returnDocument: "after" }
      );

      res.send(updated.value);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => res.send("Habit Tracker API running 🚀"));

app.listen(port, () => console.log(`Server running on port ${port}`));
