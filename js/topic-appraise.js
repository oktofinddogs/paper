// 导入API相关常量
import { API_KEY, ENDPOINT_ID, API_URL, TOPIC_APPRAISAL_PROMPT } from './api-constants.js';

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const majorSelect = document.getElementById('major-select');
  const educationRadios = document.querySelectorAll('input[name="education"]');
  const topicInput = document.getElementById('topic-input');
  const generateBtn = document.getElementById('generateBtn');
  const rightPanel = document.querySelector('.right-panel');
  
  // 获取当前选中的学历
  function getSelectedEducation() {
    for (const radio of educationRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'undergraduate'; // 默认返回本科
  }
  
  // 格式化AI返回的结果为HTML，支持Markdown格式
  function formatResultForDisplay(text) {
    try {
      // 检查是否已加载markdown-it库
      if (window.markdownit && text) {
        const md = window.markdownit();
        return md.render(text);
      }
      
      // 如果没有markdown-it库，使用简单的Markdown解析作为回退
      let formattedText = text
        // 标题处理
        .replace(/^### (.*$)/gm, '<h3 style="margin-bottom: 15px; color: #333; font-size: 18px;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="margin-bottom: 20px; color: #2c3e50; font-size: 22px;">$1</h2>')
        // 列表处理
        .replace(/^- (.*$)/gm, '<li style="margin-bottom: 8px; padding-left: 5px;">$1</li>')
        // 段落处理（两次换行）
        .replace(/\n\n/g, '</p><p style="margin-bottom: 15px; line-height: 1.6;">')
        // 单行换行
        .replace(/\n/g, '<br>');
      
      // 处理列表的开始和结束标签
      formattedText = formattedText.replace(/<li/g, '<ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 15px;"><li').replace(/<\/li>/g, '</li></ul>');
      
      // 添加开始的段落标签
      if (!formattedText.startsWith('<h')) {
        formattedText = '<p style="margin-bottom: 15px; line-height: 1.6;">' + formattedText;
      }
      
      // 添加结束的段落标签（如果有开始标签）
      if (formattedText.includes('<p')) {
        const paragraphs = formattedText.split('<p');
        const lastParagraph = paragraphs[paragraphs.length - 1];
        if (!lastParagraph.includes('</p>')) {
          formattedText += '</p>';
        }
      }
      
      return formattedText;
    } catch (error) {
      console.error('格式化文本失败:', error);
      // 如果格式化失败，使用原始文本作为回退
      return `<p>${text.replace(/\n/g, '<br>')}</p>`;
    }
  }
  
  // 显示加载状态
  function showLoadingState() {
    rightPanel.innerHTML = `
      <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
          <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #0066ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          <p style="margin-top: 15px; color: #666;">正在生成评估...</p>
        </div>
      </div>
    `;
    
    // 添加旋转动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // 生成评估函数
  async function generateAppraisal() {
    // 获取用户输入
    const major = majorSelect.value;
    const education = getSelectedEducation();
    const topic = topicInput.value.trim();
    
    // 验证输入
    if (!major) {
      alert('请选择专业');
      return;
    }
    
    if (!topic) {
      alert('请输入论文选题');
      return;
    }
    
    // 显示加载状态
    showLoadingState();
    
    // 禁用生成按钮，防止重复点击
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    
    try {
      // 调用API获取评估结果
      const result = await chatWithDoubaoAppraise(topic, major, education);
      
      // 恢复按钮状态
      generateBtn.disabled = false;
      generateBtn.textContent = '生成评估';
      
      // 显示评估结果
      if (result) {
        rightPanel.innerHTML = `<div style="padding: 20px; background: white; border-radius: 8px; min-height: 100%;">${formatResultForDisplay(result)}</div>`;
      } else {
        // 如果生成失败，显示错误信息
        rightPanel.innerHTML = `
          <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
            <p style="color: #e74c3c; font-size: 16px;">评估生成失败，请稍后重试</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('生成评估失败:', error);
      // 恢复按钮状态
      generateBtn.disabled = false;
      generateBtn.textContent = '生成评估';
      // 显示错误信息
      rightPanel.innerHTML = `
        <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
          <p style="color: #e74c3c; font-size: 16px;">评估生成失败，请稍后重试</p>
        </div>
      `;
    }
  }
  
  // 与API通信的函数
  async function chatWithDoubaoAppraise(topic, major, education) {
    try {
      // 构建请求体
      const requestBody = {
        model: ENDPOINT_ID,
        messages: [
          {
            role: 'system',
            content: TOPIC_APPRAISAL_PROMPT
          },
          {
            role: 'user',
            content: `专业：${major}\n学历：${education === 'specialty' ? '专科' : education === 'undergraduate' ? '本科' : '研究生'}\n论文选题：${topic}\n请对该选题进行全面评估。`
          }
        ]
      };
      
      // 使用fetch发送请求
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }
  
  // 为生成按钮添加点击事件监听
  generateBtn.addEventListener('click', generateAppraisal);
});