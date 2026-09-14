const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js')
const onePixelPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function runCli(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, 'generate', ...args], {
      env: { ...process.env, IMAGEGEN_SMARTO_API_KEY: 'test-key', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }))
  })
}

function startRelay({ delayMs = 0 } = {}) {
  const server = http.createServer((request, response) => {
    if (request.method !== 'POST') {
      response.writeHead(405).end()
      return
    }
    setTimeout(() => {
      response.writeHead(200, {
        'content-type': 'text/event-stream',
        connection: 'keep-alive',
      })
      response.write(`data: ${JSON.stringify({
        type: 'response.output_item.done',
        item: { type: 'image_generation_call', result: onePixelPng },
      })}\n\n`)
      response.end('data: [DONE]\n\n')
    }, delayMs)
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      })
    })
  })
}

test('generates an image, keeps progress off stdout, and exits cleanly', async (t) => {
  const relay = await startRelay({ delayMs: 25 })
  t.after(() => relay.server.close())
  const output = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'imagegen-smarto-test-')), 'result.png')
  t.after(() => fs.rmSync(path.dirname(output), { recursive: true, force: true }))

  const result = await runCli([
    '--prompt', 'test image',
    '--base-url', relay.baseUrl,
    '--model', 'test-model',
    '--output', output,
  ], { IMAGEGEN_SMARTO_PROGRESS_INTERVAL_MS: '10' })

  assert.equal(result.code, 0, result.stderr)
  assert.equal(result.signal, null)
  assert.match(result.stdout, new RegExp(`IMAGE_PATH=${output.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`))
  assert.match(result.stdout, /IMAGE_MARKDOWN=/)
  assert.match(result.stderr, /starting image generation/)
  assert.match(result.stderr, /still waiting for the image relay/)
  assert.match(result.stderr, /relay connected; waiting for streamed image result/)
  assert.match(result.stderr, /image result received after/)
  assert.match(result.stderr, /saved 1 image in/)
  assert.equal(fs.statSync(output).size > 0, true)
})

test('quiet mode preserves final records without progress output', async (t) => {
  const relay = await startRelay()
  t.after(() => relay.server.close())
  const output = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'imagegen-smarto-test-')), 'quiet.png')
  t.after(() => fs.rmSync(path.dirname(output), { recursive: true, force: true }))

  const result = await runCli([
    '--prompt', 'test image',
    '--base-url', relay.baseUrl,
    '--model', 'test-model',
    '--output', output,
    '--quiet',
  ])

  assert.equal(result.code, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.match(result.stdout, /IMAGE_PATH=/)
  assert.match(result.stdout, /IMAGE_MARKDOWN=/)
})
