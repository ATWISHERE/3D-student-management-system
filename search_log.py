import json

log_path = r"C:\Users\ABDUL TARIQUE WARSI\.gemini\antigravity-ide\brain\4fb4eb21-2215-484e-8291-b1706742a9f1\.system_generated\logs\transcript.jsonl"
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '"type":"USER_INPUT"' in line:
            print("USER:", line[:200])
        if 'export const SHAPES' in line:
            print("FOUND SHAPES:", line[:300])
