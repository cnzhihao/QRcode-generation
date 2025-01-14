// 绘制圆角矩形
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// 创建悬浮按钮
function createFloatingButton() {
  const button = document.createElement('div');
  button.innerHTML = `
    <div id="qr-float-button" style="
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.3s;
      user-select: none;
    ">
      <img src="${chrome.runtime.getURL('icons/icon16.png')}" width="20" height="20" style="opacity: 0.7;">
    </div>
  `;

  const qrButton = button.firstElementChild;
  
  // 添加拖拽功能
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = window.innerWidth - 60;  // 初始位置在右下角
  let yOffset = window.innerHeight - 60;
  
  const startDragging = (e) => {
    e.preventDefault(); // 防止默认的拖动行为
    if (e.type === 'mousedown') {
      const buttonRect = qrButton.getBoundingClientRect();
      initialX = e.clientX - buttonRect.left;
      initialY = e.clientY - buttonRect.top;
    } else {
      const buttonRect = qrButton.getBoundingClientRect();
      initialX = e.touches[0].clientX - buttonRect.left;
      initialY = e.touches[0].clientY - buttonRect.top;
    }
    isDragging = true;
    qrButton.style.transition = 'none';
    qrButton.style.cursor = 'grabbing';
  };
  
  const drag = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === 'mousemove') {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      } else {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      }
      
      // 确保按钮不会超出视窗范围
      const buttonWidth = 40;
      const buttonHeight = 40;
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;
      
      currentX = Math.min(Math.max(0, currentX), maxX);
      currentY = Math.min(Math.max(0, currentY), maxY);
      
      qrButton.style.left = `${currentX}px`;
      qrButton.style.top = `${currentY}px`;
      qrButton.style.right = 'auto';
      qrButton.style.bottom = 'auto';
    }
  };
  
  const stopDragging = () => {
    isDragging = false;
    qrButton.style.transition = 'box-shadow 0.3s';
    qrButton.style.cursor = 'grab';
    // 保存按钮位置到 storage
    try {
      if (chrome.runtime.id) {
        chrome.storage.local.set({
          buttonPosition: { x: currentX, y: currentY }
        });
      }
    } catch (error) {
      console.error('Failed to save button position:', error);
    }
  };
  
  // 设置初始鼠标样式
  qrButton.style.cursor = 'grab';
  
  // 鼠标事件
  qrButton.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);
  
  // 触摸事件
  qrButton.addEventListener('touchstart', startDragging);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', stopDragging);

  // 修改弹窗位置计算
  function updateCardPosition() {
    const card = document.getElementById('qr-float-card');
    if (card) {
      const buttonRect = qrButton.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const gap = 10; // 按钮和弹窗之间的间距
      
      // 判断按钮在哪个区域
      const isInLeftHalf = buttonRect.left < windowWidth / 2;
      const isInTopHalf = buttonRect.top < windowHeight / 2;
      
      // 重置所有定位属性
      card.style.left = 'auto';
      card.style.right = 'auto';
      card.style.top = 'auto';
      card.style.bottom = 'auto';
      
      if (isInLeftHalf) {
        // 左半边
        if (isInTopHalf) {
          // 左上区域：弹窗在右下
          card.style.left = `${buttonRect.right + gap}px`;
          card.style.top = `${buttonRect.bottom + gap}px`;
        } else {
          // 左下区域：弹窗在右上
          card.style.left = `${buttonRect.right + gap}px`;
          card.style.bottom = `${windowHeight - buttonRect.top + gap}px`;
        }
      } else {
        // 右半边
        if (isInTopHalf) {
          // 右上区域：弹窗在左下
          card.style.right = `${windowWidth - buttonRect.left + gap}px`;
          card.style.top = `${buttonRect.bottom + gap}px`;
        } else {
          // 右下区域：弹窗在左上
          card.style.right = `${windowWidth - buttonRect.left + gap}px`;
          card.style.bottom = `${windowHeight - buttonRect.top + gap}px`;
        }
      }
      
      // 防止弹窗超出视窗
      requestAnimationFrame(() => {
        const newCardRect = card.getBoundingClientRect();
        
        if (newCardRect.right > windowWidth) {
          card.style.left = 'auto';
          card.style.right = `${gap}px`;
        }
        if (newCardRect.left < 0) {
          card.style.right = 'auto';
          card.style.left = `${gap}px`;
        }
        if (newCardRect.bottom > windowHeight) {
          card.style.top = 'auto';
          card.style.bottom = `${gap}px`;
        }
        if (newCardRect.top < 0) {
          card.style.bottom = 'auto';
          card.style.top = `${gap}px`;
        }
      });
    }
  }

  // 点击事件
  qrButton.addEventListener('click', (e) => {
    if (!isDragging) {
      toggleQRCard();
      // 延迟一帧更新位置，确保卡片已创建
      requestAnimationFrame(updateCardPosition);
    }
  });

  // 监听窗口大小变化
  window.addEventListener('resize', updateCardPosition);

  document.body.appendChild(button);
}

// 创建二维码卡片
function createQRCard() {
  console.log('Creating QR card...');
  const card = document.createElement('div');
  card.id = 'qr-float-card';
  const currentStyle = 'classic';  // 设置默认样式
  card.style.cssText = `
    position: fixed;
    width: 288px;
    background: #f5f5f5;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9998;
    padding: 16px;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;

  // 创建内容容器
  const container = document.createElement('div');
  container.id = 'qrcode-container';
  container.className = 'style-classic';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-radius: 10px;
    width: 100%;
    background: ${currentStyle === 'classic' ? '#ffffff' : 
                 currentStyle === 'dark' ? '#222222' :
                 currentStyle === 'blue' ? 'linear-gradient(135deg, #E3F2FD, #90CAF9)' :
                 'linear-gradient(135deg, #FFF0F5, #FFE4E1)'};
    box-shadow: 0 4px 6px ${currentStyle === 'classic' ? 'rgba(0, 0, 0, 0.1)' :
                              currentStyle === 'dark' ? 'rgba(0, 0, 0, 0.3)' :
                              currentStyle === 'blue' ? 'rgba(33, 150, 243, 0.2)' :
                              'rgba(255, 105, 180, 0.2)'};
  `;

  // 创建样式切换器
  const styleSwitcher = document.createElement('div');
  styleSwitcher.style.cssText = `
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    padding: 4px;
    background: #f0f0f0;
    border-radius: 8px;
  `;

  // 添加样式按钮
  const styles = ['classic', 'dark', 'blue', 'pink'];
  styles.forEach(style => {
    const button = document.createElement('button');
    button.className = `style-button ${style === 'classic' ? 'active' : ''}`;
    button.dataset.style = style;
    button.style.cssText = `
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      padding: 3px;
      cursor: pointer;
      background: ${style === 'classic' ? 'white' : 'transparent'};
      box-shadow: ${style === 'classic' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'};
      transition: all 0.2s;
    `;

    const icon = document.createElement('span');
    icon.className = `style-icon ${style}`;
    icon.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 4px;
      border: 2px solid #fff;
      background: ${
        style === 'classic' ? '#000' :
        style === 'dark' ? '#222' :
        style === 'blue' ? 'linear-gradient(135deg, #0066FF, #0099FF)' :
        'linear-gradient(135deg, #FF69B4, #FFC0CB)'
      };
    `;

    button.appendChild(icon);
    styleSwitcher.appendChild(button);

    // 添加点击事件
    button.addEventListener('click', async () => {
      document.querySelectorAll('.style-button').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.boxShadow = 'none';
      });
      button.style.background = 'white';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      container.className = `style-${style}`;
      updateCardStyle(container, style);
      await generateQRCode(style);
    });
  });

  // 创建二维码容器
  const qrContainer = document.createElement('div');
  qrContainer.id = 'qr-container';
  qrContainer.style.cssText = `
    display: block;
    margin: 0 auto;
    width: 128px;
    height: 128px;
  `;

  // 创建标题标签
  const titleTag = document.createElement('div');
  titleTag.className = 'title-tag';
  titleTag.style.cssText = `
    max-width: 160px;
    padding: 4px 8px;
    margin: 8px 0;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: ${currentStyle === 'classic' ? '#f5f5f5' :
                currentStyle === 'dark' ? '#333333' :
                currentStyle === 'blue' ? 'rgba(33, 150, 243, 0.1)' :
                'rgba(255, 105, 180, 0.1)'};
    color: ${currentStyle === 'classic' ? '#666666' :
            currentStyle === 'dark' ? '#ffffff' :
            currentStyle === 'blue' ? '#0D47A1' :
            '#DB7093'};
  `;
  titleTag.textContent = document.title;

  // 创建网站链接
  const siteUrl = document.createElement('div');
  siteUrl.id = 'site-name';
  siteUrl.style.cssText = `
    margin-top: 2px;
    font-size: 14px;
    color: ${currentStyle === 'classic' ? '#666666' :
            currentStyle === 'dark' ? '#ffffff' :
            currentStyle === 'blue' ? '#0D47A1' :
            '#DB7093'};
    width: 100%;
    text-align: center;
    word-wrap: break-word;
    padding: 0 10px;
  `;
  siteUrl.textContent = window.location.href;

  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 12px;
    width: 100%;
    justify-content: center;
  `;

  // 创建复制和保存按钮
  const buttons = [
    { id: 'copyBtn', text: '复制', icon: 'M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32z M704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z' },
    { id: 'saveBtn', text: '保存', icon: 'M893.3 293.3L730.7 130.7c-7.5-7.5-16.7-13-26.7-16V112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V338.5c0-17-6.7-33.2-18.7-45.2zM384 184h256v104H384V184zm456 656H184V184h136v136c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V205.8l136 136V840z' }
  ];

  buttons.forEach(({ id, text, icon }) => {
    const button = document.createElement('button');
    button.id = id;
    button.className = 'action-button';
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background-color: #007AFF;
      color: white;
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1024 1024');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.style.opacity = '0.9';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon);
    path.setAttribute('fill', 'currentColor');

    svg.appendChild(path);
    button.appendChild(svg);
    button.appendChild(document.createTextNode(text));
    buttonContainer.appendChild(button);
  });

  // 组装所有元素
  container.appendChild(styleSwitcher);
  container.appendChild(qrContainer);
  container.appendChild(titleTag);
  container.appendChild(siteUrl);
  container.appendChild(buttonContainer);
  card.appendChild(container);

  // 添加按钮事件
  card.querySelector('#copyBtn').addEventListener('click', copyQRCode);
  card.querySelector('#saveBtn').addEventListener('click', saveQRCode);

  document.body.appendChild(card);
  return card;
}

// 复制二维码
async function copyQRCode() {
  try {
    const canvas = await createQRImage();
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);
    showToast('已复制到剪贴板');
  } catch (err) {
    showToast('复制失败，请重试');
    console.error('复制失败:', err);
  }
}

// 保存二维码
async function saveQRCode() {
  try {
    const canvas = await createQRImage();
    const link = document.createElement('a');
    link.download = `qrcode-${window.location.hostname}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    showToast('保存失败，请重试');
    console.error('保存失败:', err);
  }
}

// 创建二维码图片
async function createQRImage() {
  const container = document.getElementById('qrcode-container');
  const style = container.className.replace('style-', '');
  const styleConfig = QR_STYLES[style];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 使用当前的二维码，而不是重新生成
  const qrCanvas = document.querySelector('#qr-container canvas');
  if (!qrCanvas) {
    throw new Error('QR code not found');
  }
  
  // 重置阴影
  ctx.shadowColor = 'transparent';
  
  // 计算内容整体高度
  const qrSize = 128;
  const topPadding = 20;
  const bottomPadding = 4;
  const middlePadding = 12;
  const tagHeight = 22;
  const fontSize = 13;
  const lineHeight = 16;
  
  // 设置卡片的最大宽度
  const cardWidth = 198;
  const cardPadding = 16;
  
  // 预先计算文本行数
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const maxWidth = cardWidth - 32;
  let displayUrl = window.location.href;
  
  // 计算每行能显示的字符数
  const words = displayUrl.split('');
  let line = '';
  let lines = [];
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i];
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  // 计算所需的总高度
  const textHeight = lines.length * lineHeight;
  const contentHeight = qrSize + middlePadding + tagHeight + middlePadding + textHeight;
  const totalHeight = contentHeight + topPadding + bottomPadding;
  
  // 设置画布尺寸
  canvas.width = cardWidth + (cardPadding * 2);
  canvas.height = totalHeight + (cardPadding * 2);
  
  // 首先绘制浅灰色背景
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制白色背景和阴影
  if (styleConfig.card.background.includes('gradient')) {
    const gradient = ctx.createLinearGradient(
      cardPadding,
      cardPadding,
      cardPadding + cardWidth,
      cardPadding + totalHeight
    );
    const colors = styleConfig.card.background.match(/#[A-Fa-f0-9]{6}/g);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = styleConfig.card.background;
  }
  
  ctx.shadowColor = styleConfig.card.shadow;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  drawRoundedRect(ctx, cardPadding, cardPadding, cardWidth, totalHeight, 10);
  ctx.fill();
  
  // 重置阴影
  ctx.shadowColor = 'transparent';
  
  // 计算内容的起始Y坐标
  const startY = cardPadding + topPadding;
  
  // 获取原始二维码图片
  const qrX = cardPadding + (cardWidth - qrSize) / 2;
  ctx.drawImage(qrCanvas, qrX, startY, qrSize, qrSize);
  
  // 在二维码和URL之间绘制标题标签
  const tagY = startY + qrSize + middlePadding;
  const tagWidth = 160;
  const tagX = cardPadding + (cardWidth - tagWidth) / 2;
  
  // 绘制标签背景
  ctx.fillStyle = styleConfig.card.tag.background;
  
  drawRoundedRect(ctx, tagX, tagY, tagWidth, tagHeight, 4);
  ctx.fill();
  
  // 绘制标签文字
  ctx.fillStyle = styleConfig.card.tag.text;
  
  ctx.font = `12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 文字截断处理
  let title = document.title;
  const maxTagWidth = tagWidth - 16;
  while (ctx.measureText(title + '...').width > maxTagWidth && title.length > 0) {
    title = title.slice(0, -1);
  }
  if (title !== document.title) {
    title += '...';
  }
  
  ctx.fillText(title, cardPadding + cardWidth / 2, tagY + tagHeight / 2);
  
  // 绘制网站名称
  ctx.fillStyle = styleConfig.card.text;
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  
  // 绘制多行文本
  let y = tagY + tagHeight + middlePadding;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, cardPadding + cardWidth / 2, y + (index * lineHeight));
  });
  
  return canvas;
}

// 添加 QR_STYLES 配置
const QR_STYLES = {
  classic: {
    qr: {
      colorDark: "#000000",
      colorLight: "transparent"
    },
    card: {
      background: "#ffffff",
      shadow: "rgba(0, 0, 0, 0.08)",
      text: "#666666",
      tag: {
        background: "#f5f5f5",
        text: "#666666"
      }
    }
  },
  dark: {
    qr: {
      colorDark: "#ffffff",
      colorLight: "transparent"
    },
    card: {
      background: "#222222",
      shadow: "rgba(0, 0, 0, 0.2)",
      text: "#ffffff",
      tag: {
        background: "#333333",
        text: "#ffffff"
      }
    }
  },
  blue: {
    qr: {
      colorDark: "#0066FF",
      colorLight: "transparent"
    },
    card: {
      background: "#E6F0FF",
      shadow: "rgba(33, 150, 243, 0.2)",
      text: "#0066FF",
      tag: {
        background: "rgba(0, 102, 255, 0.1)",
        text: "#0066FF"
      }
    }
  },
  pink: {
    qr: {
      colorDark: "#FF69B4",
      colorLight: "transparent"
    },
    card: {
      background: "#FFF0F5",
      shadow: "rgba(255, 105, 180, 0.2)",
      text: "#FF69B4",
      tag: {
        background: "rgba(255, 105, 180, 0.1)",
        text: "#FF69B4"
      }
    }
  }
};

// 修改预览卡片的样式应用
function updateCardStyle(container, style) {
  container.style.background = QR_STYLES[style].card.background;
  container.style.boxShadow = `0 4px 6px ${QR_STYLES[style].card.shadow}`;
  
  // 更新标题标签样式
  const titleTag = container.querySelector('.title-tag');
  if (titleTag) {
    titleTag.style.background = QR_STYLES[style].card.tag.background;
    titleTag.style.color = QR_STYLES[style].card.tag.text;
  }
  
  // 更新网站链接样式
  const siteUrl = container.querySelector('#site-name');
  if (siteUrl) {
    siteUrl.style.color = QR_STYLES[style].card.text;
  }
}

// 显示提示信息
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 10000;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 加载 QRCode 库
async function loadQRCodeLibrary() {
  if (window.QRCode) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('qrcode.min.js');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load QRCode library'));
    document.head.appendChild(script);
  });
}

// 切换二维码卡片显示状态
async function toggleQRCard() {
  console.log('Toggling QR card...');
  let card = document.getElementById('qr-float-card');
  if (!card) {
    card = createQRCard();
  }

  if (card.style.display === 'none') {
    card.style.display = 'block';
    try {
      await loadQRCodeLibrary();
      await generateQRCode();
    } catch (error) {
      console.error('Failed to load QRCode library:', error);
    }
  } else {
    card.style.display = 'none';
  }
}

// 生成二维码
async function generateQRCode(style = 'classic') {
  console.log('Generating QR code...');
  try {
    if (typeof QRCode === 'undefined') {
      console.error('QRCode is not defined');
      return;
    }
    const container = document.getElementById('qr-container');
    container.innerHTML = '';
    
    const qr = new QRCode(container, {
      text: window.location.href,
      width: 128,
      height: 128,
      colorDark: QR_STYLES[style].qr.colorDark,
      colorLight: "transparent",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // 等待二维码生成完成
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
}

// 添加错误处理和重新连接逻辑
let extensionActive = true;

// 监听扩展状态
function checkExtensionStatus() {
  if (chrome.runtime.id) {
    if (!extensionActive) {
      extensionActive = true;
      initializeExtension();
    }
  } else {
    extensionActive = false;
    cleanup();
  }
}

// 清理函数
function cleanup() {
  const button = document.getElementById('qr-float-button');
  const card = document.getElementById('qr-float-card');
  if (button) button.remove();
  if (card) card.remove();
}

// 初始化函数
function initializeExtension() {
  try {
    createFloatingButton();
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
}

// 监听扩展状态变化
chrome.runtime.onConnect.addListener(function(port) {
  port.onDisconnect.addListener(checkExtensionStatus);
});

// 修改页面加载完成后的初始化
initializeExtension(); 