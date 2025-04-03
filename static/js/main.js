// ตรวจสอบความพร้อมของ DOM ก่อนทำงาน
document.addEventListener('DOMContentLoaded', function() {
    // อ้างอิงอีลิเมนต์ที่จำเป็น
    const fileInput = document.getElementById('file');
    const fileNameElement = document.getElementById('fileName');
    const uploadForm = document.getElementById('uploadForm');
    const loadingElement = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const resultImage = document.getElementById('resultImage');
    const detectionResults = document.getElementById('detectionResults');
    
    // สคริปต์สำหรับแสดงชื่อไฟล์ที่อัปโหลด
    fileInput.addEventListener('change', function(e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : '';
        
        if (fileName) {
            fileNameElement.textContent = 'ไฟล์ที่เลือก: ' + fileName;
            fileNameElement.style.display = 'block';
        } else {
            fileNameElement.style.display = 'none';
        }
    });
    
    // สคริปต์สำหรับส่งข้อมูลและแสดงผลลัพธ์
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileInput.files[0]) {
            alert('กรุณาเลือกไฟล์ภาพก่อน');
            return;
        }
        
        // แสดง Loading
        loadingElement.style.display = 'flex';
        
        // ซ่อนผลลัพธ์เดิม (ถ้ามี)
        resultsSection.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        // ส่งข้อมูลไปยังเซิร์ฟเวอร์
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('การอัปโหลดล้มเหลว: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // ซ่อน Loading
            loadingElement.style.display = 'none';
            
            // แสดงส่วนผลลัพธ์
            resultsSection.style.display = 'block';
            
            // แสดงภาพผลลัพธ์
            resultImage.src = data.image_url;
            resultImage.alt = 'ผลการตรวจจับ'; 
            
            // แสดงข้อมูลการตรวจจับ
            detectionResults.innerHTML = '';
            
            // สร้างหัวข้อ
            const resultsTitle = document.createElement('h3');
            resultsTitle.textContent = 'รายงานการตรวจจับ';
            resultsTitle.className = 'results-title';
            detectionResults.appendChild(resultsTitle);
            
            // แสดงแถบความคืบหน้าสำหรับแต่ละคลาส
            const detectionData = [];
            for (const [className, percent] of Object.entries(data.detection_info)) {
                detectionData.push({ name: className, percent: percent });
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-fill';
                progressFill.style.width = percent + '%';
                progressFill.textContent = className + ': ' + percent + '%';
                
                // ตั้งค่าสีตามค่าเปอร์เซ็นต์
                if (percent > 75) {
                    progressFill.style.backgroundColor = '#28a745'; // เขียว
                } else if (percent > 50) {
                    progressFill.style.backgroundColor = '#17a2b8'; // ฟ้า
                } else if (percent > 25) {
                    progressFill.style.backgroundColor = '#ffc107'; // เหลือง
                } else {
                    progressFill.style.backgroundColor = '#dc3545'; // แดง
                }
                
                progressBar.appendChild(progressFill);
                detectionResults.appendChild(progressBar);
            }
            
            // สร้างปุ่มดาวน์โหลดรายงาน
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'ดาวน์โหลดรายงาน';
            downloadButton.className = 'download-btn';
            downloadButton.addEventListener('click', function() {
                generateReport(data);
            });
            detectionResults.appendChild(downloadButton);
            
            // เลื่อนไปยังส่วนผลลัพธ์
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
            alert('เกิดข้อผิดพลาดในการอัปโหลดหรือวิเคราะห์ภาพ: ' + error.message);
        });
    });
    
    // ฟังก์ชันสำหรับสร้างรายงาน
    function generateReport(data) {
        // สร้างเนื้อหารายงาน
        let reportContent = '--- รายงานการตรวจจับ ---\n\n';
        reportContent += 'วันที่: ' + new Date().toLocaleDateString('th-TH') + '\n';
        reportContent += 'เวลา: ' + new Date().toLocaleTimeString('th-TH') + '\n\n';
        reportContent += 'ผลการตรวจจับ:\n';
        
        for (const [className, percent] of Object.entries(data.detection_info)) {
            reportContent += '- ' + className + ': ' + percent + '%\n';
        }
        
        // สร้างไฟล์สำหรับดาวน์โหลด
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'รายงานการตรวจจับ_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    }
    
    // เพิ่มความสามารถในการรีเซ็ตฟอร์ม
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            uploadForm.reset();
            fileNameElement.style.display = 'none';
            resultsSection.style.display = 'none';
        });
    }
});