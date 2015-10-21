#!/bin/bash
rm images/*.png
for file in $(cd svg && ls *.svg); do
  filename=${file%%.svg}
  echo "Rasterizing $filename..."

  convert \
    -density 1200 \
    -resize 18x18 \
    -background none \
    svg/$file images/$filename.png

  convert \
    -density 1200 \
    -resize 36x36 \
    -background none \
    svg/$file images/$filename@2x.png
done

echo 'Creating ICNS...'
convert \
  -density 1200 \
  -resize 1024x1024 \
  -background none \
  svg/menuActive.svg images/DockerMenu.png
mkdir images/DockerMenu.iconset
sips -z 16 16     images/DockerMenu.png --out images/DockerMenu.iconset/icon_16x16.png
sips -z 32 32     images/DockerMenu.png --out images/DockerMenu.iconset/icon_16x16@2x.png
sips -z 32 32     images/DockerMenu.png --out images/DockerMenu.iconset/icon_32x32.png
sips -z 64 64     images/DockerMenu.png --out images/DockerMenu.iconset/icon_32x32@2x.png
sips -z 128 128   images/DockerMenu.png --out images/DockerMenu.iconset/icon_128x128.png
sips -z 256 256   images/DockerMenu.png --out images/DockerMenu.iconset/icon_128x128@2x.png
sips -z 256 256   images/DockerMenu.png --out images/DockerMenu.iconset/icon_256x256.png
sips -z 512 512   images/DockerMenu.png --out images/DockerMenu.iconset/icon_256x256@2x.png
sips -z 512 512   images/DockerMenu.png --out images/DockerMenu.iconset/icon_512x512.png
cp images/DockerMenu.png images/DockerMenu.iconset/icon_512x512@2x.png
iconutil -c icns images/DockerMenu.iconset
rm -R images/DockerMenu.iconset
