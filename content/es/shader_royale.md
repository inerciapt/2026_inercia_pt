---
title: "Shader Royale"
summary: "Participa en el mayor evento de programación simultánea de shaders del mundo"
---
>


### Bonzomatic

El evento Shader Royale utiliza la versión en red más reciente del programa Bonzomatic. Puedes descargarlo a través de estos enlaces:

* https://github.com/wrightwriter/Bonzomatic-Compute/releases/tag/v1.0.1 - Versión más reciente
* https://github.com/TheNuSan/Bonzomatic/releases/tag/v13 - Aún puedes utilizar la versión de Nusan, sin soporte de compute shaders pero es retrocompatible

Solo necesitas extraer los ficheros del archivo.

Para los usuarios de MacOS y Linux: Desafortunadamente no hay un build oficial para estas plataformas, tienes que compilarlo desde el código fuente. No te olvides de copiar también las fuentes y texturas del build de Windows y colocarlas en el directorio correcto. No hay garantías de estabilidad en estas plataformas, pequeñas diferencias en los compiladores de shader entre las plataformas a veces son la fuente de problemas.

### Instalar Texturas Extra

Un paquete con texturas extra para esta sesión está disponible en [Inercia2026Textures.zip](/Inercia2026Textures.zip).

Copia los contenidos del directorio `textures` al directorio del mismo nombre del Bonzomatic. Debería parecerse a algo así:
```
            C:\Path\to\Bonzomatic
            textures\
                checker.png
                noise.png
                tex1.jpg
                [...]
                Inercia2026.png
                InerciaID.png
                InerciaBW.png
```
          
Dentro del directorio del Bonzomatic actualiza el `config.json` para añadir las referencias a las nuevas texturas, debería parecerse a algo así:
```
          [...]
          "textures": {
              "texChecker": "textures/checker.png",
              "texNoise": "textures/noise.png",
              "texTex1": "textures/tex1.jpg",
              "texTex2": "textures/tex2.jpg",
              "texTex3": "textures/tex3.jpg",
              "texTex4": "textures/tex4.jpg",
              "texInercia2026": "textures/Inercia2026.png",
              "texInerciaID": "textures/InerciaID.png",
              "texInerciaBW": "textures/InerciaBW.png"
            },
            [...]
```

Borra o renombra el fichero `shader.glsl` si existe en tu directorio del Bonzomatic y ejecuta el programa. Deberías tener unas nuevas referencias uniform de texturas listadas en la parte superior: `texInercia2026`, `texInerciaID` y `texInerciaBW`.

Puedes utilizar el código de ejemplo de `testTexture.glsl` para validar que las texturas están funcionando. El código también incluye una función getTexture que redimensiona la textura al aspecto ratio correcto e invierte el eje de las Y.

```
            vec4 getTexture(sampler2D sampler, vec2 uv){
                vec2 size = textureSize(sampler,0);
                float ratio = size.x/size.y;
                return texture(sampler,uv*vec2(1.,-1.*ratio)-.5);
            }
```

### Cómo conectar durante el evento

Ejecuta Bonzomatic.exe, la ventana debería abrirse pidiendo configuraciones. En el panel de Network tienes que garantizar que:

* estás en modo SENDER
* Server: ws://drone.alkama.com:9000
* Room: inercia2026
* Nickname: {tu apodo}
* Haz clic en Run

Si estás en MacOs o Linux tienes que actualizar el config.json para cambiar el parámetro serverUrl a: `ws://drone.alkama.com:9000/inercia2026/{tuhandle}`

Cuando la ventana de código del Bonzomatic se abre verifica si tienes o no un bloque rojo al lado de tu nombre, tener el bloque rojo indica problemas de conexión al servidor.

### Resolución de conflictos

Ya ha ocurrido en el pasado a veces el servicio de DNS no estar funcionando debidamente, en alternativa a conectarte a `ws://drone.alkama.com:9000` puedes intentar conectar directamente a `ws://37.187.21.171:9000` para testear si ese es el problema.

Para más ayuda contacta con `psenough` en el discord.
