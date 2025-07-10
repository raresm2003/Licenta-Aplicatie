import os
import sys
import numpy as np
from PIL import Image
import onnxruntime as ort
import json
from datetime import datetime, timezone

def load_session(model_path):
    return ort.InferenceSession(model_path, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

def process_image(image_path):
    image = Image.open(image_path).convert("RGB").resize((512, 512))
    array = np.array(image) / 255.0
    return array.astype(np.float32)

def save_mask(mask, save_path):
    binary = (mask < 0.5).astype(np.uint8) * 255
    Image.fromarray(binary).save(save_path)

def create_overlay(original_path, mask, overlay_path):
    orig = Image.open(original_path).convert("RGBA").resize((512, 512))
    mask_img = Image.fromarray((mask < 0.5).astype(np.uint8) * 255).convert("L")
    blue_mask = Image.new("RGBA", mask_img.size, (0, 0, 255, 100))
    overlay = orig.copy()
    overlay.paste(blue_mask, (0, 0), mask_img)
    overlay.save(overlay_path)

def calculate_area(mask, bbox):
    lat_min, lon_min, lat_max, lon_max = bbox[1], bbox[0], bbox[3], bbox[2]
    width_deg = abs(lon_max - lon_min)
    height_deg = abs(lat_max - lat_min)
    deg_per_pixel_x = width_deg / 512
    deg_per_pixel_y = height_deg / 512

    avg_lat = (lat_min + lat_max) / 2
    meters_per_deg_lat = 111132.92 - 559.82 * np.cos(2 * np.radians(avg_lat)) + 1.175 * np.cos(4 * np.radians(avg_lat))
    meters_per_deg_lon = 111412.84 * np.cos(np.radians(avg_lat)) - 93.5 * np.cos(3 * np.radians(avg_lat))

    m_per_pixel_x = deg_per_pixel_x * meters_per_deg_lon
    m_per_pixel_y = deg_per_pixel_y * meters_per_deg_lat
    pixel_area_m2 = m_per_pixel_x * m_per_pixel_y

    glacier_pixels = np.sum(mask < 0.5)
    glacier_area_m2 = glacier_pixels * pixel_area_m2
    return glacier_area_m2

if __name__ == "__main__":
    zone_folder = sys.argv[1]
    session = load_session("ml/model.onnx")
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    images_dir = os.path.join(zone_folder, "original")
    masks_dir = os.path.join(zone_folder, "masks")
    overlays_dir = os.path.join(zone_folder, "overlays")
    os.makedirs(masks_dir, exist_ok=True)
    os.makedirs(overlays_dir, exist_ok=True)

    config_path = os.path.join(zone_folder, "config.json")
    with open(config_path, "r") as f:
        config = json.load(f)

    bbox = config["bbox"]
    years = config["years"]
    area_by_year = {}
    filenames = {}

    all_files = [f for f in os.listdir(images_dir) if f.endswith(".png")]

    for year in years:
        matching_files = [f for f in all_files if str(year) in f]
        if not matching_files:
            print(f"Skipping missing image: {year}")
            continue

        fname = matching_files[0]
        img_path = os.path.join(images_dir, fname)
        print(f"Processing: {fname}")

        input_img = process_image(img_path)
        prediction = session.run([output_name], {input_name: np.expand_dims(input_img, 0)})[0]
        mask = prediction[0, :, :, 0]

        mask_path = os.path.join(masks_dir, f"{year}_mask.png")
        overlay_path = os.path.join(overlays_dir, f"{year}_overlay.png")
        save_mask(mask, mask_path)
        create_overlay(img_path, mask, overlay_path)

        area_m2 = calculate_area(mask, bbox)
        area_km2 = area_m2 / 1e6
        area_by_year[str(year)] = round(area_km2, 2)
        filenames[str(year)] = fname

    sorted_years = sorted(int(y) for y in area_by_year)
    areas = [area_by_year[str(y)] for y in sorted_years]

    if len(sorted_years) >= 2:
        x = np.array(sorted_years)
        y = np.array(areas)
        slope, intercept = np.polyfit(x, y, 1)

        first_year = x[0]
        last_year = x[-1]
        area_start = slope * first_year + intercept
        area_end = slope * last_year + intercept

        if area_start != 0:
            trend = round((area_end - area_start) / area_start * 100, 2)
        else:
            trend = 0.0
    else:
        trend = 0.0

    config["areaByYear"] = area_by_year
    config["filenames"] = filenames
    config["trend"] = trend
    config["lastUpdated"] = datetime.now(timezone.utc).isoformat()

    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print("All masks, overlays, and area stats generated.")