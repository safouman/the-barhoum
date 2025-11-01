import { ImageResponse } from "next/og";

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

async function loadLogoAsDataUri(): Promise<string> {
    const logoUrl = new URL("../public/images/logo.png", import.meta.url);
    const response = await fetch(logoUrl);
    if (!response.ok) {
        throw new Error(`Failed to load logo asset: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return `data:image/png;base64,${base64}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
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
