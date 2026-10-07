import json
import re

with open("src/shapes.js", "r") as f:
    content = f.read()

# We need to find all arrays of coordinates and duplicate inner points
# e.g., [A, B, C] -> [A, B, B, C, C, A] (if it's a closed loop)

def replace_array(match):
    points_str = match.group(1)
    # Find all [x, y]
    points = re.findall(r'\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]', points_str)
    
    if not points:
        return match.group(0)
    
    new_points = []
    for i in range(len(points) - 1):
        new_points.append(f"[{points[i][0]}, {points[i][1]}]")
        new_points.append(f"[{points[i+1][0]}, {points[i+1][1]}]")
        
    # Close loop? The original shapes seemed to explicitly close if they wanted to.
    
    res = "[\n    " + ", ".join(new_points) + "\n  ]"
    return res

new_content = re.sub(r'\[\s*(\[.*?\])\s*\]', replace_array, content, flags=re.DOTALL)

with open("src/shapes.js", "w") as f:
    f.write(new_content)

print("Converted original shapes to segment pairs.")
