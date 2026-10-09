#!/usr/bin/env bash
# Encodes one theme's animated logo for the island's app-icon tile and the
# Home intro card.
#
#   scripts/encode-logo.sh dark|light path/to/logo-master.mp4
#
# Expects a square master showing the whole app icon: the rounded container
# filling the frame, pure black outside its corners, first and last frames
# matching so it can rest on either. It measures the container colour, fills
# the black corners with it (the page clips the tile to its own radius, and
# the intro card shows the clip on a container-coloured card), speeds the
# clip up just enough that one play lasts at most 4.9s (WCAG 2.2.2: motion
# that starts by itself and runs longer than 5s needs a pause control) and
# writes to public/brand/:
#
#   logo-<theme>.webm / .mp4 / -poster.webp                   144px, island tile
#   logo-intro-<theme>.webm / .mp4 / -poster.webp             640px, intro card
#
# The printed container colour is that theme's --logo-tile in tokens.css.
# AV1 WebM first; H.264 MP4 for browsers without AV1 (most Safari). No audio.
# Posters are WebP (the intro's is Home's LCP image while it plays), written
# by sharp, which Astro installs. Needs ffmpeg with libsvtav1 and libx264,
# python3, and node_modules.
set -euo pipefail

THEME="${1:?usage: scripts/encode-logo.sh dark|light <master.mp4>}"
SRC="${2:?usage: scripts/encode-logo.sh dark|light <master.mp4>}"
[[ $THEME == dark || $THEME == light ]] || { echo "theme must be dark or light" >&2; exit 1; }
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/brand"
mkdir -p "$OUT"

read -r W H FRAMES FPS < <(ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=width,height,nb_read_frames,r_frame_rate -of csv=p=0 "$SRC" |
  awk -F, '{ split($3, r, "/"); print $1, $2, $4, r[1] / (r[2] ? r[2] : 1) }')
[[ $W == "$H" ]] || { echo "master must be square (${W}x${H})" >&2; exit 1; }

# Container colour: the mean, over all frames, of points just inside the
# middle of each edge (clear of the mark and its glow), on a 270px proxy.
read -r BG_R BG_G BG_B < <(
  ffmpeg -v error -i "$SRC" -vf "scale=270:270" -f rawvideo -pix_fmt rgb24 - |
    python3 -c '
import sys
P, inset = 270, 11
data = sys.stdin.buffer.read()
points = [(P // 2, inset), (inset, P // 2), (P // 2, P - 1 - inset), (P - 1 - inset, P // 2)]
sums, n = [0, 0, 0], 0
for f in range(len(data) // (P * P * 3)):
    for x, y in points:
        o = (f * P * P + y * P + x) * 3
        for c in range(3):
            sums[c] += data[o + c]
        n += 1
print(*(round(s / n) for s in sums))
'
)

DURATION=$(python3 -c "print($FRAMES / $FPS)")
SPEED=$(python3 -c "print(max(1.0, $DURATION / 4.9))")
printf 'master %sx%s, %ss; speed %sx; container #%02x%02x%02x (--logo-tile, %s)\n' \
  "$W" "$H" "$DURATION" "$SPEED" "$BG_R" "$BG_G" "$BG_B" "$THEME"

# Corner fill. Only near the corners and within 5% of the edges (never the
# mark): a pixel there is container blended with black, so its brightness
# relative to the container's is its coverage, and the rest is container:
#   out = in + container × (1 − coverage)
L="(0.2126*r(X,Y)+0.7152*g(X,Y)+0.0722*b(X,Y))"
LC=$(python3 -c "print(0.2126 * $BG_R + 0.7152 * $BG_G + 0.0722 * $BG_B)")
DX="max(max(0.2*W-X,X-0.8*W),0)"
DY="max(max(0.2*H-Y,Y-0.8*H),0)"
FILL="gt(hypot($DX,$DY),0.15*W)*(1-min($L/$LC,1))"
CORNERS="format=rgb24,geq=r='r(X,Y)+$BG_R*$FILL':g='g(X,Y)+$BG_G*$FILL':b='b(X,Y)+$BG_B*$FILL'"

encode() { # name size av1-crf h264-crf
  local name=$1 size=$2
  local vf="setpts=PTS/$SPEED,fps=30,$CORNERS,scale=$size:$size:flags=lanczos,format=yuv420p"
  ffmpeg -v error -y -i "$SRC" -an -vf "$vf" \
    -c:v libsvtav1 -crf "$3" -preset 4 -svtav1-params tune=0 "$OUT/$name.webm" 2>/dev/null
  ffmpeg -v error -y -i "$SRC" -an -vf "$vf" \
    -c:v libx264 -crf "$4" -preset veryslow -profile:v high -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y -i "$SRC" \
    -vf "select='eq(n\,0)',$CORNERS,scale=$size:$size:flags=lanczos" \
    -frames:v 1 -f image2pipe -c:v png - |
    node -e 'require("sharp")(require("fs").readFileSync(0)).webp({ quality: 82 }).toFile(process.argv[1])' \
      "$OUT/$name-poster.webp" >/dev/null
}

encode "logo-$THEME" 144 34 22
encode "logo-intro-$THEME" 640 38 24

ls -l "$OUT"/logo*"$THEME"*
