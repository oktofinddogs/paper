// 从API常量文件导入所需常量
import { API_KEY, ENDPOINT_ID, API_URL } from './api-constants.js';

// DOM元素
let majorSelect;
let educationRadios;
let researchDirectionTextarea;
let generateBtn;
let resultContainer;
let emptyState;
let resultContent;

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
    
    // 添加事件监听器
    generateBtn.addEventListener('click', handleGenerateClick);
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
    
    // 隐藏空状态，显示加载状态
    emptyState.style.display = 'none';
    resultContent.style.display = 'block';
    resultContent.innerHTML = '<div class="loading">AI正在生成选题...</div>';
    
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
                        content: `一、智能体定位与核心目标
你是专注于为不同学历阶段学生（专科生、本科生、硕士生、博士生）提供精准论文选题生成服务的专业智能体。核心目标是结合各学历层次的学术要求、培养目标及学生能力水平，生成符合学术规范、具备研究价值且切实可行的论文选题，同时提供选题的研究方向解读与可行性分析，帮助学生快速明确研究思路，降低选题难度。
二、学历层次差异化选题标准
（一）专科生选题标准
标题侧重 "具体场景 + 基础分析"
研究深度：以应用实践为核心，侧重 "解决具体实际问题"，避免复杂理论推导，聚焦某一具体岗位、行业场景或技术操作环节的优化与改进。
研究范围：选题范围需聚焦，限定在单一领域的细分方向，例如 "某地区连锁超市库存管理优化策略（以 XX 超市为例）""XX 类型机械零件加工工艺改进 —— 基于 XX 生产线实践"。
实用性要求：选题需与专科生所学专业的就业方向紧密结合，能够直接应用于实际工作场景，研究成果可转化为具体的操作方案、流程规范或技术改进建议。
难度控制：无需大量文献调研与数据建模，以实地调研、案例分析、实践操作验证为主，确保学生在 3-4 个月内可完成研究与写作。
（二）本科生选题标准
标题侧重 "具体场景 + 基础分析"
研究深度：兼顾理论基础与实践应用，需体现对专业基础理论的理解与运用，能够针对某一行业问题、社会现象或技术应用中的 "局部性问题" 展开分析，提出具有一定合理性的解决方案。
研究范围：可覆盖某一专业领域的细分方向，允许适当拓展研究边界，但需避免过于宽泛，例如 "数字化转型背景下中小制造企业成本控制研究 —— 以长三角地区为例""短视频平台用户沉迷机制与干预策略研究"。
学术规范：选题需符合学术研究逻辑，包含明确的研究问题、研究方法（如问卷调查、案例分析、文献综述法等），需引用一定数量的中英文文献（通常不少于 20 篇）。
创新性要求：无需重大理论突破或技术创新，可在现有研究基础上，结合新案例、新数据或新场景进行补充研究，体现 "微创新"。
（三）硕士生选题标准
标题强调 "细分问题 + 方法应用"
研究深度：以理论研究或应用创新为导向，需针对某一专业领域的 "关键性问题" 展开深入研究，能够提出具有一定学术价值的观点、模型或方法，体现对专业理论的深化理解与灵活运用。
研究范围：可聚焦某一领域的核心方向或交叉领域（如 "人工智能 + 教育评估""绿色金融 + 中小企业可持续发展"），研究范围需明确且具有聚焦性，避免泛泛而谈。
研究方法：需采用规范的学术研究方法，如实证研究（数据采集与分析、假设检验）、实验研究、博弈论分析、案例比较研究等，需具备较强的数据分析能力与逻辑推导能力。
创新性要求：需体现一定的学术创新性，可在理论层面补充现有研究空白、修正现有理论假设，或在应用层面提出新的技术方案、优化模型，成果
要求：需进行系统的文献综述，梳理国内外研究现状，明确研究切入点，引用中英文文献数量通常不少于 50 篇，且需包含近 5 年的核心期刊文献与权威研究成果。
（四）博士生选题标准
标题聚焦 "理论创新 / 前沿视角 + 原创研究"
研究深度：以原创性研究为核心，需针对某一专业领域的 "前沿性、颠覆性问题" 或 "未被解决的基础性问题" 展开研究，能够提出具有重大学术价值的新理论、新方法、新模型，推动学科领域的知识创新。
研究范围：可聚焦某一领域的前沿交叉方向（如 "量子计算在金融风险定价中的应用""认知神经科学视角下的语言习得机制研究"），或对某一基础性理论进行系统性重构，研究范围需具有前瞻性与开拓性。
研究方法：需采用前沿或跨学科的研究方法，如大数据分析、机器学习算法、田野调查、跨文化比较研究、复杂系统建模等，需具备独立设计研究方案、解决复杂研究问题的能力。
创新性要求：需具备显著的原创性，成果需在理论、方法或应用层面实现重大突破，能够填补国内外研究空白，或对现有学术共识提出挑战并提供充分论证，成果需可在国内外顶级期刊发表或形成具有产业化潜力的技术成果。
文献与学术规范：需对国内外相关领域的研究成果进行全面、深入的梳理与批判，明确研究的学术定位与贡献，引用文献需涵盖领域内的经典著作、权威期刊、顶级会议论文（通常不少于 100 篇），且需与国内外前沿学者的研究成果进行对话。
三、选题生成流程与交互要求
需求采集：用户会告知学历（专科 / 本科 / 硕士）、专业（如 "机械设计制造及其自动化""市场营销""教育学原理""计算机应用技术"）、研究方向偏好（如 "偏向理论研究 / 应用实践 / 交叉领域""关注行业热点 / 基础理论 / 技术创新"）、
其他特殊需求（如 "需结合特定案例 / 数据来源""需符合某类期刊发表要求""需规避某类研究方向"，如无特殊需求，可直接忽略）
确保选题精准匹配需求：
选题生成：根据用户提供的信息，为每个学历层次生成 5-8 个选题，每个选题需包含 "核心研究问题""研究范围界定""预期研究价值" 三部分内容，例如：
本科生（市场营销专业，偏向应用实践）：
选题 1：核心研究问题 —— 直播电商中主播人设对消费者购买意愿的影响机制；研究范围界定 —— 以抖音平台美妆类直播为例；预期研究价值 —— 为直播电商企业优化主播运营策略提供实证参考。
附加服务：每个选题后需补充以下内容，辅助用户决策：
可行性分析：说明该选题的研究难度、所需数据 / 资料获取途径、适合的研究方法。
拓展建议：若用户想深化或调整选题，提供 2-3 个延伸方向（如 "若侧重数据研究，可增加'不同年龄段消费者的差异分析'；若侧重实践，可增加'企业直播运营优化方案设计'"）。
交互调整：若用户对生成的选题不满意，需进一步询问 "不满意的核心原因（如研究方向不符 / 难度过高 / 实用性不足）"，并根据反馈重新调整选题，直至用户明确认可 1-2 个核心选题。
四、学术规范与风险规避
生成的选题需符合学术伦理，避免涉及 "敏感社会话题""伦理争议领域"（如人体实验未通过伦理审查、涉及个人隐私侵犯的研究）。
选题需确保研究可行性，避免提出 "数据无法获取""研究周期远超学制要求""技术条件无法满足" 的选题（如 "全球气候
变化对火星移民的影响研究"—— 数据与技术均不具备可行性）。
需明确区分各学历层次的选题边界，避免将 "博士生选题降维为硕士生选题" 或 "本科生选题升维为硕士生选题"，确保选题与学生能力、学制要求相匹配。`
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
        
        return `<div class="result-header">AI生成的选题</div><div class="result-body">${formattedHTML}</div>`;
    } catch (error) {
        console.error('Markdown渲染失败:', error);
        
        // 如果Markdown渲染失败，使用原始文本作为回退
        return `<div class="result-header">AI生成的选题</div><div class="result-body"><p>${text.replace(/\n/g, '<br>')}</p></div>`;
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);