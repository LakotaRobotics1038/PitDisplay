#!/usr/bin/env python3
"""Download Autodesk Viewer runtime assets for offline use.

Based on the file list approach used in wallabyway/svf2-offline.
"""

from __future__ import annotations

import argparse
import gzip
import pathlib
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

VIEWER_PREFIX = "https://developer.api.autodesk.com/modelderivative/v2/viewers/"
FONTS_PREFIX = "https://fonts.autodesk.com/"
DEFAULT_TARGET_DIR = pathlib.Path(__file__).resolve().parent.parent / "lib"

EMBEDDED_VIEWER_PATHS = [
    "viewer3D.min.js",
    "style.min.css",
    "res/locales/en/allstrings.json",
    "lmvworker.min.js",
    "extensions/MixpanelProvider/MixpanelProvider.min.js",
    "extensions/ViewCubeUi/ViewCubeUi.min.js",
    "extensions/PDF/PDF.min.js",
    "extensions/Measure/Measure.min.js",
    "extensions/BimWalk/BimWalk.min.js",
    "extensions/Section/Section.min.js",
    "extensions/LayerManager/LayerManager.min.js",
    "extensions/Hyperlink/Hyperlink.min.js",
    "extensions/Snapping/Snapping.min.js",
    "extensions/CompGeom/CompGeom.min.js",
    "extensions/DocumentBrowser/DocumentBrowser.min.js",
    "res/environments/boardwalk_irr.logluv.dds",
    "res/environments/boardwalk_mipdrop.logluv.dds",
    "res/locales/en/VCcrossRGBA8small.dds",
    "res/textures/VCedge1.png",
    "res/textures/VChome.png",
    "res/textures/VCarrows.png",
    "res/textures/VCcontext.png",
    "res/textures/VChomeS.png",
    "res/textures/VCarrowsS0.png",
    "res/textures/VCarrowsS1.png",
    "res/textures/VCcontextS.png",
    "res/textures/VCcompass-pointer-b.png",
    "res/textures/VCcompass-base.png",
    "extensions/BoxSelection/BoxSelection.min.js",
    "res/environments/SharpHighlights_irr.logluv.dds",
    "res/environments/SharpHighlights_mipdrop.logluv.dds",
    "res/ui/powered-by-autodesk-blk-rgb.png",
]

EMBEDDED_FONT_URLS = [
    "https://fonts.autodesk.com/ArtifaktElement/WOFF2/Artifakt%20Element%20Regular.woff2",
]


class DownloadError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download Autodesk Viewer assets for offline hosting from an embedded file list."
    )
    parser.add_argument(
        "--target",
        default=str(DEFAULT_TARGET_DIR),
        help="Output directory for downloaded files (default: autodesk-viewer/lib relative to this script)",
    )
    parser.add_argument(
        "--viewer-version",
        default="7.*",
        help="Viewer version string replacing 7.* entries, e.g. 7.113 or latest alias 7.*",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite files that already exist",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned downloads without writing files",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="Retry count per file (default: 3)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="HTTP timeout in seconds (default: 30)",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS certificate verification for downloads",
    )
    return parser.parse_args()


def get_ssl_context(insecure: bool) -> ssl.SSLContext | None:
    if insecure:
        return ssl._create_unverified_context()
    return None


def fetch_text(url: str, timeout: int, ssl_context: ssl.SSLContext | None) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "pitdisplay-offline-viewer-downloader/1.0"})
    with urllib.request.urlopen(request, timeout=timeout, context=ssl_context) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset)


def load_asset_urls(viewer_version: str) -> list[str]:
    urls: list[str] = [f"{VIEWER_PREFIX}{viewer_version}/{path}" for path in EMBEDDED_VIEWER_PATHS]
    urls.extend(EMBEDDED_FONT_URLS)

    unique_urls: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        unique_urls.append(url)

    if not unique_urls:
        raise DownloadError("No embedded asset URLs configured.")
    return unique_urls


def get_destination_path(target_dir: pathlib.Path, asset_url: str) -> pathlib.Path:
    if asset_url.startswith(VIEWER_PREFIX):
        parsed = urllib.parse.urlparse(asset_url)
        marker = "/modelderivative/v2/viewers/"
        marker_index = parsed.path.find(marker)
        if marker_index < 0:
            raise DownloadError(f"Unexpected viewer URL shape: {asset_url}")

        remainder = parsed.path[marker_index + len(marker):]
        slash_index = remainder.find("/")
        if slash_index < 0:
            raise DownloadError(f"Unexpected viewer URL path: {asset_url}")

        rel_path = remainder[slash_index + 1 :]
        return target_dir / rel_path

    if asset_url.startswith(FONTS_PREFIX):
        parsed = urllib.parse.urlparse(asset_url)
        rel_path = parsed.path.lstrip("/")
        return target_dir / "fonts.autodesk.com" / rel_path

    parsed = urllib.parse.urlparse(asset_url)
    rel_path = parsed.path.lstrip("/")
    return target_dir / parsed.netloc / rel_path


def download_file(
    url: str,
    destination: pathlib.Path,
    timeout: int,
    retries: int,
    ssl_context: ssl.SSLContext | None,
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "pitdisplay-offline-viewer-downloader/1.0"})

    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout, context=ssl_context) as response:
                data = response.read()

                content_encoding = (response.headers.get("Content-Encoding") or "").lower()
                is_gzip_payload = data[:2] == b"\x1f\x8b"
                if content_encoding == "gzip" or is_gzip_payload:
                    data = gzip.decompress(data)

            destination.write_bytes(data)
            return
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * attempt)

    raise DownloadError(f"Failed to download {url}: {last_error}")


def main() -> int:
    args = parse_args()
    target_dir = pathlib.Path(args.target).resolve()
    ssl_context = get_ssl_context(args.insecure)

    try:
        urls = load_asset_urls(args.viewer_version)
    except Exception as exc:
        print(f"Error loading embedded asset list: {exc}", file=sys.stderr)
        return 1

    print(f"Asset list loaded: {len(urls)} URLs")
    print(f"Target directory: {target_dir}")

    downloaded = 0
    skipped = 0
    failed = 0

    for url in urls:
        destination = get_destination_path(target_dir, url)

        if destination.exists() and not args.overwrite:
            skipped += 1
            print(f"[skip] {destination}")
            continue

        if args.dry_run:
            print(f"[plan] {url} -> {destination}")
            continue

        try:
            download_file(url, destination, args.timeout, args.retries, ssl_context)
            downloaded += 1
            print(f"[ok] {url} -> {destination}")
        except Exception as exc:
            failed += 1
            print(f"[err] {url}: {exc}", file=sys.stderr)

    if args.dry_run:
        print("Dry run complete.")
        return 0

    print(f"Done. Downloaded: {downloaded}, Skipped: {skipped}, Failed: {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
