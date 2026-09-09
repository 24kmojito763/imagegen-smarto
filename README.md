# imagegen-smarto

Codex skill for sending natural-language image generation and editing requests
through a custom SmartO OpenAI-compatible VPS relay.

The skill does not call Codex's built-in `image_gen` tool. It places a private
routing marker in the Responses instructions; the relay adds its
`image_generation` tool for requests that load this skill, merging it with
existing function, shell, file, or other tools. Ordinary non-image requests
remain unchanged.

When the SmartO profile is active, this skill can also replace only the image
provider inside workflows that normally use `$imagegen`, including the
official `hatch-pet` workflow. The workflow's prompts, references, QA, and
file handling remain unchanged; only image generation is routed through
SmartO.

## Install with npm

The recommended installation is the same on Windows, Linux, and macOS:

```bash
npm install --global imagegen-smarto
```

The npm postinstall step copies the skill to `CODEX_HOME/skills/imagegen-smarto`
or, when `CODEX_HOME` is not set, `~/.codex/skills/imagegen-smarto`.

To reinstall or update the skill without reinstalling the npm package:

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

After installation, use a profile that enables `imagegen-smarto` and disables
the official `imagegen` skill. The skill is configured for implicit invocation,
so an image request can be written in natural language without first typing
`$imagegen-smarto`.

## Local profile switch

The two profiles used by the author are:

```bash
codex --profile smarto
codex --profile official
```

`smarto` selects the custom relay and enables this skill. `official` selects
the built-in OpenAI provider and enables Codex's original `imagegen` skill.
