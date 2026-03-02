#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');

// ─── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.log('\n');
  console.log(chalk.bgGreen.black.bold('  neon-prisma-starter  '));
  console.log(chalk.gray('  Node.js + Prisma + Neon · Instant Project Setup\n'));
  console.log(chalk.bold('  Requirements:'));
  console.log(chalk.gray('  • Node.js  ') + chalk.white('v18+'));
  console.log(chalk.gray('  • Prisma   ') + chalk.white('v7.2.0') + chalk.gray(' (auto-installed)'));
  console.log(chalk.gray('  • Neon     ') + chalk.white('Free account at neon.tech') + chalk.gray(' → get DATABASE_URL + DIRECT_URL'));
  console.log('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function run(cmd, cwd) {
  execSync(cmd, { stdio: 'inherit', cwd });
}

function writeFile(filePath, content) {
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

// ─── Build package.json for the scaffolded project ───────────────────────────
function buildPackageJson(projectName, useTs) {
  const base = {
    name: projectName,
    version: '1.0.0',
    description: 'Node.js + Prisma + Neon project',
    dependencies: {
      '@prisma/adapter-neon': '7.2.0',
      '@prisma/client':       '7.2.0',
      dotenv:                 '^16.0.0',
      express:                '^4.18.0',
      prisma:                 '7.2.0',
    },
  };

  if (useTs) {
    return {
      ...base,
      main: 'dist/index.js',
      scripts: {
        dev:         'ts-node-dev --respawn src/index.ts',
        build:       'tsc',
        start:       'node dist/index.js',
        generate:    'npx prisma generate',
        migrate:     'npx prisma migrate dev',
        seed:        'ts-node prisma/seed.ts',
        studio:      'npx prisma studio',
      },
      devDependencies: {
        '@types/express': '^4.17.0',
        '@types/node':    '^20.0.0',
        'ts-node':        '^10.9.0',
        'ts-node-dev':    '^2.0.0',
        typescript:       '^5.0.0',
        tsx:              '^4.0.0',
      },
    };
  }

  return {
    ...base,
    main: 'src/index.js',
    scripts: {
      dev:         'nodemon src/index.js',
      start:       'node src/index.js',
      generate:    'npx prisma generate',
      migrate:     'npx prisma migrate dev',
      seed:        'node prisma/seed.js',
      studio:      'npx prisma studio',
    },
    devDependencies: {
      nodemon: '^3.0.0',
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  // 1. Project name
  let projectName = process.argv[2];
  if (!projectName) {
    const res = await prompts({
      type:     'text',
      name:     'projectName',
      message:  'Project name:',
      initial:  'my-neon-app',
      validate: v => v.trim().length > 0 || 'Project name cannot be empty',
    });
    projectName = res.projectName;
  }

  if (!projectName) {
    console.log(chalk.red('\n✖ No project name provided. Exiting.\n'));
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // 2. Overwrite check
  if (fs.existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type:    'confirm',
      name:    'overwrite',
      message: `Folder "${projectName}" already exists. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log(chalk.yellow('\n⚠ Aborted.\n'));
      process.exit(0);
    }
    fs.removeSync(targetDir);
  }

  // 3. TypeScript or JavaScript?
  const { language } = await prompts({
    type:    'select',
    name:    'language',
    message: 'Select language:',
    choices: [
      {
        title:       chalk.blue('TypeScript') + chalk.gray(' (recommended)'),
        description: 'Fully typed — tsconfig, ts-node-dev, @types included',
        value:       'ts',
      },
      {
        title:       chalk.yellow('JavaScript'),
        description: 'Plain JS with nodemon — simpler setup',
        value:       'js',
      },
    ],
    initial: 0,
  });

  if (!language) {
    console.log(chalk.yellow('\n⚠ Aborted.\n'));
    process.exit(0);
  }

  const useTs = language === 'ts';

  // 4. Two Neon URLs
  console.log(chalk.gray('\n  Get both from: Neon Console → Your Project → Connect\n'));
  const { dbUrl } = await prompts({
    type:    'text',
    name:    'dbUrl',
    message: 'Pooled DATABASE_URL (app runtime, hostname has -pooler):',
    initial: '',
  });

  const { directUrl } = await prompts({
    type:    'text',
    name:    'directUrl',
    message: 'Direct DIRECT_URL (Prisma CLI/migrations, no -pooler):',
    initial: dbUrl ? dbUrl.replace('-pooler', '') : '',
  });

  console.log('');

  // ─── Scaffold project ────────────────────────────────────────────────────
  const spinner = ora('Creating project structure...').start();

  try {
    fs.ensureDirSync(targetDir);

    // Copy the right template folder: templates/ts or templates/js
    const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', language);
    fs.copySync(TEMPLATE_DIR, targetDir);

    // Rename _gitignore → .gitignore (npm strips .gitignore on publish)
    const gitignoreSrc = path.join(targetDir, '_gitignore');
    const gitignoreDest = path.join(targetDir, '.gitignore');
    if (fs.existsSync(gitignoreSrc)) {
      fs.renameSync(gitignoreSrc, gitignoreDest);
    }

    // .env - two URLs needed:
    // DATABASE_URL = pooled (has -pooler in hostname) → used by app at runtime
    // DIRECT_URL   = direct (no -pooler)              → used by Prisma CLI
    const placeholder_pooled = 'postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
    const placeholder_direct = 'postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require';
    writeFile(
      path.join(targetDir, '.env'),
      (dbUrl || directUrl)
        ? `# Pooled connection (app runtime)\nDATABASE_URL="${dbUrl || placeholder_pooled}"\n\n# Direct connection (Prisma CLI)\nDIRECT_URL="${directUrl || placeholder_direct}"\n`
        : `# Pooled connection (app runtime) - has -pooler in hostname\nDATABASE_URL="${placeholder_pooled}"\n\n# Direct connection (Prisma CLI) - no -pooler in hostname\nDIRECT_URL="${placeholder_direct}"\n`
    );

    // .env.example
    writeFile(
      path.join(targetDir, '.env.example'),
      `# Pooled connection (app runtime) - has -pooler in hostname\nDATABASE_URL="${placeholder_pooled}"\n\n# Direct connection (Prisma CLI) - no -pooler in hostname\nDIRECT_URL="${placeholder_direct}"\n`
    );

    // package.json
    writeFile(
      path.join(targetDir, 'package.json'),
      JSON.stringify(buildPackageJson(projectName, useTs), null, 2)
    );

    spinner.succeed(chalk.green(`Project structure created (${useTs ? 'TypeScript' : 'JavaScript'})`));
  } catch (err) {
    spinner.fail('Failed to create project structure');
    console.error(err);
    process.exit(1);
  }

  // ─── Install dependencies ────────────────────────────────────────────────
  const installSpinner = ora('Installing dependencies...').start();
  try {
    run('npm install', targetDir);
    installSpinner.succeed(chalk.green('Dependencies installed'));
  } catch {
    installSpinner.fail('npm install failed — run it manually');
  }

  // ─── Run migration if DB URL was provided ────────────────────────────────
  if (dbUrl && directUrl) {
    const migrateSpinner = ora('Running Prisma migration...').start();
    try {
      run('npx --prefix . prisma migrate dev --name init', targetDir);
      migrateSpinner.succeed(chalk.green('Database migrated'));
    } catch {
      migrateSpinner.warn(chalk.yellow('Migration skipped — run: npm run migrate'));
    }
  }

  // ─── Done ────────────────────────────────────────────────────────────────
  console.log('\n' + chalk.bgGreen.black.bold(' ✅  Project ready! ') + '\n');
  console.log(chalk.white.bold(`  cd ${projectName}`));
  console.log('');

  if (!dbUrl || !directUrl) {
    console.log(chalk.yellow('  ⚠  Fill in your .env before running:'));
    console.log('');
    console.log(chalk.gray('  DATABASE_URL') + chalk.white(' = pooled URL  ') + chalk.gray('(hostname has -pooler) → app runtime'));
    console.log(chalk.gray('  DIRECT_URL  ') + chalk.white(' = direct URL  ') + chalk.gray('(no -pooler)           → Prisma CLI'));
    console.log(chalk.gray('  Both from: ') + chalk.cyan('Neon Console → Your Project → Connect'));
    console.log('');
  }

  console.log(chalk.cyan('  npm run generate') + chalk.gray(' → generate Prisma client'));
  console.log(chalk.cyan('  npm run migrate ') + chalk.gray(' → create tables in Neon'));
  console.log(chalk.cyan('  npm run seed    ') + chalk.gray(' → populate with example data'));
  console.log(chalk.cyan('  npm run dev     ') + chalk.gray(' → start server on :3000'));

  if (useTs) {
    console.log(chalk.cyan('  npm run build  ') + chalk.gray('   → compile TypeScript → dist/'));
  }

  console.log('');
  console.log(chalk.gray('  API Endpoints:'));
  console.log(chalk.white('  GET    /users       → list all users'));
  console.log(chalk.white('  POST   /users       → create a new user'));
  console.log(chalk.white('  GET    /users/:id   → get user by id'));
  console.log(chalk.white('  PUT    /users/:id   → update user'));
  console.log(chalk.white('  DELETE /users/:id   → delete user'));
  console.log('');
  console.log(chalk.gray('  ─────────────────────────────────────────────'));
  console.log(chalk.gray('  ℹ  This project uses:'));
  console.log(chalk.gray('     Prisma    ') + chalk.white('v7.2.0') + chalk.gray(' (required for no-url schema support)'));
  console.log(chalk.gray('     Node.js   ') + chalk.white('v18+'));
  console.log(chalk.gray('     Neon      ') + chalk.white('@prisma/adapter-neon v7.2.0'));
  console.log('');
}

main().catch(err => {
  console.error(chalk.red('\n✖ Something went wrong:\n'), err);
  process.exit(1);
});
