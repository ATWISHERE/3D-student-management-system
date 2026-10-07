import cv2
import numpy as np
import json

img_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791182026221.png"
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
    
    points = []
    for cnt in contours:
        # Simplify contour to remove excessive points
        epsilon = 0.01 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        for p in approx:
            x, y = p[0]
            nx = (x - a['cx']) / (a['w'] / 2)
            ny = -(y - a['cy']) / (a['h'] / 2)
            points.append([round(float(nx), 3), round(float(ny), 3)])
            
        # Close the contour
        if len(approx) > 0:
            x, y = approx[0][0]
            nx = (x - a['cx']) / (a['w'] / 2)
            ny = -(y - a['cy']) / (a['h'] / 2)
            points.append([round(float(nx), 3), round(float(ny), 3)])
            
    output_shapes[names[idx]] = points

with open("extracted_shapes.json", "w") as f:
    json.dump(output_shapes, f, indent=2)

print("Extraction complete.")
