import re

with open('src/shapes.js', 'r') as f:
    content = f.read()

# We need to find where === NON-LIVING === starts and remove everything before it inside the object
non_living_idx = content.find('// === NON-LIVING ===')

if non_living_idx != -1:
    header = "export const SHAPES = {\n"
    new_content = header + "  " + content[non_living_idx:]
    with open('src/shapes.js', 'w') as f:
        f.write(new_content)
    print("Successfully removed living things.")
else:
    print("NON-LIVING section not found.")
