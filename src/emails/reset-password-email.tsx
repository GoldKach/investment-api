// // emails/ResetPasswordEmail.tsx
// import * as React from "react";
// import { Html, Body, Container, Text, Button, Hr, Section } from "@react-email/components";

// export default function ResetPasswordEmail({
//   name = "there",
//   resetUrl,
// }: { name?: string; resetUrl: string }) {
//   return (
//     <Html>
//       <Body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
//         <Container style={{ maxWidth: 560, margin: "24px auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
//           <Text style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Reset your password</Text>
//           <Text style={{ color: "#555" }}>
//             Hi {name}, click the button below to set a new password. This link expires in 30 minutes.
//           </Text>
//           <Section style={{ margin: "20px 0" }}>
//             <Button href={resetUrl} style={{ background: "#111", color: "#fff", padding: "12px 16px", borderRadius: 8 }}>
//               Reset password
//             </Button>
//           </Section>
//           <Text style={{ color: "#777", fontSize: 12 }}>
//             If you didn’t request this, you can ignore this email.
//           </Text>
//           <Hr />
//           <Text style={{ color: "#aaa", fontSize: 12 }}>© {new Date().getFullYear()} Your App</Text>
//         </Container>
//       </Body>
//     </Html>
//   );
// }


// emails/ResetPasswordEmail.tsx
import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

type Props = {
  name?: string;
  resetUrl: string; // must be absolute: https://yourapp.com/reset-password?token=...&uid=...
};

export default function ResetPasswordEmail({ name = "there", resetUrl }: Props) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>Reset your Goldkach password (link expires in 30 minutes)</Preview>
      <Body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f8f9fb",
          color: "#111",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "24px auto",
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reset your password</Text>
          <Text style={{ color: "#555", marginTop: 8 }}>
            Hi {name}, click the button below to set a new password. This link expires in 30 minutes.
          </Text>

          <Section style={{ margin: "20px 0" }}>
            <Button
              href={resetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#111",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Reset password
            </Button>
          </Section>

          {/* Fallback link if buttons/images are blocked */}
          <Text style={{ color: "#777", fontSize: 12 }}>
            If the button doesn’t work, copy and paste this link into your browser:
            <br />
            <a
              href={resetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0a66c2", wordBreak: "break-all" }}
            >
              {resetUrl}
            </a>
          </Text>

          <Hr style={{ borderColor: "#eee", margin: "16px 0" }} />

          <Text style={{ color: "#888", fontSize: 12, marginTop: 0 }}>
            If you didn’t request this, you can safely ignore this email.
          </Text>

          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
            © {year} Goldkach
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
