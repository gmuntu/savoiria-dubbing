import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

def make_icon():
    os.makedirs("AppIcon.iconset", exist_ok=True)
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Apple-style squircle background (Royal Blue)
    margin = 80
    corner_radius = 220
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=corner_radius,
        fill="#1d63ed"
    )

    # Subtle inner gradient / glow
    inner_margin = 100
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=corner_radius - 20,
        outline="#60a5fa",
        width=8
    )

    # Big stylish text / symbol
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 360)
        draw.text((size // 2, size // 2 - 40), "SIA", font=font, fill="#ffffff", anchor="mm")
        sub_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 100)
        draw.text((size // 2, size // 2 + 220), "DUBBING", font=sub_font, fill="#93c5fd", anchor="mm")
    except Exception:
        draw.rectangle([300, 300, 724, 724], fill="#ffffff")

    img.save("AppIcon.iconset/icon_512x512@2x.png")

    sizes = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]

    for filename, s in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join("AppIcon.iconset", filename))

    subprocess.run(["iconutil", "-c", "icns", "AppIcon.iconset", "-o", "AppIcon.icns"], check=True)
    shutil.rmtree("AppIcon.iconset", ignore_errors=True)
    print("✅ AppIcon.icns généré avec succès !")

    # Génération de l'icône Windows .ico
    img.save("icon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("✅ icon.ico généré avec succès pour Windows !")

if __name__ == "__main__":
    import shutil
    make_icon()
