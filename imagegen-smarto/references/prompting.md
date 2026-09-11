# Image prompting

Shape the user's request into a concise production-oriented specification.
Use only the lines that improve the request; the schema is scaffolding, not a
form that must always be filled.

## Specificity

- If the prompt is already detailed, preserve it and only normalize its order
  and wording.
- If the prompt is generic, add tasteful composition, framing, intended-use,
  polish, or scene detail when it materially improves the output.
- Do not invent extra characters, props, brands, slogans, palettes, or story
  beats. Do not choose arbitrary left/right placement without layout context.
- Keep exact user constraints and requested text unchanged.

## Prompt structure

For complex requests, use short labeled lines in this order:

```text
Use case: <taxonomy slug>
Asset type: <where the image will be used> (optional)
Primary request: <the user's main request>
Input images: <Image 1: role; Image 2: role> (optional)
Scene/backdrop: <environment>
Subject: <main subject and important details>
Style/medium: <photo, illustration, 3D, etc.>
Composition/framing: <viewpoint, crop, placement, negative space>
Lighting/mood: <lighting and atmosphere>
Color palette: <requested or implied palette>
Materials/textures: <important surface detail>
Text (verbatim): "<exact text>"
Constraints: <must preserve and must include>
Avoid: <negative constraints>
```

Simple requests can remain short. Add only the fields needed to clarify the
result.

## Use-case taxonomy

Generation:

- `photorealistic-natural`: candid or editorial scenes with natural lighting
  and real texture.
- `product-mockup`: product, packaging, catalog, or merchandise imagery.
- `ui-mockup`: practical app or web interface imagery at a stated fidelity.
- `infographic-diagram`: structured diagrams with explicit layout and labels.
- `scientific-educational`: accurate teaching visuals for a named audience.
- `ads-marketing`: campaign imagery with audience, positioning, and exact copy.
- `productivity-visual`: slides, charts, workflows, and business visuals.
- `logo-brand`: simple, scalable mark exploration with a strong silhouette.
- `illustration-story`: comics, children's art, and narrative scenes.
- `stylized-concept`: style-driven concept art or rendered scenes.
- `historical-scene`: period-specific scenes requiring factual accuracy.

Editing:

- `text-localization`: replace only in-image text and preserve layout.
- `identity-preserve`: preserve face, body, pose, hair, and expression.
- `precise-object-edit`: replace or remove a named element only.
- `lighting-weather`: change environmental conditions while preserving content.
- `background-extraction`: create a clean transparent-background cutout.
- `style-transfer`: apply reference style without introducing extra elements.
- `compositing`: combine indexed inputs with matched scale, light, perspective.
- `sketch-to-render`: preserve layout, proportions, and perspective.

## Composition and realism

- Specify framing and viewpoint only when useful: close-up, full body, wide,
  eye-level, low-angle, top-down.
- Call out negative space when the image must leave room for UI or copy.
- For people, clarify body framing, gaze, pose, and object interactions when
  they matter.
- For photorealism, explicitly request photorealism and concrete natural detail
  such as skin texture, fabric wear, material grain, and imperfect surfaces.

## Edits and references

- Label every supplied image by index and role: edit target, style reference,
  composition reference, or compositing input.
- For edits, use `change only X; keep Y unchanged` and list all invariants.
- For compositing, state what moves from each indexed image and require matched
  lighting, perspective, and scale.
- Repeat invariants on every edit iteration to reduce drift.

## Text in images

- Quote exact text, require verbatim rendering, and specify typography and
  placement when those details matter.
- Spell uncommon words letter by letter when accuracy is critical.
- Require no extra characters or text beyond the supplied copy.

## Iteration

Start with a clean base prompt. Inspect the result against subject, style,
composition, exact text, invariants, and avoid items. Refine with one targeted
change at a time instead of rewriting unrelated parts of the prompt.
