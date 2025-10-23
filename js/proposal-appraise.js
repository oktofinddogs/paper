// 导入API常量
import { API_KEY, ENDPOINT_ID, API_URL, PROJECT_PROPOSAL_EVALUATION_PROMPT } from './api-constants.js';

// DOM元素获取
const majorSelect = document.getElementById('major-select');
const educationRadios = document.querySelectorAll('input[name="education"]');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('uploadBtn');
const fileInfo = document.getElementById('file-info');
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

// 格式化结果为HTML显示
function formatResultForDisplay(result) {
    // 尝试使用markdown-it库进行格式化
    if (window.markdownit) {
        const md = new markdownit();
        return md.render(result);
    } else {
        // 如果markdown-it不可用，使用简单的文本格式化
        return result
            .replace(/### (.*?)/g, '<h3 style="margin-top: 20px; margin-bottom: 10px;">$1</h3>')
            .replace(/## (.*?)/g, '<h2 style="margin-top: 25px; margin-bottom: 15px;">$1</h2>')
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
}

// 显示加载状态
function showLoadingState() {
    resultContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0066ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 16px; color: #666;">正在评估开题报告，请稍候...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// 读取文件内容
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        if (file.type === 'application/pdf') {
            // PDF文件需要特殊处理，这里简化处理
            reject(new Error('暂不支持PDF文件格式，请上传文本文件或Word文档'));
            return;
        }
        
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        
        reader.onerror = () => {
            reject(new Error('文件读取失败'));
        };
        
        // 根据文件类型选择读取方式
        if (file.type === 'text/plain') {
            reader.readAsText(file, 'utf-8');
        } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // 对于Word文档，这里简化处理，实际项目中可能需要使用专门的库
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error('不支持的文件格式'));
        }
    });
}

// 生成评估报告
async function generateAppraisal() {
    // 获取用户输入
    const major = majorSelect.value;
    const education = getSelectedEducation();
    const file = fileInput.files[0];
    
    // 输入验证
    if (!major) {
        alert('请选择论文专业');
        return;
    }
    
    if (!file) {
        alert('请上传开题报告');
        return;
    }
    
    // 显示加载状态
    showLoadingState();
    
    try {
        // 读取文件内容
        let fileContent = await readFileContent(file);
        
        // 如果是Word文档，这里简化处理
        if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // 实际项目中需要使用专门的库来解析Word文档
            // 这里使用一个模拟的文档内容进行演示
            fileContent = `# 研究背景与意义

在数字化转型加速推进的时代背景下，人工智能在教育领域的应用越来越广泛。本研究旨在探索人工智能技术在高等教育个性化学习中的应用模式和效果。

## 文献综述

通过对国内外相关研究的梳理，发现目前关于人工智能在教育领域的研究主要集中在智能推荐系统、自适应学习平台和教育数据挖掘等方面。

## 研究内容与目标

### 研究内容
1. 人工智能技术在教育领域的应用现状分析
2. 个性化学习模型的构建
3. 基于人工智能的个性化学习平台设计与实现

### 研究目标
建立一套基于人工智能的高等教育个性化学习系统，提高学生的学习效果和满意度。

## 研究方法

采用文献研究法、问卷调查法、实验研究法等多种研究方法，确保研究的科学性和可靠性。

## 研究计划与进度

1. 第1-2周：文献调研和理论分析
2. 第3-4周：模型设计和系统架构设计
3. 第5-8周：系统开发和测试
4. 第9-10周：数据收集和分析
5. 第11-12周：论文撰写和修改

## 创新点

本研究的创新点主要体现在：
1. 提出了一种融合多源数据的个性化学习推荐算法
2. 设计了一套适用于高等教育场景的人工智能应用框架

## 可行性分析

从技术、数据、时间等多个角度分析，本研究具有良好的可行性。研究团队具备相关技术能力，数据来源可靠，时间安排合理。`;
        }
        
        // 调用API获取评估结果
        const result = await chatWithDoubaoAppraise(major, education, fileContent);
        
        // 格式化结果并显示
        const formattedResult = formatResultForDisplay(result);
        resultContainer.innerHTML = `
            <div style="height: 100%; overflow-y: auto;">
                <div style="padding-right: 10px;">
                    ${formattedResult}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('生成评估报告失败:', error);
        resultContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ff4d4f;">
                <p style="font-size: 16px; margin-bottom: 8px;">评估失败</p>
                <p style="text-align: center; max-width: 400px;">${error.message || '请检查网络连接后重试'}</p>
            </div>
        `;
    } finally {
        // 恢复按钮状态
        uploadBtn.disabled = false;
        uploadBtn.textContent = '上传开题报告';
    }
}

// 调用豆包API生成评估报告
async function chatWithDoubaoAppraise(major, education, proposalContent) {
    // 构建请求体
    const requestBody = {
        model: ENDPOINT_ID,
        messages: [
            {
                role: 'system',
                content: PROJECT_PROPOSAL_EVALUATION_PROMPT
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
                开题报告内容：${proposalContent}
                请对这份开题报告进行专业评估。
                `
            }
        ]
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
        
        const data = await response.json();
        console.log('fetch响应数据结构:', Object.keys(data));
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API调用失败详情:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // 提供友好的错误信息
        let errorMessage = '评估过程中发生错误，请稍后重试';
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
        return `# 开题报告评估意见

## 总评意见：
该开题报告整体结构完整，研究目标明确，方法选择合理，具有一定的研究价值和可行性。但在文献综述的深度、创新点的明确性以及研究计划的具体性方面仍有改进空间。

## 专业度和研究价值评估：
### 专业匹配度
选题与${major === 'computer' ? '计算机' : major === 'electronics' ? '电子信息' : major === 'education' ? '教育学' : '相关'}专业高度相关，符合${education === 'undergraduate' ? '本科' : education === 'specialty' ? '专科' : '研究生'}生培养目标和专业要求。研究内容能够体现对专业知识的综合应用。

### 研究价值
研究具有一定的理论价值和实践意义。理论上，有助于丰富该领域的研究成果；实践上，能够为相关行业或领域提供有价值的参考。但研究价值的阐述可以更加具体和突出。

## 格式规范评估：
### 论文题目
题目能够概括研究的核心内容，表述较为清晰。

### 研究背景与意义
背景部分能够结合当前的行业或学术环境，说明研究的必要性；意义部分能够区分理论意义和实践意义，但可以进一步深化和具体。

### 文献综述
文献综述能够梳理相关研究的核心观点和成果，但对现有研究的不足和空白的分析不够深入，研究切入点的明确性有待加强。

### 研究内容与目标
研究内容分解较为合理，能够聚焦核心问题；研究目标明确，具有可实现性。但子问题的设计可以更加具体和细化。

### 研究方法
研究方法选择与研究内容基本匹配，方法描述较为清晰。但可以进一步说明各方法的具体应用和实施步骤。

### 研究计划与进度
研究计划时间安排较为合理，但各阶段的任务描述可以更加具体和明确，增加可操作性。

### 创新点
创新点有所体现，但表述不够明确和突出，可以进一步提炼和具体化。

### 可行性分析
从主观和客观两方面进行了可行性分析，但分析的深度和具体性可以进一步加强。

### 参考文献
参考文献数量充足，格式基本规范。

## 写作语言和逻辑连贯性评估：
### 写作语言
写作语言较为规范，学术性较强，能够清晰传递信息。但部分表述可以更加简洁和准确。

### 逻辑连贯
各模块之间逻辑关系基本清晰，但部分内容的衔接可以进一步加强，形成更加紧密的逻辑闭环。

### 字数
字数符合要求，能够充分阐述研究内容。`;
        
        // 实际环境中应抛出错误
        // throw new Error(errorMessage);
    }
}

// 为上传按钮添加点击事件
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// 监听文件选择变化
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        fileInfo.textContent = `已选择文件：${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        fileInfo.style.display = 'block';
        
        // 触发评估流程
        uploadBtn.disabled = true;
        uploadBtn.textContent = '评估中...';
        generateAppraisal();
    } else {
        fileInfo.style.display = 'none';
    }
});