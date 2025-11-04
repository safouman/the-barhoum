#!/usr/bin/env node
/**
 * Transcode a source MP4/MOV into multi-bitrate HLS plus poster frame.
 *
 * Usage:
 *   npm run transcode:video -- --input ./public/video/promo-source.mp4 --name promo
 *
 * Requirements:
 *   - ffmpeg must be available in PATH.
 *   - Input file should be an MP4 or MOV with audio track.
 */

import { spawn } from "node:child_process";
import { access, constants, mkdir, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const DEFAULT_NAME = "promo";
const DEFAULT_INPUT_CANDIDATES = [
    "./public/video/promo-source.mp4",
    "./public/video/promo.mp4",
    "./public/video/promo-source.mov",
    "./public/video/promo.mov",
];
const OUTPUT_DIR = "./public/video";

const args = process.argv.slice(2);

const resolveDefaultInput = async () => {
    for (const candidate of DEFAULT_INPUT_CANDIDATES) {
        try {
            await access(candidate, constants.F_OK);
            return candidate;
        } catch {
            // Try next candidate
        }
    }
    return null;
};

const parseArgs = async () => {
    const options = {
        input: null,
        name: DEFAULT_NAME,
        overwrite: false,
        keepExisting: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];
        switch (arg) {
            case "--input":
            case "-i":
                if (!next) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.input = next;
                i++;
                break;
            case "--name":
            case "-n":
                if (!next) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.name = next;
                i++;
                break;
            case "--overwrite":
                options.overwrite = true;
                break;
            case "--keep-existing":
                options.keepExisting = true;
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!options.input) {
        const fallbackInput = await resolveDefaultInput();
        if (!fallbackInput) {
            throw new Error(
                "Unable to locate a default input. Provide --input pointing to your source MP4/MOV."
            );
        }
        options.input = fallbackInput;
    }

    const allowedExtensions = new Set([".mp4", ".mov"]);
    if (!allowedExtensions.has(extname(options.input).toLowerCase())) {
        throw new Error("Input file must be an .mp4 or .mov");
    }

    return options;
};

const ensureFileExists = async (filePath) => {
    try {
        await access(filePath, constants.F_OK);
    } catch {
        throw new Error(`File not found: ${filePath}`);
    }
};

const fileExists = async (filePath) => {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
};

const runCommand = async (command, args) =>
    new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, { stdio: "inherit" });
        child.on("error", rejectPromise);
        child.on("exit", (code) => {
            if (code === 0) {
                resolvePromise();
            } else {
                rejectPromise(new Error(`${command} exited with code ${code}`));
            }
        });
    });

const main = async () => {
    const { input, name, overwrite, keepExisting } = await parseArgs();

    await ensureFileExists(input);

    const absoluteInput = resolve(input);
    const outputBaseDir = resolve(OUTPUT_DIR);
    const hlsDir = join(outputBaseDir, `${name}-hls`);
    const posterPath = join(outputBaseDir, `${name}-poster.jpg`);
    const fallbackPath = join(outputBaseDir, `${name}.mp4`);
    const masterManifest = join(hlsDir, `${name}.m3u8`);

    if (!keepExisting) {
        if (overwrite) {
            await rm(hlsDir, { recursive: true, force: true });
        }
    }

    await mkdir(hlsDir, { recursive: true });
    await ensureFallbackVideo({
        absoluteInput,
        fallbackPath,
        keepExisting,
        overwrite,
    });

    const ffmpegBaseArgs = [
        "-y",
        "-i",
        absoluteInput,
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3]; [v1]scale=w=1920:h=1080[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=854:h=480[v3out]",
        "-map",
        "[v1out]",
        "-c:v:0",
        "libx264",
        "-profile:v:0",
        "high",
        "-level:v:0",
        "4.0",
        "-preset:v:0",
        "slow",
        "-b:v:0",
        "5000k",
        "-maxrate:v:0",
        "5350k",
        "-bufsize:v:0",
        "7500k",
        "-map",
        "a:0",
        "-c:a:0",
        "aac",
        "-b:a:0",
        "128k",
        "-map",
        "[v2out]",
        "-c:v:1",
        "libx264",
        "-profile:v:1",
        "main",
        "-level:v:1",
        "3.1",
        "-preset:v:1",
        "slow",
        "-b:v:1",
        "3000k",
        "-maxrate:v:1",
        "3210k",
        "-bufsize:v:1",
        "4500k",
        "-map",
        "a:0",
        "-c:a:1",
        "aac",
        "-b:a:1",
        "128k",
        "-map",
        "[v3out]",
        "-c:v:2",
        "libx264",
        "-profile:v:2",
        "main",
        "-level:v:2",
        "3.1",
        "-preset:v:2",
        "slow",
        "-b:v:2",
        "1600k",
        "-maxrate:v:2",
        "1710k",
        "-bufsize:v:2",
        "2400k",
        "-map",
        "a:0",
        "-c:a:2",
        "aac",
        "-b:a:2",
        "96k",
        "-f",
        "hls",
        "-hls_time",
        "4",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        join(hlsDir, `${name}_%v_%03d.ts`),
        "-master_pl_name",
        `${name}.m3u8`,
        "-var_stream_map",
        "v:0,a:0 v:1,a:1 v:2,a:2",
        join(hlsDir, `${name}_%v.m3u8`),
    ];

    if (keepExisting) {
        // When keeping existing output, disable overwrite for segments/manifests.
        ffmpegBaseArgs.splice(0, 1); // remove -y
    }

    console.log(`Generating HLS renditions for ${absoluteInput}`);
    await runCommand("ffmpeg", ffmpegBaseArgs);

    if (!keepExisting || overwrite) {
        console.log("Generating poster frame");
        await runCommand("ffmpeg", [
            "-y",
            "-i",
            absoluteInput,
            "-ss",
            "00:00:01.000",
            "-vframes",
            "1",
            posterPath,
        ]);
    } else {
        try {
            await access(posterPath, constants.F_OK);
        } catch {
            console.log("Poster missing; generating poster frame");
            await runCommand("ffmpeg", [
                "-y",
                "-i",
                absoluteInput,
                "-ss",
                "00:00:01.000",
                "-vframes",
                "1",
                posterPath,
            ]);
        }
    }

    console.log(`HLS output: ${masterManifest}`);
    console.log(`Fallback MP4: ${fallbackPath}`);
    console.log(`Poster: ${posterPath}`);
};

async function ensureFallbackVideo({
    absoluteInput,
    fallbackPath,
    keepExisting,
    overwrite,
}) {
    if (absoluteInput === fallbackPath) {
        return;
    }

    if ((keepExisting || !overwrite) && (await fileExists(fallbackPath))) {
        return;
    }

    console.log(`Transcoding lightweight fallback MP4 to ${fallbackPath}`);
    await runCommand("ffmpeg", [
        "-y",
        "-i",
        absoluteInput,
        "-vf",
        "scale='min(1280,iw)':-2",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        fallbackPath,
    ]);
}

main().catch((error) => {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }
    process.exitCode = 1;
});
