const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// import modules
const usersApi = require("./apis/usersApi/usersApi");
const bookingApi = require("./apis/bookingApi/bookingApi");

const corsConfig = {
  origin: ["http://localhost:5173", "*"],
  credentials: true,
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
};

// =====middlewares======
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
app.use(express.json());

const uri = process.env.DB_URI;
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // collection start
    const usersCollection = client
      .db("heitz-immigration-law")
      .collection("users");
    const bookingCollection = client
      .db("heitz-immigration-law")
      .collection("bookings");
    // collection end

    // Apis start
    app.use("/users", usersApi(usersCollection));
    app.use("/booking", bookingApi(bookingCollection));
    // Apis end

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Connected ✅");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// =====basic set up=======
app.get("/", (req, res) => {
  res.send("Heitz Immigration Law server is running");
});

app.listen(port, () => {
  console.log("Heitz Immigration Law server is running on port:🔥", port);
});
