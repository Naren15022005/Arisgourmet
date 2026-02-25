// Minimal helper to set a repo secret and dispatch a workflow run using Octokit
// Usage: node scripts/github-set-secret-and-rerun.js <owner> <repo> <secretName> <secretValue> <workflow_id>

/*
const { Octokit } = require('@octokit/rest');
const sodium = require('tweetsodium');

async function setSecret(octokit, owner, repo, name, value) {
  const { data: publicKey } = await octokit.actions.getRepoPublicKey({ owner, repo });
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(publicKey.key, 'base64');
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  const encrypted = Buffer.from(encryptedBytes).toString('base64');
  await octokit.actions.createOrUpdateRepoSecret({ owner, repo, secret_name: name, encrypted_value: encrypted, key_id: publicKey.key_id });
}

(async () => {
  console.log('This is a template helper. Fill in a GitHub token in env var GITHUB_TOKEN to use.');
})();
*/

console.log('scripts/github-set-secret-and-rerun.js: template created (see comments)');
