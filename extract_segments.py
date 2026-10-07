import cv2
import numpy as np
import json

img_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791179765732.png"
img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
_, thresh = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)

num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=8)

animals = []
for i in range(1, num_labels):
    if stats[i, cv2.CC_STAT_AREA] > 1000:
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
    
    mask = (labels == a['id']).astype(np.uint8) * 255
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    segments = []
    for cnt in contours:
        # Increase epsilon to simplify shapes and reduce messy double lines
        epsilon = 0.012 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        for i in range(len(approx)):
            p1 = approx[i][0]
            p2 = approx[(i + 1) % len(approx)][0]
            
            n1x = (p1[0] - a['cx']) / (a['w'] / 2)
            n1y = -(p1[1] - a['cy']) / (a['h'] / 2)
            n2x = (p2[0] - a['cx']) / (a['w'] / 2)
            n2y = -(p2[1] - a['cy']) / (a['h'] / 2)
            
            # Format as segments: two consecutive points make a line
            segments.append([round(float(n1x), 3), round(float(n1y), 3)])
            segments.append([round(float(n2x), 3), round(float(n2y), 3)])
            
    output_shapes[names[idx]] = segments

# Format output nicely
with open("src/shapes.js", "w") as f:
    f.write("export const SHAPES = {\n")
    for name, pts in output_shapes.items():
        f.write(f'  "{name}": [\n')
        # write 2 points per line so it's obvious they are segments
        for i in range(0, len(pts), 2):
            if i + 1 < len(pts):
                f.write(f'    [{pts[i][0]}, {pts[i][1]}], [{pts[i+1][0]}, {pts[i+1][1]}],\n')
        f.write("  ],\n")
    f.write("};\n")

print("Generated segments-based shapes.js")
