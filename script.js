// 全局变量
let currentImages = []; // 存储所有上传的图片
let currentImageIndex = 0; // 当前显示的图片索引
let watermarkSettings = {
    text: '',
    fontSize: 24,
    opacity: 0.5,
    color: '#000000',
    position: 'bottom-right'
};

// DOM 元素
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const thumbnailsGrid = document.getElementById('thumbnailsGrid');
const originalPreview = document.getElementById('originalPreview');
const watermarkPreview = document.getElementById('watermarkPreview');
const originalSize = document.getElementById('originalSize');
const processedSize = document.getElementById('processedSize');
const previewModal = document.getElementById('previewModal');
const modalImage = document.getElementById('modalImage');
const closeButton = document.querySelector('.close-button');
const modalContent = document.querySelector('.modal-content');

// 水印设置控件
const watermarkText = document.getElementById('watermarkText');
const fontSize = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const opacity = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const color = document.getElementById('color');
const positionButtons = document.querySelectorAll('.position-grid button');
const quality = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');

// 下载按钮
const downloadSingle = document.getElementById('downloadSingle');
const downloadAll = document.getElementById('downloadAll');

// 事件监听器
fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
closeButton.addEventListener('click', () => previewModal.classList.remove('show'));

// 水印设置更改事件
watermarkText.addEventListener('input', updateWatermark);
fontSize.addEventListener('input', updateFontSize);
opacity.addEventListener('input', updateOpacity);
color.addEventListener('input', updateColor);
quality.addEventListener('input', updateQuality);
positionButtons.forEach(button => {
    button.addEventListener('click', updatePosition);
});

// 下载按钮事件
downloadSingle.addEventListener('click', downloadCurrentImage);
downloadAll.addEventListener('click', downloadAllImages);

// 文件处理函数
function handleFileSelect(event) {
    const files = event.target.files;
    processFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('dragover');
    const files = event.dataTransfer.files;
    processFiles(files);
}

// 处理上传的文件
function processFiles(files) {
    currentImages = [];
    currentImageIndex = 0;
    thumbnailsGrid.innerHTML = '';
    
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    Promise.all(validFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    original: e.target.result,
                    file: file
                });
            };
            reader.readAsDataURL(file);
        });
    })).then(results => {
        currentImages = results;
        // 所有图片都加载完成后，一次性创建所有缩略图
        currentImages.forEach((image, index) => {
            createThumbnail(image.original, index);
        });
        if (currentImages.length > 0) {
            displayImage(0);
        }
    });
}

// 创建缩略图
function createThumbnail(imageUrl, index) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail' + (index === currentImageIndex ? ' active' : '');
    thumbnail.innerHTML = `
        <img src="${imageUrl}" alt="缩略图 ${index + 1}">
        <button class="delete-button" data-index="${index}">&times;</button>
    `;
    
    // 点击事件绑定在整个缩略图容器上
    thumbnail.addEventListener('click', (e) => {
        // 更精确地判断点击目标
        if (e.target === thumbnail || e.target.tagName === 'IMG') {
            displayImage(index);
        }
    });
    
    // 删除按钮事件
    const deleteButton = thumbnail.querySelector('.delete-button');
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteImage(index);
    });
    
    thumbnailsGrid.appendChild(thumbnail);
}

// 删除图片
function deleteImage(index) {
    currentImages.splice(index, 1);
    // 确保 currentImageIndex 不会超出范围
    currentImageIndex = Math.min(currentImageIndex, currentImages.length - 1);
    updateThumbnails();
    if (currentImages.length > 0) {
        displayImage(currentImageIndex);
    } else {
        clearPreviews();
    }
}

// 更新所有缩略图
function updateThumbnails() {
    thumbnailsGrid.innerHTML = '';
    currentImages.forEach((image, index) => {
        createThumbnail(image.original, index);
    });
}

// 清除预览
function clearPreviews() {
    originalPreview.innerHTML = '';
    watermarkPreview.innerHTML = '';
    originalSize.textContent = '-';
    processedSize.textContent = '-';
}

// 显示图片
function displayImage(index) {
    if (currentImages.length === 0) return;
    
    currentImageIndex = index;
    const image = currentImages[currentImageIndex];
    
    // 更新缩略图选中状态
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    
    // 显示原图
    originalPreview.innerHTML = `<img src="${image.original}" alt="原图" onclick="showModal('${image.original}')">`;
    originalSize.textContent = formatFileSize(image.file.size);
    
    // 添加水印并显示
    applyWatermark(image.original);
}

// 显示放大预览模态框
function showModal(imageUrl) {
    const img = new Image();
    img.onload = () => {
        const screenWidth = window.innerWidth - 40;
        const screenHeight = window.innerHeight - 40;
        
        let modalWidth = img.width;
        let modalHeight = img.height;
        
        if (modalWidth > screenWidth) {
            const ratio = screenWidth / modalWidth;
            modalWidth = screenWidth;
            modalHeight = modalHeight * ratio;
        }
        
        if (modalHeight > screenHeight) {
            const ratio = screenHeight / modalHeight;
            modalHeight = screenHeight;
            modalWidth = modalWidth * ratio;
        }
        
        modalContent.style.width = modalWidth + 'px';
        modalContent.style.height = modalHeight + 'px';
        modalImage.src = imageUrl;
        previewModal.classList.add('show');
    };
    img.src = imageUrl;
}

// 添加点击外部关闭功能
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.classList.remove('show');
    }
});

// 添加模板配置
const watermarkTemplates = {
    template1: {
        top: {
            line1: 'LIFE MOMENTS · DAILY RECORDS',
            line2: '记 录 生 活  ·  分 享 美 好'
        },
        bottom: 'CREATED WITH LOVE BY {text} © ALL MOMENTS RESERVED 2024'
    },
    template2: {
        top: {
            line1: 'SWEET MOMENTS · HAPPY DAYS',
            line2: '温 暖 日 常  ·  点 滴 记 录'
        },
        bottom: 'PHOTOGRAPHY AND STORIES BY {text} © DAILY LIFE COLLECTION 2024'
    },
    template3: {
        top: {
            line1: 'HEALING MOMENTS · GENTLE DAYS',
            line2: '治 愈 时 光  ·  美 好 生 活'
        },
        bottom: 'CAPTURED AND SHARED BY {text} © WONDERFUL LIFE SERIES 2024'
    }
};

// 当前选中的模板
let currentTemplate = 'template1';

// 添加模板选择事件监听
const templateSelect = document.getElementById('watermarkTemplate');
templateSelect.addEventListener('change', (e) => {
    currentTemplate = e.target.value;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
});

// 修改水印绘制函数
function drawWatermark(ctx, text, width, height) {
    const template = watermarkTemplates[currentTemplate];
    const padding = 40;
    
    // 设置字体
    ctx.textAlign = 'center';
    ctx.fillStyle = hexToRGBA(watermarkSettings.color, watermarkSettings.opacity);
    
    // 绘制顶部英文（细体）
    ctx.font = '300 24px -apple-system';
    ctx.letterSpacing = '0.05em';
    ctx.fillText(template.top.line1, width/2, padding + 35);
    
    // 绘制中文标语（使用思源黑体）
    ctx.font = '300 20px "Noto Sans SC", sans-serif';
    ctx.letterSpacing = '0.1em';  // 增加中文字间距
    ctx.fillText(template.top.line2, width/2, padding + 70);
    
    // 绘制中间主要文字（签名）
    ctx.font = `${watermarkSettings.fontSize}px "Noto Sans SC", sans-serif`;
    ctx.letterSpacing = '0.05em';
    ctx.fillText(text, width/2, height/2);
    
    // 绘制底部版权信息
    ctx.font = '300 16px -apple-system';
    const bottomText = template.bottom.replace('{text}', text);
    ctx.fillText(bottomText, width/2, height - padding);
}

// 添加水印
function applyWatermark(imageUrl) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布大小
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 绘制水印
        drawWatermark(ctx, watermarkSettings.text, canvas.width, canvas.height);
        
        // 显示预览
        const watermarkedImage = canvas.toDataURL('image/jpeg', quality.value / 100);
        watermarkPreview.innerHTML = `<img src="${watermarkedImage}" alt="效果预览" onclick="showModal('${watermarkedImage}')">`;
        
        // 更新处理后文件大小
        const processedSizeBytes = Math.round((watermarkedImage.length - 22) * 3 / 4);
        processedSize.textContent = formatFileSize(processedSizeBytes);
    };
    img.src = imageUrl;
}

// 添加辅助函数：将十六进制颜色转换为带透明度的 RGBA
function hexToRGBA(hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 更新水印设置
function updateWatermark() {
    watermarkSettings.text = watermarkText.value;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

function updateFontSize() {
    watermarkSettings.fontSize = parseInt(fontSize.value);
    fontSizeValue.textContent = `${fontSize.value}px`;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

function updateOpacity() {
    watermarkSettings.opacity = opacity.value / 100;
    opacityValue.textContent = `${opacity.value}%`;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

function updateColor() {
    watermarkSettings.color = color.value;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

function updatePosition(event) {
    const button = event.target;
    positionButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    watermarkSettings.position = button.dataset.position;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

function updateQuality() {
    qualityValue.textContent = `${quality.value}%`;
    if (currentImages.length > 0) {
        applyWatermark(currentImages[currentImageIndex].original);
    }
}

// 下载功能
function downloadCurrentImage() {
    if (currentImages.length === 0) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 添加水印
        drawWatermark(ctx, watermarkSettings.text, canvas.width, canvas.height);
        
        // 下载图片
        const link = document.createElement('a');
        link.download = `watermarked_${currentImages[currentImageIndex].file.name}`;
        link.href = canvas.toDataURL('image/jpeg', quality.value / 100);
        link.click();
    };
    
    img.src = currentImages[currentImageIndex].original;
}

async function downloadAllImages() {
    if (currentImages.length === 0) return;
    
    const zip = new JSZip();
    const promises = currentImages.map(async (image, index) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // 绘制原图
                ctx.drawImage(img, 0, 0);
                
                // 添加水印
                drawWatermark(ctx, watermarkSettings.text, canvas.width, canvas.height);
                
                // 转换为 base64
                canvas.toBlob((blob) => {
                    zip.file(`watermarked_${image.file.name}`, blob);
                    resolve();
                }, 'image/jpeg', quality.value / 100);
            };
            img.src = image.original;
        });
    });
    
    await Promise.all(promises);
    
    // 生成并下载 zip 文件
    const content = await zip.generateAsync({type: 'blob'});
    const link = document.createElement('a');
    link.download = 'watermarked_images.zip';
    link.href = URL.createObjectURL(content);
    link.click();
}

// 辅助函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 