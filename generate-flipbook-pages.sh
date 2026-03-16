#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./generate-flipbook-pages.sh INPUT_DIR OUTPUT_DIR

Converts every PDF in INPUT_DIR into 300 ppi JPEG pages for the flipbook viewer.
Each PDF is written into its own subdirectory under OUTPUT_DIR.

Example:
  ./generate-flipbook-pages.sh . ./src/flipbook

Output layout:
  OUTPUT_DIR/
    my-book-pages/
      page-000.jpg
      page-001.jpg
      ...
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 2 ]]; then
  usage >&2
  exit 1
fi

input_dir=$1
output_dir=$2

if [[ ! -d "$input_dir" ]]; then
  echo "Input directory not found: $input_dir" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick 'magick' is required but was not found in PATH." >&2
  exit 1
fi

mkdir -p "$output_dir"

shopt -s nullglob
pdfs=("$input_dir"/*.pdf "$input_dir"/*.PDF)
shopt -u nullglob

if [[ ${#pdfs[@]} -eq 0 ]]; then
  echo "No PDF files found in: $input_dir" >&2
  exit 1
fi

slugify() {
  local value
  value=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  value=$(printf '%s' "$value" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
  printf '%s' "${value:-flipbook}"
}

for pdf_path in "${pdfs[@]}"; do
  pdf_name=$(basename "$pdf_path")
  pdf_stem=${pdf_name%.*}
  target_dir="$output_dir/$(slugify "$pdf_stem")-pages"

  rm -rf "$target_dir"
  mkdir -p "$target_dir"

  echo "Rendering $pdf_name -> $target_dir"

  magick \
    -density 300 \
    "$pdf_path" \
    -background white \
    -alpha remove \
    -alpha off \
    -colorspace sRGB \
    -quality 88 \
    "$target_dir/page-%03d.jpg"
done

echo "Done. Generated ${#pdfs[@]} flipbook page set(s) in $output_dir"