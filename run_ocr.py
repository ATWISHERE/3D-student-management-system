import easyocr
import sys

with open('ocr_log.txt', 'w', encoding='utf-8') as f:
    try:
        old_stdout = sys.stdout
        sys.stdout = f
        reader = easyocr.Reader(['en'])
        result = reader.readtext(r'C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.user_uploaded\media_1791182026221.png', detail=0)
        sys.stdout = old_stdout
        with open('ocr_result.txt', 'w', encoding='utf-8') as f2:
            f2.write(str(result))
    except Exception as e:
        sys.stdout = old_stdout
        with open('ocr_result.txt', 'w', encoding='utf-8') as f2:
            f2.write("Error: " + str(e))
