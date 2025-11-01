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
    const filePath = path.join(process.cwd(), "public", "images", "logo-2.png");
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
                    backgroundColor: "#021516",
                    backgroundImage:
                        "radial-gradient(circle at 50% 20%, rgba(32, 196, 188, 0.18), transparent 60%)",
                }}
            >
                <div
                    style={{
                        width: 420,
                        height: 560,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 48,
                        padding: "48px 56px",
                    }}
                >
                    <img
                        src={logoSrc}
                        alt="Ibrahim Ben Abdallah logo"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                        width={320}
                        height={464}
                    />
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
