import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();
const app = express();

// Set up file upload storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage
});

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/contact', async (req, res) => {
  const {
    firstName,
    email,
    number,
    message
  } = req.body;

  if (!firstName || !email || !number || !message) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  try {
    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'vasanthkbit@gmail.com',
      subject: `Contact Form Submission from ${firstName}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>number:</strong> ${number}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Thank You for Contacting Us, ${firstName}`,
      html: `
        <h3>Thank you for reaching out!</h3>
        <p>Hello ${firstName},</p>
        <p>We have received your message: <strong>${message}</strong>. We will get back to you soon!</p>
        <p>Best regards,<br/>Your Team</p>
      `,
    });

    res.status(200).json({
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email'
    });
  }
});


// Paper submission endpoint
app.post('/api/submit-paper', upload.single('file'), async (req, res) => {
  const {
    title,
    email,
    fullName,
    institution,
    category,
    abstract
  } = req.body; // Updated field names
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      error: 'No file uploaded'
    });
  }

  try {
    // Create email with file attachment for admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'vasanthkbit@gmail.com',
      subject: `Paper Submission: ${title}`,
      html: `
        <h3>New Paper Submission</h3>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Institution:</strong> ${institution}</p>
        <p><strong>Author Category:</strong> ${category}</p> <!-- Updated field name -->
        <p><strong>Abstract:</strong> ${abstract}</p> <!-- Updated field name -->
      `,
      attachments: [{
        filename: file.originalname,
        content: file.buffer,
        contentType: 'application/pdf',
      }, ],
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Thank You for Your Paper Submission: ${title}`,
      html: `
        <h3>Thank you for submitting your paper!</h3>
        <p>Dear ${fullName},</p>
        <p>We have successfully received your paper titled "<strong>${title}</strong>".</p>
        <p>Your submission will now go through the peer review process, and we will notify you about the status soon.</p>
        <p>Best regards,<br/>Conference Team</p>
      `,
    });

    res.status(200).json({
      message: 'Paper submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting paper:', error);
    res.status(500).json({
      error: 'Failed to submit paper'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});