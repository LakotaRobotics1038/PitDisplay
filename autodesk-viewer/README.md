
# Autodesk Viewer (Offline)

A standalone offline Autodesk Viewer page is available at [./index.html](./index.html).

---

## 1. Download Viewer Runtime Files (for Offline Viewing)

The viewer runtime should exist in this folder:

- `./lib/style.min.css`
- `./lib/viewer3D.min.js`

Use the Python helper script to download all required Viewer files:

```bash
python3 ./scripts/download_autodesk_viewer_assets.py --target ./lib --insecure
```

Notes:

- Output path defaults to `./lib`
- Use `--dry-run` to preview file mappings without downloading
- Use `--viewer-version 7.113` (or similar) to pin a concrete Viewer version

---

## 2. Prepare Your Model for Offline Viewing

### Step 1: Upload Your STEP File to Autodesk Forge

You need an Autodesk account and API credentials (see below). Upload your STEP file to your Forge bucket:

```bash
cd ./autodesk-viewer/scripts
npm install
APS_CLIENT_ID=your_client_id APS_CLIENT_SECRET=your_client_secret \
node ./step-upload-to-forge.js <PATH_TO_STEP_FILE>
```

This will upload your file to a bucket named `pitdisplay` (edit the script if you need a different bucket).

### Step 2: Translate the Uploaded File to SVF1

Submit a Model Derivative job to translate your uploaded file to SVF1 format:

```bash
APS_CLIENT_ID=your_client_id APS_CLIENT_SECRET=your_client_secret \
node ./translate_urn_to_svf1.js --urn "<your_urn_or_object_urn>"
```

Useful flags:

- `--urn-is-base64` if your URN is already base64-url encoded
- `--force` to force regeneration of SVF derivatives
- `--json` for machine-readable output
- `--views 2d,3d` to control translated view types

### Step 3: Download SVF1 Resources for Offline Use

After translation, download SVF1 resources locally:

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

---

## 3. Open the Viewer

Do not open `index.html` directly from `file://` because browsers block Viewer XHR requests for local files.

Run a local server from `autodesk-viewer/`:

```bash
python3 -m http.server 8080
```

Then open:

- <http://localhost:8080/>

---

## 4. How to Get Autodesk API Credentials

You need a free Autodesk account and API credentials (Client ID and Secret) to use the upload, translate, and download scripts.

1. Go to [https://developer.autodesk.com/](https://developer.autodesk.com/) and sign up or log in.
2. Click "Create App" in the dashboard.
3. Select the "Data Management" and "Model Derivative" APIs.
4. Copy your Client ID and Client Secret. Use these as `APS_CLIENT_ID` and `APS_CLIENT_SECRET` environment variables.

You can use these credentials for all the scripts above.

---

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
