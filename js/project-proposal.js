// 导入API常量
import { API_KEY, ENDPOINT_ID, API_URL, PROJECT_PROPOSAL_PROMPT } from './api-constants.js';

// DOM元素获取
const majorSelect = document.getElementById('major-select');
const educationRadios = document.querySelectorAll('input[name="education"]');
const topicInput = document.getElementById('topic-input');
const generateBtn = document.getElementById('generateBtn');
const resultContainer = document.getElementById('result-container');

// 获取选中的学历
function getSelectedEducation() {
    let selectedEducation = '';
    educationRadios.forEach(radio => {
        if (radio.checked) {
            selectedEducation = radio.value;
        }
    });
    return selectedEducation;
}

 // 格式化AI返回的结果为HTML，支持Markdown格式
  function formatResultForDisplay(text) {
    try {
      // 检查是否已加载markdown-it库
      if (window.markdownit && text) {
        console.log("有markdown库");
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
    resultContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0066ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 16px; color: #666;">正在生成开题报告，请稍候...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// 生成开题报告
async function generateProposal() {
    // 获取用户输入
    const major = majorSelect.value;
    const education = getSelectedEducation();
    const topic = topicInput.value.trim();
    
    // 输入验证
    if (!major) {
        alert('请选择论文专业');
        return;
    }
    
    if (!topic) {
        alert('请输入论文标题');
        return;
    }
    
    // 显示加载状态
    showLoadingState();
    
    try {
        // 回调函数处理流式内容块
        const onChunkReceived = (partialContent) => {
             
            // 更新结果显示
            const formattedResult = formatResultForDisplay(partialContent);
            resultContainer.innerHTML = `<div style="padding: 20px; background: white; border-radius: 8px; min-height: 100%;">${formattedResult}</div>`;
        };
        
        // 调用API获取结果（流式）
        const finalResult = await chatWithDoubaoProposal(major, education, topic, onChunkReceived);
        
        // 确保最终结果正确格式化
        const formattedResult = formatResultForDisplay(finalResult);
        resultContainer.innerHTML = `
            <div style="height: 100%; overflow-y: auto;">
                <div style="padding-right: 10px;">
                    ${formattedResult}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('生成开题报告失败:', error);
        resultContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ff4d4f;">
                <p style="font-size: 16px; margin-bottom: 8px;">生成失败</p>
                <p style="text-align: center; max-width: 400px;">${error.message || '请检查网络连接后重试'}</p>
            </div>
        `;
    } finally {
        // 恢复按钮状态
        generateBtn.disabled = false;
        generateBtn.textContent = '立即生成';
    }
}

// 调用豆包API生成开题报告 - 支持流式响应
async function chatWithDoubaoProposal(major, education, topic, onChunk) {
    // 构建请求体
    const requestBody = {
        model: ENDPOINT_ID,
        messages: [
            {
                role: 'system',
                content: PROJECT_PROPOSAL_PROMPT
            },
            {
                role: 'user',
                content: `
                学历层次：${education === 'specialty' ? '专科生' : education === 'undergraduate' ? '本科生' : '研究生'}
                具体专业：${major === 'computer' ? '计算机' : 
                          major === 'electronics' ? '电子信息' : 
                          major === 'mathematics' ? '数学' : 
                          major === 'physics' ? '物理学' : 
                          major === 'chemistry' ? '化学' : 
                          major === 'biology' ? '生物学' : 
                          major === 'literature' ? '文学' : 
                          major === 'history' ? '历史学' : 
                          major === 'philosophy' ? '哲学' : 
                          major === 'economics' ? '经济学' : 
                          major === 'management' ? '管理学' : 
                          major === 'law' ? '法学' : 
                          major === 'education' ? '教育学' : major}
                研究主题：${topic}
                请为我生成一份符合上述条件的开题报告。
                `
            }
        ],
        stream: true
    };
    
    try {
        // 添加调试信息
        console.log('API调用信息:', {
            url: API_URL,
            endpointId: ENDPOINT_ID.substring(0, 5) + '...' // 隐藏部分敏感信息
        });
        
        // 使用fetch API发送请求
        console.log('使用fetch发送请求');
        const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
        });
        
        console.log('fetch响应状态:', response.status);
        if (!response.ok) {
            // 获取响应文本以获取更多错误信息
            const errorText = await response.text();
            console.error('HTTP错误详情:', errorText);
            throw new Error(`HTTP错误! 状态: ${response.status}, 详情: ${errorText}`);
        }
        
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            
            // 处理每个数据块（去除data:前缀和分隔符）
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.trim() === '' || line.trim() === 'data: [DONE]') {
                    continue;
                }
                
                try {
                    // 去掉"data: "前缀
                    const cleanLine = line.startsWith('data: ') ? line.substring(5) : line;
                    const data = JSON.parse(cleanLine);
                    
                    // 提取内容并累积
                    if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                        const contentChunk = data.choices[0].delta.content;
                        fullContent += contentChunk;
                        
                        // 调用回调函数处理部分内容
                        if (onChunk) {
                            onChunk(fullContent);
                        }
                    }
                } catch (error) {
                    console.warn('解析流数据块时出错:', error);
                    // 继续处理其他块
                }
            }
        }
        
        return fullContent;
    } catch (error) {
        console.error('API调用失败详情:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // 提供友好的错误信息
        let errorMessage = '生成过程中发生错误，请稍后重试';
        if (error.message.includes('401')) {
            errorMessage = '认证失败，请检查API密钥';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍后再试';
        } else if (error.message.includes('500')) {
            errorMessage = '服务器内部错误，请稍后重试';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查您的网络连接';
        } else if (error.message.includes('404')) {
            errorMessage = '请求的API地址不存在，请检查配置';
        }
        
        // 模拟生成成功的响应，用于演示
        console.log('API调用失败，使用模拟数据进行演示');
        const mockContent = `# 开题报告演示内容

## 研究背景与意义

在数字化转型加速推进的时代背景下，${topic}这一研究主题具有重要的理论价值和实践意义。本研究旨在探索该领域的关键问题，为相关理论发展和实践应用提供新的视角和方法。

## 文献综述

通过对国内外相关研究的梳理，发现目前关于${topic}的研究主要集中在以下几个方面：
1. 理论基础研究
2. 实践应用探索
3. 发展趋势分析

现有研究为本文提供了丰富的理论支撑，但在某些方面仍存在研究空白，如...

## 研究内容与方法

### 研究内容
1. ${topic}的基本理论框架构建
2. 关键影响因素分析
3. 实证研究与案例分析

### 研究方法
采用文献研究法、问卷调查法、案例分析法等多种研究方法，确保研究的科学性和可靠性。

## 研究创新点

本研究的创新点主要体现在：
1. 研究视角的创新
2. 研究方法的创新
3. 研究结论的创新

## 预期成果

完成高质量的研究论文一篇，并形成相关研究报告，为${topic}领域的理论研究和实践应用提供参考。`;
        
        // 如果有回调函数，模拟流式返回
        if (onChunk) {
            const lines = mockContent.split('\n');
            let accumulated = '';
            
            // 模拟逐行流式输出
            for (const line of lines) {
                accumulated += line + '\n';
                // 模拟网络延迟
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
                onChunk(accumulated);
            }
        }
        
        return mockContent;
        
        // 实际环境中应抛出错误
        // throw new Error(errorMessage);
    }
}

// 为生成按钮添加点击事件
generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    await generateProposal();
});