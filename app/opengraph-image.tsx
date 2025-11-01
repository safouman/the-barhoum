import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

async function loadLogoAsDataUri(): Promise<string> {
    const filePath = path.join(process.cwd(), "public", "images", "logo.png");
    const file = await readFile(filePath);
    return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function OpengraphImage() {
    const logoSrc = await loadLogoAsDataUri();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#081b1f",
                    backgroundImage:
                        "radial-gradient(circle at top, #1ecdc2 0%, transparent 55%)",
                }}
            >
                <div
                    style={{
                        width: "70%",
                        height: "70%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "48px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 32px 80px rgba(8, 27, 31, 0.32)",
                        padding: "48px",
                    }}
                >
                    <img
                        src={logoSrc}
                        alt="Ibrahim Ben Abdallah logo"
                        width={320}
                        height={572}
                        style={{
                            width: "auto",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
