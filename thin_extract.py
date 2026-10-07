import cv2
import numpy as np
import json

img_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791182026221.png"
img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
_, thresh = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)

# Thinning to get 1px wide lines
skeleton = cv2.ximgproc.thinning(thresh)

# Because thinning might break lines, we dilate slightly before finding connected components
kernel = np.ones((3,3), np.uint8)
dilated = cv2.dilate(skeleton, kernel, iterations=1)

num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dilated, connectivity=8)

animals = []
for i in range(1, num_labels):
    if stats[i, cv2.CC_STAT_AREA] > 100:
        animals.append(i)

animal_info = []
for a in animals:
    x = stats[a, cv2.CC_STAT_LEFT]
    y = stats[a, cv2.CC_STAT_TOP]
    w = stats[a, cv2.CC_STAT_WIDTH]
    h = stats[a, cv2.CC_STAT_HEIGHT]
    animal_info.append({'id': a, 'x': x, 'y': y, 'w': w, 'h': h, 'cx': x + w/2, 'cy': y + h/2})

animal_info.sort(key=lambda a: (a['cy'] // 250, a['cx']))

names = ["Wolf", "Pig", "Goose", "Crab", "Llama", "Butterfly", "Rabbit", "Bear", "Flamingo", "Elephant", "Fox", "Bird", "Squirrel", "Goat"]

output_shapes = {}

for idx, a in enumerate(animal_info):
    if idx >= len(names): break
    
    mask = (labels == a['id']).astype(np.uint8)
    animal_skel = cv2.bitwise_and(skeleton, skeleton, mask=mask)
    
    lines = cv2.HoughLinesP(animal_skel, 1, np.pi/180, threshold=15, minLineLength=15, maxLineGap=15)
    
    segments = []
    if lines is not None:
        for line in lines:
            if isinstance(line[0], (list, np.ndarray)):
                x1, y1, x2, y2 = line[0]
            else:
                x1, y1, x2, y2 = line
                
            n1x = (x1 - a['cx']) / (a['w'] / 2)
            n1y = -(y1 - a['cy']) / (a['h'] / 2)
            n2x = (x2 - a['cx']) / (a['w'] / 2)
            n2y = -(y2 - a['cy']) / (a['h'] / 2)
            segments.append([round(float(n1x), 3), round(float(n1y), 3)])
            segments.append([round(float(n2x), 3), round(float(n2y), 3)])
            
    output_shapes[names[idx]] = segments

with open("src/shapes.js", "w") as f:
    f.write("export const SHAPES = {\n")
    for name, pts in output_shapes.items():
        f.write(f'  "{name}": [\n')
        for i in range(0, len(pts), 2):
            if i + 1 < len(pts):
                f.write(f'    [{pts[i][0]}, {pts[i][1]}], [{pts[i+1][0]}, {pts[i+1][1]}],\n')
        f.write("  ],\n")
    f.write("};\n")

print("Generated clean skeletonized shapes.js")
