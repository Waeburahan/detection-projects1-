document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('file');
    const fileNameElement = document.getElementById('fileName');
    const resultImage = document.getElementById('resultImage');
    const detectionResults = document.getElementById('detectionResults');
    const resultsSection = document.getElementById('resultsSection');
    const loadingElement = document.getElementById('loading');
    const uploadForm = document.getElementById('uploadForm');
    const resetButton = document.getElementById('resetButton');

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            fileNameElement.textContent = 'ไฟล์ที่เลือก: ' + file.name;
            fileNameElement.style.display = 'block';

            const reader = new FileReader();
            reader.onload = function (event) {
                resultImage.src = event.target.result;
                resultImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            fileNameElement.style.display = 'none';
            resultImage.style.display = 'none';
        }
    });

    uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!fileInput.files[0]) {
            alert('กรุณาเลือกไฟล์ภาพก่อน');
            return;
        }

        loadingElement.style.display = 'flex';
        resultsSection.style.display = 'none';

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            loadingElement.style.display = 'none';
            resultsSection.style.display = 'block';

            resultImage.src = data.image_url;

            detectionResults.innerHTML = '';
            for (const [className, percent] of Object.entries(data.detection_info)) {
                const bar = document.createElement('div');
                bar.className = 'progress-bar';

                const fill = document.createElement('div');
                fill.className = 'progress-fill';
                fill.style.width = percent + '%';
                fill.textContent = `${className}: ${percent}%`;

                if (percent > 75) fill.style.backgroundColor = '#28a745';
                else if (percent > 50) fill.style.backgroundColor = '#17a2b8';
                else if (percent > 25) fill.style.backgroundColor = '#ffc107';
                else fill.style.backgroundColor = '#dc3545';

                bar.appendChild(fill);
                detectionResults.appendChild(bar);
            }

            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'ดาวน์โหลดรายงาน';
            downloadButton.className = 'download-btn submit-btn';
            downloadButton.addEventListener('click', function () {
                generateReport(data);
            });
            detectionResults.appendChild(downloadButton);

            resultsSection.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(err => {
            loadingElement.style.display = 'none';
            alert('เกิดข้อผิดพลาดในการวิเคราะห์: ' + err.message);
        });
    });

    resetButton.addEventListener('click', function () {
        uploadForm.reset();
        fileNameElement.style.display = 'none';
        resultImage.style.display = 'none';
        detectionResults.innerHTML = '';
        resultsSection.style.display = 'none';
    });

    function generateReport(data) {
        let content = '--- รายงานการตรวจจับ ---\n';
        content += `วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
        content += `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n\n`;

        for (const [name, percent] of Object.entries(data.detection_info)) {
            content += `- ${name}: ${percent}%\n`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `รายงานการตรวจจับ_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
