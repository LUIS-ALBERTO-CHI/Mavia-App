#!/usr/bin/env bash
# Renombra los PNG "crudos" (nombres de ChatGPT/descarga con espacios,
# comas o parentesis) dentro de una CATEGORIA a  <prefijo>-01.png, -02.png, ...
# Los que ya estan limpios NO se tocan y la numeracion CONTINUA.
#
# Uso:
#   bash scripts/rename-stickers.sh gatos           # carpeta stickers/gatos, prefijo "gatos"->"gato"? no: prefijo = "gatos"
#   bash scripts/rename-stickers.sh gatos gato      # carpeta stickers/gatos, prefijo "gato"
set -euo pipefail

CAT="${1:?Falta la categoria (ej: gatos). Uso: rename-stickers.sh <categoria> [prefijo]}"
PREFIX="${2:-$CAT}"
DEST="src/assets/stickers/$CAT"

[ -d "$DEST" ] || { echo "No existe la carpeta $DEST — creala y suelta ahi los PNG."; exit 1; }

# "limpio" = solo minusculas, numeros y guiones (ej. gato-01.png, cafe.png)
is_clean() { [[ "$1" =~ ^[a-z0-9]+(-[a-z0-9]+)*\.png$ ]]; }

mapfile -t messy < <(
  find "$DEST" -maxdepth 1 -type f -iname '*.png' -printf '%f\n' \
    | while IFS= read -r name; do is_clean "$name" || printf '%s\n' "$name"; done \
    | sort -V
)

if [ "${#messy[@]}" -eq 0 ]; then
  echo "No hay PNG nuevos por renombrar en $DEST."
  exit 0
fi

# Indice mas alto que ya exista para este prefijo, para continuar
start=0
while IFS= read -r existing; do
  num="${existing#${PREFIX}-}"; num="${num%.png}"
  if [[ "$num" =~ ^[0-9]+$ ]] && (( 10#$num > start )); then start=$((10#$num)); fi
done < <(find "$DEST" -maxdepth 1 -type f -name "${PREFIX}-*.png" -printf '%f\n' 2>/dev/null || true)

# Paso 1: crudos -> temporales (evita colisiones)
n=0
for f in "${messy[@]}"; do
  n=$((n+1))
  mv -f -- "$DEST/$f" "$DEST/__tmp_$n.png"
done

# Paso 2: temporales -> final, continuando la numeracion
i=$start
while IFS= read -r f; do
  i=$((i+1))
  printf -v num "%02d" "$i"
  mv -f -- "$f" "$DEST/$PREFIX-$num.png"
  echo "  $CAT/$PREFIX-$num.png"
done < <(find "$DEST" -maxdepth 1 -type f -name '__tmp_*.png' | sort -V)

echo "Listo: $n sticker(s) en '$CAT' -> $PREFIX-$(printf '%02d' $((start+1))) .. $PREFIX-$(printf '%02d' $i)"
