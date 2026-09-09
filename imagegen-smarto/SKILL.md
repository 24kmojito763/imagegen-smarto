---
name: imagegen-smarto
description: Use the active SmartO relay to actually create or edit images. Trigger immediately for any request to create, draw, generate, modify, transform, or redesign a picture, including text-to-image (文生图), image-to-image (图生图), and image generation inside another workflow. Do not trigger for viewing, analyzing, describing, or recognizing an existing image, or for ordinary non-image tasks.
---

# SmartO image generation

When this skill triggers, execute the installed `imagegen-smarto` command. The
command is the image-generation entry point: it sends the request to the active
Codex provider, adds the SmartO marker internally, keeps streaming enabled, and
saves the returned image locally. Do not stop after reading this file and do
not try to change the outer Codex request yourself.

For a text-to-image request, run:

```sh
imagegen-smarto generate --prompt "<the user's complete image prompt>"
```

Preserve the user's complete prompt and edit instructions. For image-to-image
requests, pass each available reference image as `--image <absolute-path>`.
The command can be repeated for multiple requested outputs.

After the command succeeds, use every printed `IMAGE_MARKDOWN=...` line in the
response so the generated file is displayed as an image. Do not replace the
image with a textual description. If the command fails, report its actual error
instead of claiming that an image was generated.
