import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import React from "react";

export const runtime = "nodejs";

const WIDTH = 600;
const HEIGHT = 315;

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
                    "radial-gradient(circle at 50% 30%, rgba(32, 196, 188, 0.2), transparent 55%)",
            },
        },
        React.createElement(
            "div",
            {
                style: {
                    width: 360,
                    height: 210,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                width: 280,
                height: 180,
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
