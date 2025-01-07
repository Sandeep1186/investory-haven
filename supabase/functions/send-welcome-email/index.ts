import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SMTP_USERNAME || !SMTP_PASSWORD) {
      console.error("SMTP credentials are not set");
      throw new Error("Email service configuration error");
    }

    const { to, fullName } = await req.json() as EmailRequest;
    console.log("Sending welcome email to:", to, "for user:", fullName);

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        },
      },
    });

    const emailContent = `
      <h1>Welcome to InvestWise, ${fullName}!</h1>
      <p>Thank you for registering with InvestWise. We're excited to help you start your investment journey!</p>
      <p>You can now:</p>
      <ul>
        <li>Add funds to your account</li>
        <li>Explore various investment options</li>
        <li>Track your portfolio performance</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;

    await client.send({
      from: SMTP_USERNAME,
      to: to,
      subject: "Welcome to InvestWise!",
      content: "text/html",
      html: emailContent,
    });

    console.log("Email sent successfully to:", to);

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send welcome email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);