import json
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from PIL import Image

# Read image
img_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791182026221.png"
img = Image.open(img_path)
width, height = img.size

shapes = {
  "Wolf": [
    [-0.9, 0.4], [-0.7, 0.5], [-0.8, 0.3], [-0.9, 0.4], [-0.7, 0.5], [-0.6, 0.7], [-0.5, 0.9], [-0.4, 0.7], [-0.6, 0.7], [-0.5, 0.1], [-0.8, 0.3], [-0.5, 0.1], [-0.4, -0.1], [-0.5, -0.6], [-0.4, -0.6], [-0.2, -0.1], [-0.4, -0.1], [-0.5, 0.1], [0.3, 0.7], [-0.4, 0.7], [0.3, 0.7], [0.4, 0.5], [0.5, 0.1], [0.9, 0.1], [0.6, -0.1], [0.5, 0.1], [0.4, 0.5], [0.1, -0.1], [0.1, -0.6], [0.2, -0.6], [0.3, -0.1], [0.4, 0.5], [0.3, 0.7], [-0.2, -0.1], [0.1, -0.1], [0.3, -0.1]
  ]
}

# The image has 14 animals.
# Wolf is top-left. Let's map coordinates:
# Let's just plot the wolf on top of the image to see how it aligns.
fig, ax = plt.subplots(figsize=(10, 8))
ax.imshow(img)

wolf = shapes["Wolf"]
# Wolf center in image might be around (width*0.15, height*0.15)
# Let's scale and translate
x_pts = []
y_pts = []
for p in wolf:
    x_pts.append(p[0] * 100 + width * 0.18)
    y_pts.append(-p[1] * 100 + height * 0.2)

ax.plot(x_pts, y_pts, 'r-', linewidth=2)
plt.savefig('overlay.png')
print("Overlay saved")
