#!/bin/bash
rm images/*.png
cd svg
for file in $(ls *.svg); do
  filename=${file%%.svg}
  echo "Rasterizing $filename..."

  convert \
    -density 1200 \
    -resize 18x18 \
    -background none \
    $file ../images/$filename.png

  convert \
    -density 1200 \
    -resize 36x36 \
    -background none \
    $file ../images/$filename@2x.png

done
