---
name: imagegen-smarto
description: Use the active SmartO relay to create or edit raster images. Trigger immediately for requests to create, draw, generate, modify, transform, or redesign a picture, including text-to-image (文生图), image-to-image (图生图), and image generation inside another workflow. Do not trigger for viewing, analyzing, describing, or recognizing an existing image, ordinary non-image tasks, or output better produced as SVG or code-native graphics.
---

# SmartO image generation

Use `imagegen-smarto generate` to produce the requested image. The command is
the image-generation tool for this skill; execute it instead of stopping after
reading these instructions.

## Workflow

1. Decide whether this is generation or an edit. Treat supplied images as edit
   inputs only when the user asks to change or combine them; otherwise label
   their reference role in the prompt.
2. Rewrite the user's request into a strong image prompt using
   [references/prompting.md](references/prompting.md). Preserve all explicit
   requirements. Normalize detailed prompts; augment generic prompts only when
   the addition materially improves the result.
3. Generate one requested asset or variant per command:

   ```sh
   imagegen-smarto generate --prompt "<final structured prompt>"
   ```

4. For an edit, add each available source or reference image by absolute path.
   Up to five images may be supplied:

   ```sh
   imagegen-smarto generate --prompt "<final structured edit prompt>" \
     --image /absolute/path/to/input.png
   ```

5. If the user named an output location, pass `--output <path>`. Do not
   overwrite an existing asset unless replacement was explicitly requested.
6. On success, include every printed `IMAGE_MARKDOWN=...` value in the answer
   so Codex displays the generated file. Report the saved path. For a failed
   command, report the actual error and do not claim that an image exists.

For edits, state invariants explicitly in the prompt: `change only X; keep Y
unchanged`. When iterating, make one targeted change and repeat the invariants.
