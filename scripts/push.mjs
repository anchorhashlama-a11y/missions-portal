import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, '..');

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'anchorhashlama-a11y';
const REPO_NAME = 'missions-portal';

async function main() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN env var is missing');

  const remoteUrl = `https://github.com/${USERNAME}/${REPO_NAME}.git`;

  // Step 2: Init git repo
  console.log('\n🔧 Initializing git repo...');
  await git.init({ fs, dir, defaultBranch: 'main' });

  // Step 3: Stage all files
  console.log('📁 Staging all files...');
  await git.add({ fs, dir, filepath: '.' });

  // Step 4: Commit
  console.log('💾 Committing...');
  const sha = await git.commit({
    fs,
    dir,
    message: 'Initial commit — ProTask missions portal',
    author: {
      name: USERNAME,
      email: 'anchorhashlama@gmail.com'
    }
  });
  console.log(`   Commit: ${sha}`);

  // Step 5: Add remote
  console.log('🌐 Adding remote...');
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
  } catch {
    await git.deleteRemote({ fs, dir, remote: 'origin' });
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
  }

  // Step 6: Push
  console.log('🚀 Pushing to GitHub...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    remoteRef: 'main',
    force: true,
    onAuth: () => ({ username: TOKEN, password: '' }),
    onProgress: (event) => {
      if (event.phase) process.stdout.write(`\r   ${event.phase}: ${event.loaded || 0}/${event.total || '?'}`);
    }
  });

  console.log('\n');
  if (pushResult.ok) {
    console.log(`\n✅ SUCCESS! Pushed to: https://github.com/${USERNAME}/${REPO_NAME}`);
  } else {
    console.error('❌ Push failed:', pushResult.errors);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
