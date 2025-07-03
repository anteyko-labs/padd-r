import os
import re

def rename_files_in_folder(folder, prefix):
    files = sorted([f for f in os.listdir(folder) if f.lower().endswith('.png')])
    for idx, filename in enumerate(files, 1):
        ext = os.path.splitext(filename)[1]
        new_name = f"{prefix}_{idx:02d}{ext}"
        src = os.path.join(folder, filename)
        dst = os.path.join(folder, new_name)
        print(f"Renaming: {src} -> {dst}")
        os.rename(src, dst)

if __name__ == "__main__":
    base = os.path.join('assets')
    for tier in range(1, 5):
        folder = os.path.join(base, f'tier{tier}')
        if os.path.exists(folder):
            rename_files_in_folder(folder, f'tier{tier}') 