# Autodesk Viewer (Offline)

A standalone offline Autodesk Viewer page is available at [./index.html](./index.html).

## Required runtime files

The viewer runtime should exist in this folder:

- `./lib/style.min.css`
- `./lib/viewer3D.min.js`

## Open the viewer

Do not open `index.html` directly from `file://` because browsers block Viewer XHR requests for local files.

Run a local server from `autodesk-viewer/`:

```bash
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/`

## Download viewer runtime files

Use the Python helper script (based on `wallabyway/svf2-offline` list) to download all required Viewer files:

```bash
python3 ./scripts/download_autodesk_viewer_assets.py --target ./lib --insecure
```

Notes:

- Output path defaults to `./lib`
- Use `--dry-run` to preview file mappings without downloading
- Use `--viewer-version 7.113` (or similar) to pin a concrete Viewer version

## Translate URN to SVF1

Use the JavaScript SDK translator script to submit a Model Derivative job with output format `svf` (SVF1) and wait for completion:

```bash
cd ./autodesk-viewer/scripts
npm install
```

```bash
APS_CLIENT_ID=your_client_id APS_CLIENT_SECRET=your_client_secret \
node ./translate_urn_to_svf1.js --urn "<your_urn_or_object_urn>"
```

Useful flags:

- `--urn-is-base64` if your URN is already base64-url encoded
- `--force` to force regeneration of SVF derivatives
- `--json` for machine-readable output
- `--views 2d,3d` to control translated view types

## Download SVF from URN (Offline)

After translation, download SVF1 resources locally for offline use:

```bash
cd ./autodesk-viewer/scripts
npm install
```

```bash
APS_CLIENT_ID=your_client_id APS_CLIENT_SECRET=your_client_secret \
node ./download_svf_from_urn.js --urn "<your_urn_or_object_urn>" --output-dir "../models/offline-svf"
```

Useful flags:

- `--urn-is-base64` if your URN is already base64-url encoded
- `--svf-index 0` to download only one SVF root from the manifest
- `--all-svf-roots` to download all SVF roots (default)
- `--no-manifest` to skip writing `manifest.json`
- `--json` for machine-readable summary output
