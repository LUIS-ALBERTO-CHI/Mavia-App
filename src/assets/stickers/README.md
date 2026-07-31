# Stickers personalizados 🐱

Los stickers se organizan **por categoría = subcarpeta**. Cada subcarpeta
se vuelve una **pestaña** en el selector de la app. Se detectan solos, sin tocar código.

```
src/assets/stickers/
├── gatos/        → pestaña "Gatos"
│   ├── gato-01.png
│   └── ...
├── rutina/       → pestaña "Rutina"
│   ├── cafe.png
│   └── ...
└── (nueva carpeta) → pestaña con ese nombre
```

## Cómo agregar una categoría nueva (ej. capibaras)
1. Crea la carpeta `src/assets/stickers/capibaras/`.
2. Suelta ahí tus PNG (aunque tengan nombre feo de ChatGPT).
3. Pídeme correr:  `bash scripts/rename-stickers.sh capibaras`
   → quedan `capibara-01.png, capibara-02.png…` y los optimizo.
4. Recarga la app: aparece la pestaña "Capibaras".

## Especificaciones de cada PNG
- **Tamaño:** 256 × 256 px (cuadrado). Los verticales también sirven (se centran).
- **Formato:** PNG con **fondo transparente**.
- **Aire:** ~10 % de margen alrededor del dibujo.
- **Nombre = etiqueta:** minúsculas con guiones. `cafe.png`→"Cafe", `lista-tareas.png`→"Lista Tareas".

## Notas
- Nombres **únicos** entre todas las categorías (no repitas `cafe.png` en dos carpetas).
- Archivos sueltos en la raíz (fuera de subcarpeta) caen en la categoría "Otros".
