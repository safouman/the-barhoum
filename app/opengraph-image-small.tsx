import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
    width: 600,
    height: 315,
};

export const contentType = "image/jpeg";

async function loadLogoAsDataUri(): Promise<string> {
    const filePath = path.join(process.cwd(), "public", "images", "logo-w.png");
    const file = await readFile(filePath);
    return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function OpengraphImageSmall() {
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
                        "radial-gradient(circle at 50% 30%, rgba(32, 196, 188, 0.2), transparent 55%)",
                }}
            >
                <div
                    style={{
                        width: 360,
                        height: 210,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 32,
                        padding: "32px 40px",
                        backgroundColor: "rgba(3, 27, 29, 0.65)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
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
                        width={280}
                        height={180}
                    />
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
