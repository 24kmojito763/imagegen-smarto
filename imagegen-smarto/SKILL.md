---
name: imagegen-smarto
description: Generate or edit raster images through the user's SmartO OpenAI-compatible VPS relay. Automatically use this skill for natural-language requests to create, draw, generate, or edit an image when the SmartO relay profile is active. It is also the drop-in image-generation provider for workflows that normally invoke `$imagegen`, including `hatch-pet`; preserve those workflows and replace only the image-generation execution layer. Do not use it for image analysis or coding tasks, official OpenAI/ChatGPT providers, or the built-in image_gen tool.
---

# SmartO relay image generation

Use this skill for actual raster-image generation or editing requests when the
SmartO relay profile is active. It is implicitly invokable, so the user should
be able to ask for an image in natural language without first writing
`$imagegen-smarto`.

When another active skill invokes `$imagegen` for a visual job (including the
official `hatch-pet` skill), treat this skill as the selected image-generation
provider when the SmartO relay profile is active. Keep the calling skill's
workflow, prompts, reference-image requirements, QA, and file handling
unchanged; replace only the provider-specific built-in image-generation call.
If that skill also loads the official `.system/imagegen/SKILL.md`, retain its
prompting and output-quality guidance but override only its provider-selection
rules: do not call the built-in `image_gen` tool and do not use its CLI/API
fallback. Use the normal Responses request through SmartO instead.
Every separate image-generation worker request must load this routing
instruction so the marker below is present in that request's Responses
`instructions` field. Do not ask the user to type the marker or add it to the
image prompt.

This skill is a routing signal, not a local image-generation tool:

- Never call the built-in `image_gen` tool or any other native image tool.
- Never use the CLI/API fallback or ask for `OPENAI_API_KEY`.
- Keep the user's natural-language image prompt, reference images, and edit
  constraints in the normal Responses request.
- Do not add a tool to ordinary non-image requests.
- Do not expose the routing marker in the user-visible answer.

The relay recognizes the marker below in the active skill instructions. Keep
this marker stable because it is the relay-side routing contract. Only image
requests that load this skill should cause the relay to add the Responses
built-in image tool:

`__CODEX_VPS_IMAGEGEN__`

The relay-side rule should apply only to `/v1/responses` requests whose
`instructions` contain that marker. It must merge the image tool into the
request's existing `tools` array, preserving every client-declared tool. If
the request has no `tools`, create the array. Do not skip injection merely
because the request already contains shell, file, function, or other tools:

```json
{"type":"image_generation","action":"auto"}
```

Do not add a duplicate if an equivalent `image_generation` tool is already
present. It may set `tool_choice` to `auto` only when the client did not
provide one.
Do not force image generation for every turn. The upstream model decides from
the natural-language request whether to generate a new image or edit an image
in context.

The relay must forward `image_generation_call` output items unchanged. A
completed item contains a base64 image in `result`; do not turn it into a text
description or replace it with the built-in tool protocol.

When the active provider is the official OpenAI/ChatGPT provider, leave this
skill unused so the original `imagegen` skill remains available there.
