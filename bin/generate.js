#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const IMAGEGEN_MARKER = '__CODEX_VPS_IMAGEGEN__'
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

function printGenerateHelp() {
  console.log(`imagegen-smarto generate - generate or edit an image through the active relay

Usage:
  imagegen-smarto generate --prompt "your prompt" [options]
  imagegen-smarto generate "your prompt" [options]

Options:
  --prompt <text>       Prompt for generation or editing
  --image <path>        Reference image; may be repeated for image editing
  --output <path>       Output PNG path (default: a temporary file)
  --model <model>       Override the model from Codex config
  --base-url <url>      Override the active provider base URL
  --timeout <seconds>   Request timeout (default: 600)
  --help                Show this help`)
}

function parseGenerateArgs(argv) {
  const options = {
    images: [],
    prompt: null,
    output: null,
    model: null,
    baseUrl: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  }
  const positional = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    if (arg === '--prompt') {
      options.prompt = argv[++index]
      if (!options.prompt) throw new Error('--prompt requires text')
      continue
    }

    if (arg === '--image' || arg === '--input-image') {
      const image = argv[++index]
      if (!image) throw new Error(`${arg} requires a path`)
      options.images.push(image)
      continue
    }

    if (arg === '--output') {
      options.output = argv[++index]
      if (!options.output) throw new Error('--output requires a path')
      continue
    }

    if (arg === '--model') {
      options.model = argv[++index]
      if (!options.model) throw new Error('--model requires a model name')
      continue
    }

    if (arg === '--base-url') {
      options.baseUrl = argv[++index]
      if (!options.baseUrl) throw new Error('--base-url requires a URL')
      continue
    }

    if (arg === '--timeout') {
      const seconds = Number(argv[++index])
      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error('--timeout must be a positive number of seconds')
      }
      options.timeoutMs = seconds * 1000
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`)
    }
    positional.push(arg)
  }

  if (!options.prompt && positional.length > 0) {
    options.prompt = positional.join(' ')
  }

  return options
}

function resolveCodexHome() {
  const configuredPath = process.env.CODEX_HOME
  if (configuredPath && configuredPath.trim()) {
    return path.resolve(configuredPath)
  }
  return path.join(os.homedir(), '.codex')
}

function readCodexConfig(codexHome) {
  const configPath = path.join(codexHome, 'config.toml')
  try {
    return fs.readFileSync(configPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return ''
    throw new Error(`cannot read ${configPath}: ${error.message}`)
  }
}

function tomlStringValue(text, key, section) {
  let sectionText = text

  if (section) {
    const sectionHeader = `[model_providers.${section}]`
    const sectionStart = text.indexOf(sectionHeader)
    if (sectionStart >= 0) {
      const contentStart = text.indexOf('\n', sectionStart)
      const nextSection = text.slice(contentStart + 1).search(/^\s*\[/m)
      sectionText = nextSection >= 0
        ? text.slice(contentStart + 1, contentStart + 1 + nextSection)
        : text.slice(contentStart + 1)
    } else {
      sectionText = ''
    }
  }

  const match = sectionText.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']+)["']`, 'm'))
  return match ? match[1] : null
}

function readActiveProviderConfig(codexHome) {
  const config = readCodexConfig(codexHome)
  const provider = tomlStringValue(config, 'model_provider') || 'openai'
  const baseUrl = process.env.IMAGEGEN_SMARTO_BASE_URL
    || process.env.OPENAI_BASE_URL
    || tomlStringValue(config, 'base_url', provider)
    || tomlStringValue(config, 'base_url')
  const model = process.env.IMAGEGEN_SMARTO_MODEL
    || tomlStringValue(config, 'model')

  if (!baseUrl) {
    throw new Error(
      `no active provider base_url found in ${path.join(codexHome, 'config.toml')}; `
      + 'set IMAGEGEN_SMARTO_BASE_URL or use a Codex profile with a base_url',
    )
  }
  if (!model) {
    throw new Error(
      `no active model found in ${path.join(codexHome, 'config.toml')}; `
      + 'set IMAGEGEN_SMARTO_MODEL or pass --model',
    )
  }

  return { baseUrl, model }
}

function readApiKey(codexHome) {
  if (process.env.IMAGEGEN_SMARTO_API_KEY) return process.env.IMAGEGEN_SMARTO_API_KEY
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY

  const authPath = path.join(codexHome, 'auth.json')
  try {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'))
    const candidates = [
      auth.OPENAI_API_KEY,
      auth.openai_api_key,
      auth.api_key,
      auth.access_token,
      auth.tokens?.access_token,
    ]
    const key = candidates.find((value) => typeof value === 'string' && value.trim())
    if (key) return key
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`cannot read ${authPath}: ${error.message}`)
    }
  }

  throw new Error(
    `no API credential found; set OPENAI_API_KEY or log in so ${authPath} contains OPENAI_API_KEY`,
  )
}

function normalizeResponsesUrl(baseUrl) {
  const normalized = baseUrl.replace(/\/+$/, '')
  return normalized.endsWith('/responses') ? normalized : `${normalized}/responses`
}

function imageMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'
  return 'image/png'
}

function imageDataUrl(filePath) {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`reference image does not exist: ${absolutePath}`)
  }
  const data = fs.readFileSync(absolutePath).toString('base64')
  return `data:${imageMimeType(absolutePath)};base64,${data}`
}

function decodeImageResult(result) {
  if (typeof result !== 'string' || !result) {
    throw new Error('the relay returned an empty image result')
  }

  if (result.startsWith('data:')) {
    const comma = result.indexOf(',')
    if (comma < 0) throw new Error('the relay returned an invalid data URL')
    return Buffer.from(result.slice(comma + 1), 'base64')
  }

  return Buffer.from(result, 'base64')
}

function parseSseBlock(block) {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data || data === '[DONE]') return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function consumeSseText(buffer, onEvent, flush = false) {
  const blocks = buffer.split(/\r?\n\r?\n/)
  const remainder = flush ? '' : blocks.pop()
  for (const block of blocks) {
    const event = parseSseBlock(block)
    if (event) onEvent(event)
  }
  if (flush && remainder) {
    const event = parseSseBlock(remainder)
    if (event) onEvent(event)
  }
  return remainder || ''
}

function extractError(event) {
  if (!event || typeof event !== 'object') return null
  if (event.error?.message) return event.error.message
  if (event.response?.error?.message) return event.response.error.message
  if (event.type?.endsWith('.failed')) {
    return event.message || `relay event ${event.type} reported failure`
  }
  return null
}

function outputPathForIndex(requestedPath, index) {
  if (index === 0 && requestedPath) return path.resolve(requestedPath)
  const base = requestedPath
    ? path.resolve(requestedPath)
    : path.join(os.tmpdir(), `imagegen-smarto-${Date.now()}.png`)
  if (index === 0) return base
  const extension = path.extname(base) || '.png'
  return `${base.slice(0, -extension.length)}-${index + 1}${extension}`
}

async function requestImage({ prompt, images, output, model, baseUrl, timeoutMs }) {
  const codexHome = resolveCodexHome()
  const active = readActiveProviderConfig(codexHome)
  const apiKey = readApiKey(codexHome)
  const content = [{ type: 'input_text', text: prompt }]
  for (const image of images) {
    content.push({ type: 'input_image', image_url: imageDataUrl(image) })
  }

  const body = {
    model: model || active.model,
    instructions: IMAGEGEN_MARKER,
    input: [{ role: 'user', content }],
    stream: true,
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(normalizeResponsesUrl(baseUrl || active.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') throw new Error(`image request timed out after ${timeoutMs / 1000}s`)
    throw new Error(`cannot reach the image relay: ${error.message}`)
  }

  if (!response.ok) {
    clearTimeout(timeout)
    const errorText = (await response.text()).slice(0, 2000)
    throw new Error(`image relay returned HTTP ${response.status}: ${errorText}`)
  }
  if (!response.body) {
    clearTimeout(timeout)
    throw new Error('image relay returned no response body')
  }

  const results = []
  let relayError = null
  let buffer = ''
  const decoder = new TextDecoder()
  const onEvent = (event) => {
    relayError ||= extractError(event)
    const item = event.type === 'response.output_item.done' ? event.item : null
    if (item?.type === 'image_generation_call' && item.result) {
      results.push(item.result)
    }
  }

  try {
    const reader = response.body.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      buffer = consumeSseText(buffer, onEvent)
    }
    buffer += decoder.decode()
    consumeSseText(buffer, onEvent, true)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`image request timed out after ${timeoutMs / 1000}s`)
    }
    throw new Error(`failed while reading the image relay response: ${error.message}`)
  } finally {
    clearTimeout(timeout)
  }

  if (relayError) throw new Error(relayError)
  if (results.length === 0) {
    throw new Error('the relay completed without an image result')
  }

  const paths = []
  for (let index = 0; index < results.length; index += 1) {
    const filePath = outputPathForIndex(output, index)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, decodeImageResult(results[index]), { mode: 0o600 })
    paths.push(filePath)
  }
  return paths
}

async function generateImage(argv) {
  const options = parseGenerateArgs(argv)
  if (options.help) {
    printGenerateHelp()
    return
  }
  if (!options.prompt) {
    printGenerateHelp()
    throw new Error('a prompt is required')
  }

  const paths = await requestImage({
    prompt: options.prompt,
    images: options.images,
    output: options.output,
    model: options.model,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
  })
  for (const filePath of paths) {
    console.log(`IMAGE_PATH=${filePath}`)
    console.log(`IMAGE_MARKDOWN=![Generated image](${filePath})`)
  }
}

module.exports = { generateImage, printGenerateHelp }
