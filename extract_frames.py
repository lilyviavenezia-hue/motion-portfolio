from __future__ import annotations

import argparse
from pathlib import Path

import cv2


def inspect_and_extract(source: Path, output: Path, frame_count: int = 64) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open video: {source}")

    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps else 0

    print(f"frames={total_frames} fps={fps:.3f} size={width}x{height} duration={duration:.3f}s")

    output.mkdir(parents=True, exist_ok=True)
    sampled_indices = [round(index * (total_frames - 1) / frame_count) for index in range(frame_count)]
    for index, frame_number in enumerate(sampled_indices):
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        success, frame = capture.read()
        if not success:
            raise RuntimeError(f"Could not decode frame {frame_number}")
        cv2.imwrite(str(output / f"frame-{index:02d}.webp"), frame, [cv2.IMWRITE_WEBP_QUALITY, 98])

    center_frame_number = total_frames - 1
    capture.set(cv2.CAP_PROP_POS_FRAMES, center_frame_number)
    success, center_frame = capture.read()
    if not success:
        raise RuntimeError(f"Could not decode center frame {center_frame_number}")
    cv2.imwrite(str(output / "center.webp"), center_frame, [cv2.IMWRITE_WEBP_QUALITY, 98])

    print("trajectory_frame_numbers=" + ",".join(map(str, sampled_indices)))
    directions = ("UP", "UP-RIGHT", "RIGHT", "DOWN-RIGHT", "DOWN", "DOWN-LEFT", "LEFT", "UP-LEFT")
    direction_frames = [round(index * (total_frames - 2) / len(directions)) for index in range(len(directions))]
    print("compass_frame_numbers=" + ",".join(f"{direction}:{frame}" for direction, frame in zip(directions, direction_frames)))
    print(f"center_frame_number={center_frame_number}")

    background_bgr = center_frame[0, 0]
    background_rgb = tuple(int(channel) for channel in background_bgr[::-1])
    print(f"background_rgb=#{background_rgb[0]:02x}{background_rgb[1]:02x}{background_rgb[2]:02x}")
    capture.release()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect and pre-extract the portfolio character animation.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    inspect_and_extract(args.source, args.output)