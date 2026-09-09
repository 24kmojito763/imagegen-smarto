#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const packageRoot = path.resolve(__dirname, '..')
const bundledSkillPath = path.join(packageRoot, 'imagegen-smarto')

function printHelp() {
  console.log(`imagegen-smarto - install the Codex SmartO image skill

Usage:
  imagegen-smarto install [--codex-home <path>]
  imagegen-smarto uninstall [--codex-home <path>]
  imagegen-smarto path [--codex-home <path>]
  imagegen-smarto --help

The default Codex home is CODEX_HOME or ~/.codex.`)
}

function parseArgs(argv) {
  const args = [...argv]
  let command = 'install'
  let codexHome
  let quiet = false

  if (args[0] && !args[0].startsWith('-')) {
    command = args.shift()
  }

  while (args.length > 0) {
    const arg = args.shift()
    if (arg === '--codex-home') {
      codexHome = args.shift()
      if (!codexHome) {
        throw new Error('--codex-home requires a path')
      }
    } else if (arg === '--quiet' || arg === '--postinstall') {
      quiet = true
    } else if (arg === '--help' || arg === '-h') {
      command = 'help'
    } else {
      throw new Error(`unknown option: ${arg}`)
    }
  }

  return { command, codexHome, quiet }
}

function resolveCodexHome(explicitPath) {
  const configuredPath = explicitPath || process.env.CODEX_HOME
  if (configuredPath && configuredPath.trim()) {
    return path.resolve(configuredPath)
  }
  return path.join(os.homedir(), '.codex')
}

function getSkillTarget(codexHome) {
  return path.join(codexHome, 'skills', 'imagegen-smarto')
}

function installSkill(codexHome) {
  const sourceSkillFile = path.join(bundledSkillPath, 'SKILL.md')
  if (!fs.existsSync(sourceSkillFile)) {
    throw new Error(`bundled skill is missing: ${sourceSkillFile}`)
  }

  const target = getSkillTarget(codexHome)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.cpSync(bundledSkillPath, target, { recursive: true, force: true })
  return target
}

function uninstallSkill(codexHome) {
  const target = getSkillTarget(codexHome)
  fs.rmSync(target, { recursive: true, force: true })
  return target
}

function main() {
  const { command, codexHome: explicitCodexHome, quiet } = parseArgs(process.argv.slice(2))

  if (command === 'help') {
    printHelp()
    return
  }

  const codexHome = resolveCodexHome(explicitCodexHome)
  if (command === 'path') {
    console.log(getSkillTarget(codexHome))
    return
  }

  if (command === 'uninstall') {
    const target = uninstallSkill(codexHome)
    if (!quiet) {
      console.log(`Removed imagegen-smarto from ${target}`)
    }
    return
  }

  if (command !== 'install') {
    throw new Error(`unknown command: ${command}`)
  }

  const target = installSkill(codexHome)
  if (!quiet) {
    console.log(`Installed imagegen-smarto to ${target}`)
  }
}

try {
  main()
} catch (error) {
  console.error(`imagegen-smarto: ${error.message}`)
  process.exitCode = 1
}
