// 从API常量文件导入所需常量
import { API_KEY, ENDPOINT_ID, API_URL, TOPIC_APPRAISAL_PROMPT, PROJECT_PROPOSAL_PROMPT, TOPIC_SELECTION_PROMPT } from './api-constants.js';

// DOM元素
let majorSelect;
let educationRadios;
let researchDirectionTextarea;
let generateBtn;
let resultContainer;
let emptyState;
let resultContent;
let pageTitle;

// 全局变量存储URL参数
let currentPrompt = null;
let pageParams = {};

// 初始化函数
function init() {
    // 获取DOM元素
    majorSelect = document.getElementById('major');
    educationRadios = document.querySelectorAll('input[name="education"]');
    researchDirectionTextarea = document.getElementById('research-direction');
    generateBtn = document.getElementById('generate-btn');
    resultContainer = document.getElementById('result-container');
    emptyState = resultContainer.querySelector('.empty-state');
    resultContent = document.getElementById('result-content');
    pageTitle = document.getElementById('page-title');
    
    // 解析URL参数
    parseUrlParams();
    
    // 根据URL参数初始化页面
    initializePageFromParams();
    
    // 添加事件监听器
    generateBtn.addEventListener('click', handleGenerateClick);
}

// 解析URL参数
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 获取标题参数
    const title = urlParams.get('title');
    if (title) {
        pageParams.title = title;
    }
    
    // 获取提示词参数（提示词常量名）
    const promptName = urlParams.get('prompt');
    if (promptName) {
        // 根据提示词名称选择对应的提示词
        if (promptName === 'PROJECT_PROPOSAL_PROMPT') {
            currentPrompt = PROJECT_PROPOSAL_PROMPT;
        } else if (promptName === 'TOPIC_SELECTION_PROMPT') {
            currentPrompt = TOPIC_SELECTION_PROMPT;
        } else {
            currentPrompt = TOPIC_SELECTION_PROMPT;
        }
        pageParams.promptName = promptName;
    }
    
    // 获取其他参数（项目信息）
    pageParams.projectName = urlParams.get('projectName') || '';
    pageParams.major = urlParams.get('major') || '';
    pageParams.education = urlParams.get('education') || '';
}

// 根据URL参数初始化页面
function initializePageFromParams() {
    // 如果有标题参数，更新页面标题
    if (pageParams.title && pageTitle) {
        pageTitle.textContent = pageParams.title;
    }
    
    // 如果是AI开题报告,修改标签和提示文本
    if (pageParams.promptName === 'PROJECT_PROPOSAL_PROMPT') {
        const researchLabel = document.querySelector('label[for="research-direction"]');
        const researchTextarea = document.getElementById('research-direction');
        
        if (researchLabel) {
            researchLabel.textContent = '论文标题';
        }
        
        if (researchTextarea) {
            researchTextarea.placeholder = '请输入论文标题';
        }
    }
    
    // 如果有专业参数，预填充专业下拉框
    if (pageParams.major && majorSelect) {
        // 查找匹配的选项
        for (let i = 0; i < majorSelect.options.length; i++) {
            if (majorSelect.options[i].value === pageParams.major) {
                majorSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // 如果有学历参数，预选择学历单选按钮
    if (pageParams.education && educationRadios) {
        educationRadios.forEach(radio => {
            if (radio.value === pageParams.education) {
                radio.checked = true;
            }
        });
    }
}

// 获取选中的学历
function getSelectedEducation() {
    for (const radio of educationRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return '本科'; // 默认值
}

// 验证用户输入
function validateInput() {
    const major = majorSelect.value;
    const researchDirection = researchDirectionTextarea.value.trim();
    
    // 验证专业选择
    if (!major) {
        alert('请选择论文专业');
        return false;
    }
    
    // 验证研究方向输入
    if (!researchDirection) {
        alert('请输入研究方向');
        return false;
    }
    
    if (researchDirection.length > 100) {
        alert('研究方向不能超过100字');
        return false;
    }
    
    return true;
}

// 处理生成按钮点击事件
async function handleGenerateClick() {
    // 验证用户输入
    if (!validateInput()) {
        return;
    }
    
    // 获取用户输入
    const major = majorSelect.options[majorSelect.selectedIndex].text;
    const education = getSelectedEducation();
    const researchDirection = researchDirectionTextarea.value.trim();
    
    // 显示生成中的状态
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    
    // 隐藏空状态,显示加载状态
    emptyState.style.display = 'none';
    resultContent.style.display = 'block';
    const loadingText = pageParams.title ? `AI正在生成${pageParams.title}...` : 'AI正在生成选题...';
    resultContent.innerHTML = `<div class="loading">${loadingText}</div>`;
    
    try {
        // 创建一个容器来显示流式内容
        const streamingContainer = document.createElement('div');
        streamingContainer.className = 'streaming-content';
        
        // 回调函数处理流式内容块
        const onChunkReceived = (partialContent) => {
            // 更新结果显示
            resultContent.innerHTML = formatResultForDisplay(partialContent);
        };
        
        // 调用API生成选题（流式）
        const finalResult = await generateTopics(major, education, researchDirection, onChunkReceived);
        
        // 确保最终结果正确格式化
        if (finalResult) {
            resultContent.innerHTML = formatResultForDisplay(finalResult);
        } else {
            resultContent.innerHTML = '<div class="error">生成失败，请稍后重试</div>';
        }
    } catch (error) {
        console.error('生成选题失败:', error);
        resultContent.innerHTML = `<div class="error">生成失败：${error.message}</div>`;
    } finally {
        // 恢复按钮状态
        generateBtn.disabled = false;
        generateBtn.textContent = '立即生成';
    }
}

// 调用API生成选题 - 支持流式响应
async function generateTopics(major, education, researchDirection, onChunk) {
    try {
        // 构建包含专业和学历信息的完整用户消息
        const fullUserMessage = `专业：${major}\n学历：${education}\n研究方向：${researchDirection}`;
        
        // 确定使用哪个提示词：如果有URL参数指定的提示词则使用它，否则使用默认的TOPIC_APPRAISAL_PROMPT
        const systemPrompt = currentPrompt || TOPIC_SELECTION_PROMPT;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: ENDPOINT_ID,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: fullUserMessage
                    }
                ],
                stream: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
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
        console.error('调用AI API失败:', error);
        throw error;
    }
}

// 格式化AI返回的结果为HTML，支持Markdown格式
function formatResultForDisplay(text) {
    try {
        // 创建markdown-it实例
        const md = window.markdownit();
        
        // 使用markdown-it渲染Markdown文本为HTML
        const formattedHTML = md.render(text);
        
        // 根据URL参数中的标题动态设置结果头部文本
        const headerText = pageParams.title ? `AI生成的${pageParams.title}` : 'AI生成的选题';
        
        return `<div class="result-header">${headerText}</div><div class="result-body">${formattedHTML}</div>`;
    } catch (error) {
        console.error('Markdown渲染失败:', error);
        
        // 根据URL参数中的标题动态设置结果头部文本
        const headerText = pageParams.title ? `AI生成的${pageParams.title}` : 'AI生成的选题';
        
        // 如果Markdown渲染失败，使用原始文本作为回退
        return `<div class="result-header">${headerText}</div><div class="result-body"><p>${text.replace(/\n/g, '<br>')}</p></div>`;
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);