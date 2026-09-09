# imagegen-smarto

Codex skill for sending natural-language image generation and editing requests
through a custom SmartO OpenAI-compatible VPS relay.

The skill does not call Codex's built-in `image_gen` tool. It places a private
routing marker in the Responses instructions; the relay adds its
`image_generation` tool only for requests that load this skill. Ordinary
non-image requests remain unchanged.

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
