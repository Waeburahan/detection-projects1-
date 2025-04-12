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
            displayResults(data);

            loadingElement.style.display = 'none';
            resultsSection.style.display = 'block';
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

    function displayResults(data) {
        resultImage.src = data.image_url;
        resultImage.style.display = 'block';
        detectionResults.innerHTML = '';

        for (const [className, percent] of Object.entries(data.detection_info)) {
            const count = data.detection_counts?.[className] ?? 0;

            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-bar';

            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';

            if (percent > 75) {
                progressFill.style.backgroundColor = '#28a745';
                progressFill.classList.add('high');
            } else if (percent > 50) {
                progressFill.style.backgroundColor = '#17a2b8';
                progressFill.classList.add('medium');
            } else if (percent > 25) {
                progressFill.style.backgroundColor = '#ffc107';
                progressFill.classList.add('low');
            } else {
                progressFill.style.backgroundColor = '#dc3545';
                progressFill.classList.add('very-low');
            }

            progressFill.style.width = percent + '%';

            const textContent = document.createElement('span');
            textContent.textContent = `${className}: ${percent.toFixed(2)}% (${count} ดอก)`;
            progressFill.appendChild(textContent);

            progressContainer.appendChild(progressFill);
            detectionResults.appendChild(progressContainer);
        }

        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'ดาวน์โหลดรายงาน';
        downloadButton.className = 'submit-btn download-btn';
        downloadButton.addEventListener('click', function () {
            generateReport(data);
        });
        detectionResults.appendChild(downloadButton);

        const summarySection = document.createElement('div');
        summarySection.className = 'detection-summary';

        const summaryTitle = document.createElement('div');
        summaryTitle.className = 'summary-title';
        summaryTitle.innerHTML = '<i class="fas fa-info-circle"></i> สรุปผลการวิเคราะห์';

        const summaryContent = document.createElement('div');
        summaryContent.className = 'summary-content';

        let analysisMessage = 'จากการวิเคราะห์พบรายการตรวจจับดังนี้:<br>';
        let recommendationMessage = '<br><b>คำแนะนำตามผลลัพธ์ที่ตรวจจับได้ (เฉพาะฟ้าทะลายโจร):</b><br>';

        let hasBud = 0;
        let hasBloom = 0;

        for (const [className, percent] of Object.entries(data.detection_info)) {
            const count = data.detection_counts?.[className] ?? 0;
            analysisMessage += `- ${className}: ${percent.toFixed(2)}% (จำนวน: ${count} ดอก)<br>`;
            if (className.toLowerCase() === 'bud') hasBud = percent;
            if (className.toLowerCase() === 'bloom') hasBloom = percent;
        }

        analysisMessage += '<br><i>หมายเหตุ:</i> ตามข้อมูลจากแหล่งวิชาการ พืชสมุนไพรฟ้าทะลายโจรควรเก็บเกี่ยวเมื่อมีดอกบานประมาณ 25–50% (<a href="https://www.technologychaoban.com/bullet-news-today/article_191656" target="_blank">ที่มา</a>)';

        if (hasBud === 0 && hasBloom === 0) {
            recommendationMessage += '- ไม่พบตาดอกหรือดอกบาน อาจยังไม่เข้าสู่ระยะการออกดอก แนะนำให้ติดตามผลในภายหลัง';
        } else if (hasBloom >= 25 && hasBloom <= 50) {
            recommendationMessage += '- พบดอกบานในระดับเหมาะสม (25–50%) แนะนำให้เก็บเกี่ยวในช่วงนี้ โดยเฉพาะตอนเช้า';
        } else if (hasBloom < 25 && hasBloom > 0) {
            recommendationMessage += '- พบดอกบานน้อย (<25%) แนะนำให้รอและติดตามผลอีก 5–7 วัน';
        } else if (hasBloom > 50) {
            recommendationMessage += '- พบดอกบานเกิน 50% ควรรีบเก็บเกี่ยวทันที เพื่อไม่ให้ดอกโรยและลดคุณภาพ';
        }

        if (hasBud > 50 && hasBloom < 25) {
            recommendationMessage += '<br>- ตาดอกมีมาก แต่ยังไม่บาน แสดงว่าพืชใกล้เข้าสู่ช่วงออกดอกเต็มที่';
        } else if (hasBud > 0 && hasBloom === 0) {
            recommendationMessage += '<br>- พบเฉพาะตาดอก แนะนำให้เสริมแสงและบำรุงเพื่อกระตุ้นให้ดอกบานเร็วขึ้น';
        }

        summaryContent.innerHTML = analysisMessage + recommendationMessage;
        summarySection.appendChild(summaryTitle);
        summarySection.appendChild(summaryContent);
        detectionResults.appendChild(summarySection);
    }

    function generateReport(data) {
        let reportContent = '';
        reportContent += '--- รายงานการวิเคราะห์พืช ---\n';
        reportContent += `วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
        reportContent += `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n\n`;

        reportContent += 'ผลการวิเคราะห์:\n';
        reportContent += '------------------\n';

        let hasBud = 0;
        let hasBloom = 0;

        for (const [className, percent] of Object.entries(data.detection_info)) {
            const count = data.detection_counts?.[className] ?? 0;
            reportContent += `- ${className}: ${percent.toFixed(2)}% (จำนวน: ${count} ดอก)\n`;
            if (className.toLowerCase() === 'bud') hasBud = percent;
            if (className.toLowerCase() === 'bloom') hasBloom = percent;
        }

        reportContent += '\nสรุปผล (ฟ้าทะลายโจร):\n';
        reportContent += '------------------------\n';
        reportContent += 'การประเมินดอกบานและตาดอกมีความสำคัญในการวางแผนการเก็บเกี่ยว\n';
        reportContent += 'แหล่งข้อมูล: https://www.technologychaoban.com/bullet-news-today/article_191656\n\n';

        reportContent += 'คำแนะนำตามผลตรวจจับ:\n';
        reportContent += '-----------------------\n';

        if (hasBud === 0 && hasBloom === 0) {
            reportContent += '- ไม่พบ Bud หรือ Bloom แนะนำให้ติดตามผลในภายหลัง\n';
        } else if (hasBloom >= 25 && hasBloom <= 50) {
            reportContent += '- พบดอกบาน 25–50% เหมาะสำหรับการเก็บเกี่ยวทันที โดยเฉพาะช่วงเช้า\n';
        } else if (hasBloom < 25 && hasBloom > 0) {
            reportContent += '- ดอกบานน้อย ควรรออีก 5–7 วันก่อนเก็บเกี่ยว\n';
        } else if (hasBloom > 50) {
            reportContent += '- ดอกบานเกิน 50% แนะนำให้เก็บเกี่ยวทันที เพื่อลดการสูญเสียคุณภาพ\n';
        }

        if (hasBud > 50 && hasBloom < 25) {
            reportContent += '- มี Bud สูงแต่ยังไม่บาน แสดงว่าพืชใกล้ช่วงออกดอกเต็มที่\n';
        } else if (hasBud > 0 && hasBloom === 0) {
            reportContent += '- พบเฉพาะ Bud ควรเสริมแสงและบำรุงเพื่อกระตุ้นการบานของดอก\n';
        }

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `รายงานการวิเคราะห์พืช_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
