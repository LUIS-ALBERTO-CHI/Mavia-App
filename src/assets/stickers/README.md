# Stickers personalizados 🐱

Suelta aquí tus PNG y aparecen **solos** en el selector de stickers de la app.
No hay que tocar código.

## Especificaciones
- **Tamaño:** 256 × 256 px (cuadrado).
- **Formato:** PNG con **fondo transparente**.
- **Aire:** deja ~10 % de margen alrededor del dibujo (que no toque los bordes).
- **Nombre del archivo = id + etiqueta:** minúsculas con guiones.

## Ejemplos de nombre
| Archivo              | Aparece como |
|----------------------|--------------|
| `gato-feliz.png`     | Gato Feliz   |
| `dinero.png`         | Dinero       |
| `junta-cliente.png`  | Junta Cliente|
| `campana.png`        | Campana      |

## Notas
- Los personalizados salen **primero** en el selector, antes del set base.
- Si nombras un PNG igual que uno base (ej. `cat.png`), el tuyo **reemplaza** al SVG.
- Tras agregar/quitar archivos, recarga la app (en dev, Vite recompila solo).
