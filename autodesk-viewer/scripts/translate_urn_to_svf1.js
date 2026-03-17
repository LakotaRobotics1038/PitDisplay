#!/usr/bin/env node

const ForgeSDK = require('forge-apis');

class ApsError extends Error {}

function parseArgs(argv) {
  const options = {
    urn: '',
    clientId: process.env.APS_CLIENT_ID || process.env.FORGE_CLIENT_ID || '',
    clientSecret: process.env.APS_CLIENT_SECRET || process.env.FORGE_CLIENT_SECRET || '',
    views: '2d,3d',
    force: false,
    pollInterval: 5,
    timeout: 900,
    urnIsBase64: false,
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
    } else if (arg === '--views') {
      options.views = argv[++index] || '2d,3d';
    } else if (arg === '--poll-interval') {
      options.pollInterval = Number(argv[++index] || '5');
    } else if (arg === '--timeout') {
      options.timeout = Number(argv[++index] || '900');
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--urn-is-base64') {
      options.urnIsBase64 = true;
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

  if (!Number.isFinite(options.pollInterval) || options.pollInterval <= 0) {
    throw new ApsError('--poll-interval must be a positive number.');
  }

  if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
    throw new ApsError('--timeout must be a positive number of seconds.');
  }

  return options;
}

function printHelp() {
  console.log(`Translate a URN to SVF1 and report resulting SVF derivative entries.\n\n` +
`Usage:\n` +
`  APS_CLIENT_ID=... APS_CLIENT_SECRET=... node ./scripts/translate_urn_to_svf1.js --urn <urn>\n\n` +
`Options:\n` +
`  --urn <value>            Source design URN (raw object URN or base64 URN)\n` +
`  --client-id <value>      APS client id (default: APS_CLIENT_ID env)\n` +
`  --client-secret <value>  APS client secret (default: APS_CLIENT_SECRET env)\n` +
`  --views <2d,3d>          Comma-separated views for SVF output (default: 2d,3d)\n` +
`  --force                  Force regeneration of derivatives\n` +
`  --poll-interval <secs>   Seconds between polling attempts (default: 5)\n` +
`  --timeout <secs>         Wait timeout in seconds (default: 900)\n` +
`  --urn-is-base64          Treat input URN as already base64-url encoded\n` +
`  --json                   Print machine-readable JSON output\n` +
`  --help                   Show this message`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function extractSvfNodes(manifestBody) {
  const derivatives = Array.isArray(manifestBody.derivatives) ? manifestBody.derivatives : [];
  const nodes = [];

  for (const derivative of derivatives) {
    const flat = flattenNodes(derivative);
    for (const node of flat) {
      if (node.outputType === 'svf') {
        nodes.push(node);
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const node of nodes) {
    const key = `${node.guid || ''}|${node.urn || ''}|${node.name || ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(node);
  }
  return unique;
}

async function authenticate(clientId, clientSecret) {
  const authClient = new ForgeSDK.AuthClientTwoLegged(
    clientId,
    clientSecret,
    ['data:read', 'data:write', 'bucket:read'],
    true,
  );

  const credentials = await authClient.authenticate();
  return { authClient, credentials };
}

async function submitSvfJob(derivativesApi, authClient, credentials, urn, views, force) {
  const payload = {
    input: { urn },
    output: {
      formats: [
        {
          type: 'svf',
          views,
        },
      ],
      force: Boolean(force),
    },
  };

  const response = await derivativesApi.translate(payload, {}, authClient, credentials);
  return response.body || {};
}

async function getManifest(derivativesApi, authClient, credentials, urn) {
  const response = await derivativesApi.getManifest(urn, {}, authClient, credentials);
  return response.body || {};
}

async function pollManifest(derivativesApi, authClient, credentials, urn, timeoutSeconds, pollIntervalSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (true) {
    try {
      const manifest = await getManifest(derivativesApi, authClient, credentials, urn);
      const status = manifest.status;

      if (status === 'success') {
        return manifest;
      }

      if (status === 'failed' || status === 'timeout') {
        throw new ApsError(`Translation failed. status=${status}, progress=${manifest.progress || ''}`);
      }

      if (Date.now() >= deadline) {
        throw new ApsError(`Timed out waiting for translation. Last status=${status}, progress=${manifest.progress || ''}`);
      }

      await sleep(pollIntervalSeconds * 1000);
    } catch (error) {
      const statusCode = error?.response?.statusCode || error?.statusCode;
      if (statusCode === 404 && Date.now() < deadline) {
        await sleep(pollIntervalSeconds * 1000);
        continue;
      }
      throw error;
    }
  }
}

function buildOutput(encodedUrn, job, manifest, svfNodes) {
  return {
    encodedUrn,
    job,
    manifestStatus: manifest.status,
    manifestProgress: manifest.progress,
    svfDerivatives: svfNodes.map((node) => ({
      guid: node.guid,
      name: node.name,
      role: node.role,
      outputType: node.outputType,
      urn: node.urn,
      status: node.status,
      progress: node.progress,
    })),
  };
}

function printOutput(output, asJson) {
  if (asJson) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`Encoded URN: ${output.encodedUrn}`);
  console.log(`Job result: ${output.job.result || 'unknown'}`);
  console.log(`Manifest: ${output.manifestStatus} (${output.manifestProgress || 'n/a'})`);

  if (!output.svfDerivatives.length) {
    console.log('No SVF1 derivative nodes found in manifest.');
    return;
  }

  console.log('SVF1 derivative nodes:');
  for (const node of output.svfDerivatives) {
    console.log(`- guid=${node.guid || ''} role=${node.role || ''} status=${node.status || ''} urn=${node.urn || ''}`);
  }
}

async function main() {
  const options = parseArgs(process.argv);
  const encodedUrn = toDerivativeUrn(options.urn, options.urnIsBase64);
  const views = options.views.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);

  if (!views.length) {
    throw new ApsError('At least one view is required (2d and/or 3d).');
  }

  const derivativesApi = new ForgeSDK.DerivativesApi();
  const { authClient, credentials } = await authenticate(options.clientId, options.clientSecret);

  const job = await submitSvfJob(derivativesApi, authClient, credentials, encodedUrn, views, options.force);
  const manifest = await pollManifest(
    derivativesApi,
    authClient,
    credentials,
    encodedUrn,
    options.timeout,
    options.pollInterval,
  );

  const svfNodes = extractSvfNodes(manifest);
  const output = buildOutput(encodedUrn, job, manifest, svfNodes);
  printOutput(output, options.json);
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
