import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, message } = await request.json();

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Send email notification
    const mailOptions = {
      from: `"Support Feedback" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL, // your email address to receive messages
      subject: "New Support Feedback",
      text: `Email: ${email || "N/A"}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending support feedback email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
