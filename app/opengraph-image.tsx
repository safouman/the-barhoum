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
                    backgroundColor: "#031112",
                    backgroundImage:
                        "radial-gradient(circle at 50% 15%, rgba(32, 196, 188, 0.24), transparent 55%), radial-gradient(circle at 50% 85%, rgba(32, 196, 188, 0.14), transparent 70%)",
                }}
            >
                <div
                    style={{
                        width: 430,
                        height: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundImage: `url(${logoSrc})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        filter: "drop-shadow(0 30px 90px rgba(0, 0, 0, 0.35))",
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
