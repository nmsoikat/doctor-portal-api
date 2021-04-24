require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const fileUpload = require("express-fileupload");
// const admin = require("firebase-admin");
const fs = require("fs-extra");

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static("doctors"));

// var serviceAccount = require("./config/doctors-portal01-firebase-adminsdk-a6qc8-68a1d912b9.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pi4eb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  // console.log("Connect Error: ", err);
  if (err) {
    console.log("Connection time error: ", err);
  } else {
    console.log("DB Connected");
  }
  const clientDB = client.db(process.env.DB_NAME);

  const appointmentCollection = clientDB.collection("appointments");
  const doctorCollection = clientDB.collection("doctors");

  // Add Appointment
  app.post("/addAppointment", (req, res) => {
    const data = req.body;
    // console.log(data);
    appointmentCollection
      .insertOne(data)
      .then((result) => {
        // console.log(result);
        res.send(result.insertedCount > 0);
      })
      .catch((err) => {
        console.log(err.message);
      });
  });

  // Find Appoint By Date
  app.post("/appointmentByDate", (req, res) => {
    const { date, email } = req.body;
    // console.log(date);
    const filter = { date: date };

    console.log(email);
    doctorCollection.find({ email: email }).toArray((dErr, doctors) => {
      // not found any doctor using logged user email
      if (doctors.length === 0) {
        // add filter criteria // show appointments that only created using this user email
        filter.email = email;
        // console.log(filter);
      }
      // console.log(doctors);
      // console.log(filter);
      // if found any doctor then search work only by date // so, show all appointments
      appointmentCollection.find(filter).toArray((err, document) => {
        res.send(document);
      });
    });
  });

  // Add Doctor
  app.post("/addDoctor", (req, res) => {
    // console.log(req.body);
    // console.log(req.files);
    const file = req.files.profileImg;
    // const filePath = `${__dirname}/doctors/${file.name}`;
    // file.mv(filePath, (err) => {
    //   if (err) {
    //     return res.status(500).send({ message: "File upload failed" });
    //   }
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    const image = {
      contentType: file.mimetype,
      size: file.size,
      imgBi: Buffer.from(encImg, "base64"),
    };

    const data = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      // profileImg: file.name,
      profileImg: image,
    };

    // console.log(data);

    doctorCollection
      .insertOne(data)
      .then((result) => {
        // fs.remove(filePath, (error) => {
        //   if (error) {
        //     console.log(error);
        //     res.status(500).send({ msg: "Image remove failed" });
        //   }
        // });
        res.send(result.insertedCount > 0);
      })
      .catch((err) => console.log(err));
    // });
  });

  // if login user is doctor send true
  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, doctors) => {
      console.log(doctors);
      res.send(doctors);
    });
  });

  // if login user is doctor send true
  app.post("/isDoctor", (req, res) => {
    const { email } = req.body;
    console.log(email);
    doctorCollection.find({ email }).toArray((err, doctors) => {
      // console.log(doctors);
      res.send(doctors.length > 0);
    });
  });

  // -------- end db -----
});

app.get("/", (req, res) => {
  res.send("Doctors Portal App");
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Doctors Portal App Listening At http://localhost:${port}`);
});
