const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');

const parseEnvValue = (content, key) => {
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) {
    return null;
  }

  const value = line.slice(line.indexOf('=') + 1).trim();
  return value.replace(/^['"]|['"]$/g, '');
};

if (!fs.existsSync(envLocalPath)) {
  console.error('Missing .env.local file in the project root.');
  process.exit(1);
}

const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
const databaseUrl = parseEnvValue(envLocalContent, 'DATABASE_URL');

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local.');
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error('Usage: node scripts/run-prisma-with-env.cjs <prisma args>');
  process.exit(1);
}

const prismaCliPath = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');

if (!fs.existsSync(prismaCliPath)) {
  console.error('Prisma CLI is not installed. Run npm install first.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [prismaCliPath, ...prismaArgs], {
  cwd: projectRoot,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
