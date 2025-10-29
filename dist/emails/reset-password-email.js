import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Preview, Body, Container, Section, Text, Button, Hr, Link, Img, } from "@react-email/components";
export default function ResetPasswordEmail({ name = "there", resetUrl }) {
    const year = new Date().getFullYear();
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "Reset your Goldkach password (link expires in 30 minutes)" }), _jsx(Body, { style: {
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif',
                    backgroundColor: "#f8f9fb",
                    color: "#111",
                }, children: _jsxs(Container, { style: {
                        maxWidth: 560,
                        margin: "24px auto",
                        background: "#fff",
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 24,
                    }, children: [_jsx(Section, { style: { textAlign: "center", marginBottom: 16 }, children: _jsx(Link, { href: "goldkach.co.ug", target: "_blank", rel: "noopener noreferrer", children: _jsx(Img, { src: "https://ylhpxhcgr4.ufs.sh/f/ZVlDsNdibGfFjOMmT0owa03UxsE9D4Q16iJb7PSqYeAZTyFV?expires=1760582229143&signature=hmac-sha256%3D2fcbc9a2f7b1993ffc36cb97f27843431e61fd20198a8b3ccfc3b03576970ecf" // ensure this path is correct and accessible
                                    , alt: "Goldkach", width: 120, height: 120, style: { display: "block", margin: "0 auto" } }) }) }), _jsx(Text, { style: { fontSize: 20, fontWeight: 700, margin: 0 }, children: "Reset your password" }), _jsxs(Text, { style: { color: "#555", marginTop: 8 }, children: ["Hi ", name, ", click the button below to set a new password. This link expires in 30 minutes."] }), _jsx(Section, { style: { margin: "20px 0" }, children: _jsx(Button, { href: resetUrl, target: "_blank", rel: "noopener noreferrer", style: {
                                    display: "inline-block",
                                    background: "#111",
                                    color: "#fff",
                                    padding: "12px 16px",
                                    borderRadius: 8,
                                    textDecoration: "none",
                                    fontWeight: 600,
                                }, children: "Reset password" }) }), _jsxs(Text, { style: { color: "#777", fontSize: 12 }, children: ["If the button doesn\u2019t work, copy and paste this link into your browser:", _jsx("br", {}), _jsx("a", { href: resetUrl, target: "_blank", rel: "noopener noreferrer", style: { color: "#0a66c2", wordBreak: "break-all" }, children: resetUrl })] }), _jsx(Hr, { style: { borderColor: "#eee", margin: "16px 0" } }), _jsx(Text, { style: { color: "#888", fontSize: 12, marginTop: 0 }, children: "If you didn\u2019t request this, you can safely ignore this email." }), _jsxs(Text, { style: { color: "#aaa", fontSize: 12, marginTop: 8 }, children: ["\u00A9 ", year, " Goldkach"] })] }) })] }));
}
