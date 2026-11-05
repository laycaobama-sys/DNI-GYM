# DNI GYM · Guía de vídeos e imágenes (Google Flow / Veo)

Estilo de marca: **negro y grafito con naranja solar `#ff6b1a`**, fotografía en blanco y negro de alto contraste con toques naranjas, luz dura lateral, grano fino, sensación premium y deportiva. Tipografía de titulares: **Barlow Condensed ExtraBold Italic** (mayúsculas); texto: **Inter**.

> Sube el resultado a `public/brand/` con estos nombres y vuelve a desplegar. La portada usa el vídeo automáticamente si existe `public/brand/hero.mp4` (si no, muestra la foto `hero.webp`).

## 1. Vídeo de portada (hero) — `public/brand/hero.mp4`

- Herramienta: **Google Flow → Veo** · 16:9 · 8 s · sin audio · bucle.
- Exportación: MP4 H.264, 1920×1080 (o 1280×720), **menos de 4 MB** (comprime con HandBrake, calidad RF 26–28).

Prompt (pégalo tal cual):

```
Cinematic slow-motion close-up of an athletic man performing a heavy barbell back squat in a dark industrial gym, black and white high-contrast photography style with a subtle warm orange rim light (#ff6b1a) from the left, chalk dust floating in the air, shallow depth of field, steady locked-off camera with a very slow push-in, moody premium sports commercial look, fine film grain, no text, no logos, seamless loop, 8 seconds.
```

Variante mujer (para alternar o para el anuncio):

```
Cinematic slow-motion shot of an athletic woman doing kettlebell swings in a dark minimalist gym, black and white high-contrast look with warm orange rim light (#ff6b1a), sweat and chalk particles catching the light, shallow depth of field, slow dolly movement, premium sports brand commercial, film grain, no text, no logos, 8 seconds.
```

## 2. Anuncio vertical para redes — 9:16, 15–20 s (3 planos de Veo unidos)

1. `Close-up of a smartphone screen in a dark gym showing a fitness app with an orange progress ring filling up, hand holding the phone, shallow depth of field, cinematic, 5 seconds.`
2. `Athletic person finishing a set of dumbbell bench press, racking the weights and smiling, black and white with orange rim light, slow motion, 5 seconds.`
3. `Overhead shot of a person tying training shoes on a dark gym floor next to a water bottle and a phone, orange light accent, cinematic, 5 seconds.`

Texto para montar encima (en Flow o CapCut): «TU ENTRENADOR PERSONAL» → «CON IA» → «GRATIS» → logo DNI GYM + `dni-gym…workers.dev`.

## 3. Imágenes (Flow → Imagen / Nano Banana)

Formato 4:5 (900×1100) para portada y 3:2 (900×600) para programas. Guarda como WebP.

- **Portada** `hero.webp`: `Black and white high-contrast portrait of a muscular athlete holding a weight plate in a dark gym, warm orange rim light from the left, premium sports photography, film grain, negative space on the left for text.`
- **Coach IA** (opcional, sección del coach): `Athletic person in a dark gym looking at a smartphone with a soft orange glow on the face, cinematic, black and white with orange accent light, premium, shallow depth of field.`
- **Programas** `p-<slug>.webp`: `Black and white high-contrast photo of <ejercicio en inglés, p. ej. "a woman doing hip thrusts">, dark gym, orange rim light, premium sports photography, film grain.`

## 4. Reglas

- Nada de logos de otras marcas, ni texto dentro de la imagen.
- Personas diversas (hombres, mujeres, distintas edades) para que todo el mundo se vea reflejado.
- No uses resultados «antes/después» falsos ni cifras inventadas.
