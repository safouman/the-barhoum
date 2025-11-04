import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import React from "react";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

async function loadLogoAsDataUri(): Promise<string> {
    const filePath = path.join(process.cwd(), "public", "images", "logo-w.png");
    const file = await readFile(filePath);
    return `data:image/png;base64,${file.toString("base64")}`;
}

export async function GET() {
    const logoSrc = await loadLogoAsDataUri();

    const element = React.createElement(
        "div",
        {
            style: {
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#021516",
                backgroundImage:
                    "radial-gradient(circle at 50% 20%, rgba(32, 196, 188, 0.18), transparent 60%)",
            },
        },
        React.createElement(
            "div",
            {
                style: {
                    width: 420,
                    height: 560,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 48,
                    padding: "48px 56px",
                },
            },
            React.createElement("img", {
                src: logoSrc,
                alt: "Ibrahim Ben Abdallah logo",
                style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                },
                width: 320,
                height: 464,
            })
        )
    );

    return new ImageResponse(element, {
        width: WIDTH,
        height: HEIGHT,
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}
