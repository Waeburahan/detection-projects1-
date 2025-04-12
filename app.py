from flask import Flask, render_template, request, send_from_directory, jsonify
import cv2
import os
import datetime
from ultralytics import YOLO
from collections import defaultdict

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

# สร้างโฟลเดอร์ถ้ายังไม่มี
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# โหลดโมเดล YOLO
model = YOLO("best.pt")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return "No file uploaded", 400
    
    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400
    
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    result_path = os.path.join(RESULT_FOLDER, file.filename)
    
    # บันทึกไฟล์ที่อัปโหลด
    file.save(file_path)
    
    # อ่านภาพและตรวจจับวัตถุ
    frame = cv2.imread(file_path)
    results = model(frame)
    annotated_frame = results[0].plot()
    
    # นับจำนวนของแต่ละคลาส
    class_counts = defaultdict(int)
    for result in results[0].boxes.cls:
        class_id = int(result)
        class_counts[class_id] += 1
    
    # รับชื่อคลาสจากโมเดล
    class_names = model.names
    
    # คำนวณเปอร์เซ็นต์ของแต่ละคลาส และเก็บจำนวนดอก
    total_detected = sum(class_counts.values())
    detection_info = {}       # เปอร์เซ็นต์
    detection_counts = {}     # จำนวนดอก

    for class_id, count in class_counts.items():
        class_name = class_names[class_id]
        percent = (count / total_detected) * 100 if total_detected > 0 else 0
        detection_info[class_name] = round(percent, 2)
        detection_counts[class_name] = count

    # ใส่วันที่และข้อมูลลงในรูป
    y_offset = 30
    current_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(annotated_frame, f"Date: {current_date}", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2, cv2.LINE_AA)
    y_offset += 40
    
    for class_name in detection_info:
        label = f"{class_name}: {detection_info[class_name]}% ({detection_counts[class_name]} ดอก)"
        cv2.putText(annotated_frame, label, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2, cv2.LINE_AA)
        y_offset += 40
    
    # บันทึกภาพผลลัพธ์
    cv2.imwrite(result_path, annotated_frame)
    
    # ส่งข้อมูลกลับไปให้ frontend
    return jsonify({
        "image_url": f"/results/{file.filename}",
        "detection_info": detection_info,
        "detection_counts": detection_counts
    })

@app.route("/results/<filename>")
def get_result_image(filename):
    return send_from_directory(RESULT_FOLDER, filename)

@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "favicon.ico")

if __name__ == "__main__":
    app.run(debug=True)
