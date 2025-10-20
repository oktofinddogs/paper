// 定义API相关常量
const API_KEY = 'bd747896-e89b-46f4-a5ab-0a232d086845';
const ENDPOINT_ID = 'ep-20251015101857-wc8xz';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 读取文件内容的函数
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // 根据文件类型选择不同的读取方式
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // 对于PDF文件，我们只能提供基本支持，实际项目中可能需要专门的PDF解析库
            reject(new Error('PDF文件解析需要专门的库支持，请使用文本文件或Word文档。'));
            return;
        } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            // 对于Word文档，我们也只能提供基本支持，实际项目中可能需要专门的解析库
            reject(new Error('Word文档解析需要专门的库支持，请使用文本文件。'));
            return;
        } else {
            // 默认尝试以文本方式读取
            reader.readAsText(file);
        }
        
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        
        reader.onerror = (event) => {
            reject(new Error('文件读取失败'));
        };
    });
}

// 定义chatWithDoubao方法，支持流式输出
async function chatWithDoubao(userMessage, onChunkReceived) {
    try {
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
                        content: '你是一位专业的AI论文小助手，你的任务是根据题目等生成本科学位论文选题报告'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                stream: true  // 启用流式输出
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 获取响应体的可读流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        // 逐块读取和处理数据
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解码接收到的数据块
            const chunk = decoder.decode(value, { stream: true });
            
            // 处理接收到的数据块（这里需要根据实际的流格式进行解析）
            // 通常流式响应的每一行是一个JSON对象，以data:开头
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data:')) {
                    try {
                        // 去除data:前缀并解析JSON
                        const jsonData = JSON.parse(line.substring(5).trim());
                        
                        // 检查是否包含内容
                        if (jsonData.choices && jsonData.choices[0] && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                            const contentChunk = jsonData.choices[0].delta.content;
                            fullResponse += contentChunk;
                            
                            // 调用回调函数，实时更新UI
                            if (onChunkReceived) {
                                onChunkReceived(fullResponse);
                            }
                        }
                    } catch (e) {
                        console.error('解析JSON失败:', e);
                    }
                }
            }
        }

        console.log('AI回复(完整):', fullResponse);
        return fullResponse;
    } catch (error) {
        console.error('调用失败:', error.message);
        alert('API调用失败，请检查控制台错误信息');
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const researchDirection = document.getElementById('research-direction');
    const characterCount = document.querySelector('.character-count');
    const generateBtn = document.getElementById('generate-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const emptyState = document.querySelector('.empty-state');
    const resultContent = document.getElementById('result-content');
    
    // 初始化字符计数
    updateCharacterCount();
    
    // 添加文本区域输入事件监听
    researchDirection.addEventListener('input', function() {
        updateCharacterCount();
    });
    
    // 添加上传文件按钮点击事件监听
        uploadBtn.addEventListener('click', function() {
            // 创建一个隐藏的input[type=file]元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.txt,.doc,.docx,.pdf'; // 限制文件类型
            
            // 监听文件选择事件
            fileInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                // 显示上传中的状态
                uploadBtn.disabled = true;
                uploadBtn.textContent = '上传中...';
                
                try {
                    // 读取文件内容（简单实现，实际项目中可能需要更复杂的文件处理）
                    const fileContent = await readFileContent(file);
                    
                    // 这里可以根据文件类型和内容做进一步处理
                    // 例如，提取文件中的关键信息填充到研究方向输入框
                    if (fileContent.length > 0) {
                        // 如果文件内容过长，只截取前100个字符
                        const displayContent = fileContent.length > 100 ? 
                            fileContent.substring(0, 100) + '...' : 
                            fileContent;
                        researchDirection.value = displayContent;
                        updateCharacterCount();
                        
                        alert('文件上传成功！已提取关键信息到研究方向输入框。\n\n注意：由于文件内容可能较长，系统已自动截取前100个字符。');
                    } else {
                        alert('文件内容为空，请选择其他文件。');
                    }
                } catch (error) {
                    console.error('文件读取失败:', error);
                    alert('文件读取失败，请检查文件格式是否支持。');
                } finally {
                    // 恢复按钮状态
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = '上传文件';
                }
            });
            
            // 触发文件选择对话框
            fileInput.click();
        });
        
        // 添加按钮点击事件监听
        generateBtn.addEventListener('click', async function() {
        // 获取textarea中的内容
        const userInput = researchDirection.value.trim();
        
        // 检查输入是否为空
        if (!userInput) {
            alert('请输入研究方向');
            return;
        }
        
        // 调用chatWithDoubao方法，传入textarea中的内容和回调函数
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';
        
        // 隐藏空状态，显示结果内容区域
        emptyState.style.display = 'none';
        resultContent.style.display = 'block';
        resultContent.innerHTML = '<p style="color: #666;">AI正在生成内容...</p>';
        
        // 定义流式更新的回调函数
        const onChunkReceived = (partialResponse) => {
            // 实时格式化并显示部分响应
            resultContent.innerHTML = formatResultForDisplay(partialResponse);
            // 自动滚动到底部，确保用户能看到最新内容
            resultContent.scrollTop = resultContent.scrollHeight;
        };
        
        const result = await chatWithDoubao(userInput, onChunkReceived);
        
        generateBtn.disabled = false;
        generateBtn.textContent = '立即生成';
        
        if (!result) {
            // 如果生成失败，恢复空状态
            emptyState.style.display = 'block';
            resultContent.style.display = 'none';
        }
    });
    
    // 更新字符计数函数
    function updateCharacterCount() {
        const currentLength = researchDirection.value.length;
        const maxLength = researchDirection.maxLength;
        characterCount.textContent = `${currentLength}/${maxLength}`;
        
        // 根据字符数量改变计数的颜色
        if (currentLength > maxLength * 0.9) {
            characterCount.style.color = '#e74c3c';
        } else if (currentLength > maxLength * 0.7) {
            characterCount.style.color = '#f39c12';
        } else {
            characterCount.style.color = '#888';
        }
    }
    
    // 格式化AI返回的结果为HTML，支持Markdown格式
    function formatResultForDisplay(text) {
        try {
            // 创建markdown-it实例
            const md = window.markdownit();
            
            // 使用markdown-it渲染Markdown文本为HTML
            const formattedHTML = md.render(text);
            
            return formattedHTML;
        } catch (error) {
            console.error('Markdown渲染失败:', error);
            
            // 如果Markdown渲染失败，使用原始文本作为回退
            return `<p>${text.replace(/\n/g, '<br>')}</p>`;
        }
    }
});