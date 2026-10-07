import cv2
import numpy as np
import re
import json

img_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791186516332.png"
img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

# Threshold to get black lines on white bg (binary inverted so lines are white)
_, thresh = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)

# Use Canny to get edges instead of thinning, since headless opencv broke contrib
edges = cv2.Canny(thresh, 50, 150)

# Optional: dilate slightly to bridge small gaps before finding lines
# but HoughLinesP handles gaps with maxLineGap
lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, minLineLength=10, maxLineGap=10)

segments = []
if lines is not None:
    # Find bounding box of the whole skeleton to normalize coordinates
    y_coords, x_coords = np.nonzero(edges)
    min_x, max_x = np.min(x_coords), np.max(x_coords)
    min_y, max_y = np.min(y_coords), np.max(y_coords)
    
    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    w = (max_x - min_x) or 1
    h = (max_y - min_y) or 1
    
    # Scale to [-0.9, 0.9] to leave a little margin
    scale = max(w, h) / 1.8
    
    for line in lines:
        if isinstance(line[0], (list, np.ndarray)):
            x1, y1, x2, y2 = line[0]
        else:
            x1, y1, x2, y2 = line
            
        n1x = (x1 - cx) / scale
        n1y = -(y1 - cy) / scale  # Y axis inverted in 3D usually vs image
        n2x = (x2 - cx) / scale
        n2y = -(y2 - cy) / scale
        
        segments.append(f"[{n1x:.3f}, {n1y:.3f}]")
        segments.append(f"[{n2x:.3f}, {n2y:.3f}]")

# Format into string
segment_str = "[\n    "
for i in range(0, len(segments), 2):
    segment_str += f"{segments[i]}, {segments[i+1]}"
    if i + 2 < len(segments):
        segment_str += ",\n    "
segment_str += "\n  ]"

# Now replace the Elephant key in shapes.js
with open("src/shapes.js", "r") as f:
    content = f.read()

# Replace "Elephant": [ ... ]
pattern = r'("Elephant"\s*:\s*)\[\s*\[.*?\]\s*\]'
new_content = re.sub(pattern, r'\1' + segment_str, content, flags=re.DOTALL)

with open("src/shapes.js", "w") as f:
    f.write(new_content)

print(f"Extracted {len(segments)//2} segments for the new Elephant.")
