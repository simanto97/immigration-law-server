const express = require("express");
const { ObjectId } = require("mongodb");
const nodeMailer = require("nodemailer");

const bookingApi = (bookingCollection) => {
  const bookingRouter = express.Router();

  // add booking slot
  bookingRouter.post("/", async (req, res) => {
    const bookingInfo = req.body;
    bookingInfo.createdAt = new Date();
    bookingInfo.status = "pending";
    const result = await bookingCollection.insertOne(bookingInfo);
    res.send(result);
  });

  // get all bookings
  bookingRouter.get("/", async (req, res) => {
    const result = await bookingCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.send(result);
  });

  // update booking and send email
  bookingRouter.patch("/:id", async (req, res) => {
    const id = req.params.id;
    const { message } = req.body;

    const foundResult = await bookingCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!foundResult) {
      return res.status(404).send({ message: "Required content not found" });
    }

    let mailTransporter = nodeMailer.createTransport({
      service: "gmail",
      host: process.env.Nodemailer_Host,
      port: process.env.Nodemailer_Port,
      secure: true,
      auth: {
        user: process.env.Nodemailer_User,
        pass: process.env.Nodemailer_Pass,
      },
    });

    const mailOptions = {
      from: process.env.Nodemailer_User,
      to: foundResult.email,
      subject: "Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://heitzimmigrationlaw.com/wp-content/uploads/2020/07/color-2.png" alt="Booking Confirmation" style="width: 100%; border-radius: 8px 8px 0 0;">

          <div style="padding: 20px;">
            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333;">Booking Confirmation</h2>
            <p style="margin-bottom: 15px;">Dear ${foundResult.name},</p>
            <p style="margin-bottom: 15px;">Your booking has been confirmed. Here are the details:</p>
            <ul style="margin-bottom: 15px; list-style-type: none; padding-left: 0;">
              <li><strong>Name:</strong> ${foundResult.name}</li>
              <li><strong>Email:</strong> ${foundResult.email}</li>
              <li><strong>Phone Number:</strong> ${foundResult.number}</li>
              <li><strong>Option:</strong> ${foundResult.option}</li>
              <li><strong>Selected Date:</strong> ${foundResult.selectedDate}</li>
              <li><strong>Selected Time:</strong> ${foundResult.selectedSlot}</li>
            </ul>
            <p style="margin-bottom: 15px;">Message from consultant: ${message}</p>
            <p style="margin-bottom: 0;">Thank you for choosing our service.</p>
          </div>
        </div>
      `,
    };

    try {
      await mailTransporter.sendMail(mailOptions);

      // Update booking status to accepted
      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "accepted" } }
      );

      res.send(result);
    } catch (error) {
      res.status(500).send({ message: "Failed to send email.", error });
    }
  });

  return bookingRouter;
};

module.exports = bookingApi;
