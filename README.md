# imagegen-smarto

Codex skill for natural-language image generation and editing through a custom
SmartO OpenAI-compatible VPS relay.

It implicitly handles requests to create, draw, generate, modify, perform
image-to-image, or perform text-to-image generation. Requests to view,
analyze, describe, or recognize an image remain ordinary requests.

## Install with npm

The recommended installation is the same on Windows, Linux, and macOS:

```bash
npm install --global imagegen-smarto
```

The npm postinstall step copies the skill to `CODEX_HOME/skills/imagegen-smarto`
or, when `CODEX_HOME` is not set, `~/.codex/skills/imagegen-smarto`.

To update to the latest published package:

```bash
npm install --global imagegen-smarto
```

To recopy the skill from the already installed npm package:

```bash
imagegen-smarto install
```

To print the target directory:

```bash
imagegen-smarto path
```

If npm lifecycle scripts are disabled, run `imagegen-smarto install` once after
the global npm installation.

## Uninstall globally

Remove the Codex skill first, then remove the npm package:

```bash
imagegen-smarto uninstall
npm uninstall --global imagegen-smarto
```

The uninstall command removes only
`CODEX_HOME/skills/imagegen-smarto` (or `~/.codex/skills/imagegen-smarto` when
`CODEX_HOME` is not set). It does not remove other Codex skills.

If the npm package has already been removed, delete the skill directory
manually:

Linux/macOS:

```bash
rm -rf ~/.codex/skills/imagegen-smarto
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\skills\imagegen-smarto"
```

When using a custom `CODEX_HOME`, replace `~/.codex` or
`%USERPROFILE%\.codex` with that directory.

## Install with the Codex installer

The preinstalled Codex skill installer remains available as a fallback:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo 24kmojito763/imagegen-smarto \
  --path imagegen-smarto \
  --method git
```

After installation, use the profile that points requests to SmartO. The skill
is configured for implicit invocation, so an image request can be written in
natural language without first typing `$imagegen-smarto`.

## Image generation workflow

When the skill is triggered, Codex first turns the request into the same kind
of structured, production-oriented prompt used by the official image skill.
Detailed prompts are preserved and normalized; generic prompts receive only
useful composition or presentation detail. Edits explicitly lock the parts
that must remain unchanged.

Codex then runs the installed `imagegen-smarto` command. The command uses the
active SmartO provider and credential, saves the returned PNG locally, and
prints an absolute `IMAGE_MARKDOWN=...` line so Codex can display it inline.

You can also test the execution path directly:

```bash
imagegen-smarto generate --prompt "一只戴红色围巾的小猫，儿童绘本风格"
```

For editing, add one or more reference images:

```bash
imagegen-smarto generate \
  --prompt "把背景改成海边日落，保留主体" \
  --image /absolute/path/to/source.png
```

The command handles its relay protocol internally; the skill only prepares the
final image prompt, supplies reference-image paths, and consumes the returned
image result.

## Local profile switch

The two profiles used by the author are:

```bash
codex --profile smarto
codex --profile official
```

`smarto` selects the custom relay and enables this skill.
