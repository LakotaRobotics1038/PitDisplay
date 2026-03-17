#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const AdmZip = require('adm-zip');
const ForgeSDK = require('forge-apis');

const APS_BASE_URL = 'https://developer.api.autodesk.com';

class ApsError extends Error {}

function parseArgs(argv) {
  const options = {
    urn: '',
    clientId: process.env.APS_CLIENT_ID || process.env.FORGE_CLIENT_ID || '',
    clientSecret: process.env.APS_CLIENT_SECRET || process.env.FORGE_CLIENT_SECRET || '',
    urnIsBase64: false,
    outputDir: '../models/offline-svf',
    svfIndex: -1,
    allSvfRoots: true,
    includeManifest: true,
    json: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--urn') {
      options.urn = argv[++index] || '';
    } else if (arg === '--client-id') {
      options.clientId = argv[++index] || '';
    } else if (arg === '--client-secret') {
      options.clientSecret = argv[++index] || '';
    } else if (arg === '--urn-is-base64') {
      options.urnIsBase64 = true;
    } else if (arg === '--output-dir') {
      options.outputDir = argv[++index] || options.outputDir;
    } else if (arg === '--svf-index') {
      options.svfIndex = Number(argv[++index] || '-1');
      options.allSvfRoots = false;
    } else if (arg === '--all-svf-roots') {
      options.allSvfRoots = true;
      options.svfIndex = -1;
    } else if (arg === '--no-manifest') {
      options.includeManifest = false;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new ApsError(`Unknown argument: ${arg}`);
    }
  }

  if (!options.urn) {
    throw new ApsError('Missing required --urn argument.');
  }

  if (!options.clientId || !options.clientSecret) {
    throw new ApsError('Missing credentials. Provide --client-id/--client-secret or APS_CLIENT_ID/APS_CLIENT_SECRET.');
  }

  if (!options.allSvfRoots && (!Number.isInteger(options.svfIndex) || options.svfIndex < 0)) {
    throw new ApsError('--svf-index must be a non-negative integer.');
  }

  return options;
}

function printHelp() {
  console.log(
    `Download SVF1 derivatives from a URN for offline use.\n\n` +
    `Usage:\n` +
    `  APS_CLIENT_ID=... APS_CLIENT_SECRET=... node ./download_svf_from_urn.js --urn <urn> [options]\n\n` +
    `Options:\n` +
    `  --urn <value>            Source design URN (raw object URN or base64 URN)\n` +
    `  --urn-is-base64          Treat input URN as already base64-url encoded\n` +
    `  --output-dir <path>      Output directory (default: ../models/offline-svf)\n` +
    `  --svf-index <n>          Download only one SVF root from manifest list\n` +
    `  --all-svf-roots          Download all SVF roots (default)\n` +
    `  --no-manifest            Do not write manifest.json to output directory\n` +
    `  --json                   Print machine-readable summary\n` +
    `  --help                   Show this message`
  );
}

function looksLikeBase64Url(value) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function normalizeBase64Urn(value) {
  return String(value || '')
    .trim()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function toDerivativeUrn(inputUrn, forceBase64) {
  let value = String(inputUrn || '').trim();
  if (value.startsWith('urn:')) {
    value = value.slice(4);
  }

  if (forceBase64) {
    return normalizeBase64Urn(value);
  }

  if (looksLikeBase64Url(value)) {
    return normalizeBase64Urn(value);
  }

  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function authenticate(clientId, clientSecret) {
  const authClient = new ForgeSDK.AuthClientTwoLegged(
    clientId,
    clientSecret,
    ['data:read', 'bucket:read'],
    true,
  );

  const credentials = await authClient.authenticate();
  return { authClient, credentials };
}

function flattenNodes(node, output = []) {
  if (!node || typeof node !== 'object') {
    return output;
  }

  output.push(node);
  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    flattenNodes(child, output);
  }
  return output;
}

function extractSvfRoots(manifestBody) {
  const derivatives = Array.isArray(manifestBody.derivatives) ? manifestBody.derivatives : [];
  const svfRoots = [];

  for (const derivative of derivatives) {
    const allNodes = flattenNodes(derivative);
    for (const node of allNodes) {
      if (node.outputType === 'svf') {
        svfRoots.push(node);
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const node of svfRoots) {
    const key = `${node.guid || ''}|${node.urn || ''}|${node.name || ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(node);
  }

  return unique;
}

function collectUrnsFromNode(node, outputSet) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (typeof node.urn === 'string' && node.urn.trim()) {
    outputSet.add(node.urn.trim());
  }

  const children = Array.isArray(node.children) ? node.children : [];
  for (const child of children) {
    collectUrnsFromNode(child, outputSet);
  }
}

function sanitizePathSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function derivativeUrnToRelativePath(derivativeUrn) {
  const decoded = decodeURIComponent(String(derivativeUrn || '')).split('?')[0];

  let noPrefix = decoded;
  if (noPrefix.startsWith('urn:')) {
    noPrefix = noPrefix.slice(4);
  }

  const outputIndex = noPrefix.indexOf('output/');
  let rel = outputIndex >= 0 ? noPrefix.slice(outputIndex + 'output/'.length) : noPrefix;

  rel = rel.replace(/^\/+/, '');

  if (!rel || rel === '.') {
    return 'resource.bin';
  }

  const normalized = path.posix.normalize(rel);
  if (normalized.startsWith('..')) {
    return sanitizePathSegment(normalized);
  }

  return normalized;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function joinRelativeDerivativeUrn(rootDerivativeUrn, relativeUri) {
  const rel = String(relativeUri || '').trim();
  if (!rel) {
    return '';
  }

  if (rel.startsWith('urn:') || /^[a-z]+:\/\//i.test(rel)) {
    return rel;
  }

  const rootNoQuery = String(rootDerivativeUrn || '').split('?')[0];
  const lastSlash = rootNoQuery.lastIndexOf('/');
  const baseDir = lastSlash >= 0 ? rootNoQuery.slice(0, lastSlash + 1) : `${rootNoQuery}/`;
  const cleanRel = rel.replace(/^\.\//, '');
  return `${baseDir}${cleanRel}`;
}

async function extractSvfAssetUrisFromLocalFile(localSvfPath) {
  let data;
  try {
    data = await fs.readFile(localSvfPath);
  } catch (error) {
    throw new ApsError(`Unable to read SVF file ${localSvfPath}: ${error.message}`);
  }

  let zip;
  try {
    zip = new AdmZip(data);
  } catch (error) {
    throw new ApsError(`Unable to open SVF zip ${localSvfPath}: ${error.message}`);
  }

  const manifestEntry = zip.getEntry('manifest.json');
  if (!manifestEntry) {
    throw new ApsError(`Embedded manifest.json not found in ${localSvfPath}.`);
  }

  let manifest;
  try {
    manifest = JSON.parse(zip.readAsText(manifestEntry));
  } catch (error) {
    throw new ApsError(`Invalid embedded manifest.json in ${localSvfPath}: ${error.message}`);
  }

  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const uris = [];
  for (const asset of assets) {
    const uri = asset && typeof asset.URI === 'string' ? asset.URI.trim() : '';
    if (!uri || uri.startsWith('embed:/')) {
      continue;
    }
    uris.push(uri);
  }

  return uris;
}

async function downloadDerivativeResource(encodedUrn, derivativeUrn, token, outputDir) {
  const relativePath = derivativeUrnToRelativePath(derivativeUrn);
  const destination = path.resolve(outputDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  const endpoint = `${APS_BASE_URL}/modelderivative/v2/designdata/${encodedUrn}/manifest/${encodeURIComponent(derivativeUrn)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApsError(`Failed to download ${derivativeUrn}: HTTP ${response.status} ${response.statusText} ${message}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));

  return destination;
}

async function getManifest(derivativesApi, authClient, credentials, encodedUrn) {
  const response = await derivativesApi.getManifest(encodedUrn, {}, authClient, credentials);
  return response.body || {};
}

function buildSummary({ encodedUrn, outputDir, roots, selectedRoots, requestedUrns, downloadedFiles, failed }) {
  return {
    encodedUrn,
    outputDir,
    svfRootCount: roots.length,
    selectedSvfRootCount: selectedRoots.length,
    requestedResourceCount: requestedUrns.length,
    downloadedCount: downloadedFiles.length,
    failedCount: failed.length,
    failed,
  };
}

async function main() {
  const options = parseArgs(process.argv);
  const encodedUrn = toDerivativeUrn(options.urn, options.urnIsBase64);
  const outputDir = path.resolve(process.cwd(), options.outputDir);

  const derivativesApi = new ForgeSDK.DerivativesApi();
  const { authClient, credentials } = await authenticate(options.clientId, options.clientSecret);
  const manifest = await getManifest(derivativesApi, authClient, credentials, encodedUrn);

  if (!manifest || typeof manifest !== 'object') {
    throw new ApsError('Manifest response was empty.');
  }

  const roots = extractSvfRoots(manifest);
  if (!roots.length) {
    throw new ApsError('No SVF1 roots found in manifest. Run SVF1 translation first.');
  }

  const selectedRoots = options.allSvfRoots ? roots : [roots[options.svfIndex]].filter(Boolean);
  if (!selectedRoots.length) {
    throw new ApsError(`SVF root index out of range. Available roots: ${roots.length}`);
  }

  const urnSet = new Set();
  for (const root of selectedRoots) {
    collectUrnsFromNode(root, urnSet);
  }

  const requestedUrns = [...urnSet].filter((urn) => typeof urn === 'string' && urn.length > 0);
  if (!requestedUrns.length) {
    throw new ApsError('No resource URNs found under selected SVF roots.');
  }

  await fs.mkdir(outputDir, { recursive: true });
  if (options.includeManifest) {
    await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  const downloadedFiles = [];
  const failed = [];

  for (const derivativeUrn of requestedUrns) {
    try {
      const destination = await downloadDerivativeResource(encodedUrn, derivativeUrn, credentials.access_token, outputDir);
      downloadedFiles.push({ urn: derivativeUrn, file: destination });
      console.log(`[ok] ${derivativeUrn} -> ${destination}`);
    } catch (error) {
      failed.push({ urn: derivativeUrn, error: String(error.message || error) });
      console.error(`[err] ${derivativeUrn}: ${error.message || error}`);
    }
  }

  const additionalUrnSet = new Set();
  for (const root of selectedRoots) {
    if (!root || root.outputType !== 'svf') {
      continue;
    }

    const rootUrnCandidates = new Set();
    collectUrnsFromNode(root, rootUrnCandidates);
    const rootSvfUrn = [
      typeof root.urn === 'string' ? root.urn.trim() : '',
      ...[...rootUrnCandidates],
    ].find((value) => typeof value === 'string' && value.toLowerCase().endsWith('.svf'));

    if (!rootSvfUrn) {
      continue;
    }

    const localRootPath = path.resolve(outputDir, derivativeUrnToRelativePath(rootSvfUrn));
    if (!(await fileExists(localRootPath))) {
      continue;
    }

    let assetUris = [];
    try {
      assetUris = await extractSvfAssetUrisFromLocalFile(localRootPath);
    } catch (error) {
      failed.push({ urn: rootSvfUrn, error: String(error.message || error) });
      console.error(`[err] ${rootSvfUrn}: ${error.message || error}`);
      continue;
    }

    for (const assetUri of assetUris) {
      const expandedUrn = joinRelativeDerivativeUrn(rootSvfUrn, assetUri);
      if (!expandedUrn) {
        continue;
      }
      if (urnSet.has(expandedUrn) || additionalUrnSet.has(expandedUrn)) {
        continue;
      }
      additionalUrnSet.add(expandedUrn);
    }
  }

  const additionalUrns = [...additionalUrnSet];
  if (additionalUrns.length) {
    for (const derivativeUrn of additionalUrns) {
      try {
        const destination = await downloadDerivativeResource(encodedUrn, derivativeUrn, credentials.access_token, outputDir);
        downloadedFiles.push({ urn: derivativeUrn, file: destination });
        console.log(`[ok] ${derivativeUrn} -> ${destination}`);
      } catch (error) {
        failed.push({ urn: derivativeUrn, error: String(error.message || error) });
        console.error(`[err] ${derivativeUrn}: ${error.message || error}`);
      }
    }
  }

  const summary = buildSummary({
    encodedUrn,
    outputDir,
    roots,
    selectedRoots,
    requestedUrns: [...requestedUrns, ...additionalUrns],
    downloadedFiles,
    failed,
  });

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`SVF roots found: ${summary.svfRootCount}`);
    console.log(`SVF roots selected: ${summary.selectedSvfRootCount}`);
    console.log(`Resources requested: ${summary.requestedResourceCount}`);
    console.log(`Downloaded: ${summary.downloadedCount}`);
    console.log(`Failed: ${summary.failedCount}`);
    console.log(`Output directory: ${summary.outputDir}`);
  }

  if (failed.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  const statusCode = error?.response?.statusCode || error?.statusCode;
  const statusMessage = error?.response?.statusMessage || error?.statusMessage || error?.message;

  if (statusCode) {
    const body = error?.response?.body ? JSON.stringify(error.response.body, null, 2) : '';
    console.error(`HTTP error: ${statusCode} ${statusMessage || ''}`);
    if (body) {
      console.error(body);
    }
    process.exit(1);
    return;
  }

  console.error(`Error: ${statusMessage || error}`);
  process.exit(1);
});
