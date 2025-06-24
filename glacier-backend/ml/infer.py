import os
import sys
import numpy as np
from PIL import Image
import onnxruntime as ort

def load_session(model_path):
    return ort.InferenceSession(model_path, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

def process_image(image_path):
    image = Image.open(image_path).convert("RGB").resize((512, 512))
    array = np.array(image) / 255.0  # Normalize
    return array.astype(np.float32)

def save_mask(mask, save_path):
    binary = (mask < 0.5).astype(np.uint8) * 255  # Glacier = white
    Image.fromarray(binary).save(save_path)

def create_overlay(original_path, mask, overlay_path):
    orig = Image.open(original_path).convert("RGBA").resize((512, 512))
    mask_img = Image.fromarray((mask < 0.5).astype(np.uint8) * 255).convert("L")
    blue_mask = Image.new("RGBA", mask_img.size, (0, 0, 255, 100))  # Blue
    mask_rgba = Image.composite(blue_mask, Image.new("RGBA", mask_img.size), mask_img)
    overlay = Image.alpha_composite(orig, mask_rgba)
    overlay.save(overlay_path)

if __name__ == "__main__":
    zone_folder = sys.argv[1]
    session = load_session("ml/model.onnx")  # ONNX model here
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    images_dir = os.path.join(zone_folder, "original")
    masks_dir = os.path.join(zone_folder, "masks")
    overlays_dir = os.path.join(zone_folder, "overlays")
    os.makedirs(masks_dir, exist_ok=True)
    os.makedirs(overlays_dir, exist_ok=True)

    files = [f for f in os.listdir(images_dir) if f.endswith(".png")]
    total = len(files)
    batch_size = 4

    for i in range(0, total, batch_size):
        batch_files = files[i:i + batch_size]
        print(f"Processing batch {i // batch_size + 1} with {len(batch_files)} images...")

        input_batch = []
        for fname in batch_files:
            img_path = os.path.join(images_dir, fname)
            input_batch.append(process_image(img_path))

        batch_tensor = np.stack(input_batch, axis=0)  # (B, 512, 512, 3)
        predictions = session.run([output_name], {input_name: batch_tensor})[0]  # (B, 512, 512, 1)

        for j, fname in enumerate(batch_files):
            print(f"Done: {fname}")
            mask = predictions[j, :, :, 0]
            mask_path = os.path.join(masks_dir, fname.replace(".png", "_mask.png"))
            overlay_path = os.path.join(overlays_dir, fname.replace(".png", "_overlay.png"))
            save_mask(mask, mask_path)
            create_overlay(os.path.join(images_dir, fname), mask, overlay_path)

    print("All masks and overlays generated.")
