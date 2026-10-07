import glob
import easyocr
import sys
import os

reader = easyocr.Reader(['en'])
files = glob.glob(r'C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\*.png')

with open('ocr_scan.txt', 'w', encoding='utf-8') as f:
    for file in files:
        f.write(f"\n--- {os.path.basename(file)} ---\n")
        try:
            result = reader.readtext(file, detail=0)
            f.write(str(result) + "\n")
        except Exception as e:
            f.write(f"Error: {e}\n")
