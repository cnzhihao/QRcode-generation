// 二维码样式配置
const QR_STYLES = {
  classic: {
    qr: {
      colorDark: "#000000",
      colorLight: "transparent",
    },
    card: {
      background: "#ffffff",
      shadow: "rgba(0, 0, 0, 0.1)",
      text: "#333333"
    }
  },
  dark: {
    qr: {
      colorDark: "#ffffff",
      colorLight: "transparent",
    },
    card: {
      background: "#222222",
      shadow: "rgba(0, 0, 0, 0.5)",
      text: "#ffffff"
    }
  },
  blue: {
    qr: {
      colorDark: "#0066FF",
      colorLight: "transparent",
    },
    card: {
      background: "linear-gradient(135deg, #E3F2FD, #90CAF9)",
      shadow: "rgba(33, 150, 243, 0.2)",
      text: "#0D47A1"
    }
  },
  pink: {
    qr: {
      colorDark: "#FF69B4",
      colorLight: "transparent",
    },
    card: {
      background: "linear-gradient(135deg, #FFF0F5, #FFE4E1)",
      shadow: "rgba(255, 105, 180, 0.2)",
      text: "#DB7093"
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const siteName = url;
  const pageTitle = tab.title;

  // 获取保存的样式设置或使用默认值
  let currentStyle = await chrome.storage.local.get('qrStyle');
  currentStyle = currentStyle.qrStyle || 'classic';

  // 清除之前的二维码（如果有的话）
  const qrcodeElement = document.getElementById('qrcode');
  qrcodeElement.innerHTML = '';

  // 创建二维码的函数
  function createQRCode(style) {
    try {
      qrcodeElement.innerHTML = '';
      new QRCode(qrcodeElement, {
        text: url,
        width: 128,
        height: 128,
        colorDark: QR_STYLES[style].qr.colorDark,
        colorLight: QR_STYLES[style].qr.colorLight,
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (error) {
      console.error('创建二维码失败:', error);
    }
  }

  // 初始化二维码
  createQRCode(currentStyle);

  // 设置当前样式按钮的激活状态
  document.querySelector(`[data-style="${currentStyle}"]`).classList.add('active');

  // 设置初始卡片样式
  document.getElementById('qrcode-container').className = 'style-' + currentStyle;

  // 添加样式切换事件监听
  document.querySelectorAll('.style-button').forEach(button => {
    button.addEventListener('click', async () => {
      const style = button.dataset.style;
      
      // 更新当前样式
      currentStyle = style;
      
      // 更新按钮状态
      document.querySelector('.style-button.active').classList.remove('active');
      button.classList.add('active');
      
      // 更新卡片容器样式
      const container = document.getElementById('qrcode-container');
      container.className = 'style-' + style;
      
      // 重新生成二维码
      createQRCode(style);
      
      // 保存设置
      await chrome.storage.local.set({ qrStyle: style });
    });
  });

  // 显示网站名称
  document.getElementById('site-name').textContent = siteName;

  // 显示网页标题
  document.querySelector('.title-tag').textContent = pageTitle;

  // 添加圆角矩形绘制方法
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

  // 创建卡片图片
  function createCardImage(style = currentStyle) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    
    // 计算内容整体高度
    const qrSize = 128;
    const topPadding = 20;       // 顶部内边距
    const bottomPadding = 4;    // 底部内边距
    const middlePadding = 12;    // 调整间距
    const tagHeight = 22;        // 标签高度
    const fontSize = 13;
    const lineHeight = 16;
    
    // 设置卡片的最大宽度
    const cardWidth = 256;
    const cardPadding = 16;      // 卡片周围的边距
    
    // 预先计算文本行数
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const maxWidth = cardWidth - 32;  // 文本最大宽度（减去左右边距）
    let displayUrl = siteName;
    
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
    const totalHeight = contentHeight + topPadding + bottomPadding;  // 加上不同的上下内边距
    
    // 设置画布尺寸（卡片大小）
    canvas.width = cardWidth + (cardPadding * 2);
    canvas.height = totalHeight + (cardPadding * 2);
    
    // 首先绘制浅灰色背景
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制白色背景和阴影
    const styleConfig = QR_STYLES[style];
    
    // 如果是渐变背景
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
    
    // 计算内容的起始Y坐标，使内容垂直居中
    const startY = cardPadding + topPadding;
    
    // 获取原始二维码图片
    const qrCanvas = document.querySelector('#qrcode canvas');
    
    // 在新画布上居中绘制二维码
    const qrX = cardPadding + (cardWidth - qrSize) / 2;
    ctx.drawImage(qrCanvas, qrX, startY, qrSize, qrSize);
    
    // 在二维码和URL之间绘制标题标签
    const tagY = startY + qrSize + middlePadding;
    const tagWidth = 160;
    const tagX = cardPadding + (cardWidth - tagWidth) / 2;
    
    // 绘制标签背景
    if (style === 'classic') {
      ctx.fillStyle = '#f5f5f5';
    } else if (style === 'dark') {
      ctx.fillStyle = '#333333';
    } else if (style === 'blue') {
      ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    } else if (style === 'pink') {
      ctx.fillStyle = 'rgba(255, 105, 180, 0.1)';
    }
    
    drawRoundedRect(ctx, tagX, tagY, tagWidth, tagHeight, 4);
    ctx.fill();
    
    // 绘制标签文字
    if (style === 'classic') {
      ctx.fillStyle = '#666666';
    } else if (style === 'dark') {
      ctx.fillStyle = '#ffffff';
    } else if (style === 'blue') {
      ctx.fillStyle = '#0D47A1';
    } else if (style === 'pink') {
      ctx.fillStyle = '#DB7093';
    }
    ctx.font = `12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 文字截断处理
    let title = pageTitle;
    const maxTagWidth = tagWidth - 16;  // 减去左右padding
    while (ctx.measureText(title + '...').width > maxTagWidth && title.length > 0) {
      title = title.slice(0, -1);
    }
    if (title !== pageTitle) {
      title += '...';
    }
    
    ctx.fillText(title, cardPadding + cardWidth / 2, tagY + tagHeight / 2);
    
    // 绘制网站名称（完整 URL）
    ctx.fillStyle = styleConfig.card.text;
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    
    // 绘制多行文本
    let y = tagY + tagHeight + middlePadding;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, cardPadding + cardWidth / 2, y + (index * lineHeight));
    });
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(canvas);
      }, 100); // 给二维码生成一些时间
    });
  }

  // 复制二维码图片
  document.getElementById('copyBtn').addEventListener('click', async () => {
    try {
      const canvas = await createCardImage(currentStyle);
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
  });

  // 保存二维码图片
  document.getElementById('saveBtn').addEventListener('click', async () => {
    try {
      const canvas = await createCardImage(currentStyle);
      const link = document.createElement('a');
      link.download = `qrcode-${siteName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      showToast('保存失败，请重试');
      console.error('保存失败:', err);
    }
  });
});

// 显示提示信息
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // 添加显示类以触发动画
  setTimeout(() => toast.classList.add('show'), 10);

  // 2秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
} 