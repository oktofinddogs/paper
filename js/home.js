document.addEventListener('DOMContentLoaded', function() {

        // 获取弹窗相关元素
        const createProjectBtn = document.getElementById('create-project-btn');
        const modalOverlay = document.getElementById('project-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelCreateProjectBtn = document.getElementById('cancel-create-project');
        const modalForm = document.getElementById('project-form');

        // 检查元素是否存在，避免空引用错误
        if (createProjectBtn && modalOverlay && closeModalBtn && cancelCreateProjectBtn && modalForm) {
            // 创建我的论文项目按钮点击事件 - 显示弹窗
            createProjectBtn.addEventListener('click', function() {
                // 添加入场动画
                modalOverlay.classList.add('show');
                // 阻止页面滚动
                document.body.style.overflow = 'hidden';
            });

            // 关闭弹窗函数
            function closeModal() {
                modalOverlay.classList.remove('show');
                // 恢复页面滚动
                document.body.style.overflow = 'auto';
            }

            // 点击关闭按钮关闭弹窗
            closeModalBtn.addEventListener('click', closeModal);

            // 点击取消按钮关闭弹窗
            cancelCreateProjectBtn.addEventListener('click', closeModal);

            // 点击遮罩层关闭弹窗
            modalOverlay.addEventListener('click', function(event) {
                if (event.target === modalOverlay) {
                    closeModal();
                }
            });

            // 按下ESC键关闭弹窗
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && modalOverlay.classList.contains('show')) {
                    closeModal();
                }
            });

            // 表单提交事件
            modalForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                // 获取表单数据
                const projectName = document.getElementById('project-name').value;
                const major = document.getElementById('project-major').value;
                const education = document.querySelector('input[name="education"]:checked')?.value;
                
                // 简单验证
                if (!projectName || !major || !education) {
                    alert('请填写完整的项目信息');
                    return;
                }
                
                // 这里可以添加处理表单数据的逻辑
                console.log('项目名称:', projectName);
                console.log('专业:', major);
                console.log('学历:', education);
                
                // 存储表单数据到localStorage
                localStorage.setItem('projectName', projectName);
                localStorage.setItem('major', major);
                localStorage.setItem('education', education);
                
                // 设置全局变量
                window.globalProjectName = projectName;
                window.globalMajor = major;
                window.globalEducation = education;
                
                // 提交成功后跳转到论文项目进度页面
                window.location.href = 'project-progress.html';
            });

            // 表单元素添加交互效果
            const formInputs = modalForm.querySelectorAll('input, select');
            formInputs.forEach(input => {
                input.addEventListener('focus', function() {
                    this.parentElement.classList.add('focused');
                });
                
                input.addEventListener('blur', function() {
                    this.parentElement.classList.remove('focused');
                });
            });
        }

        // 登录/注册按钮点击事件
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // 这里可以添加登录/注册逻辑
                alert('登录/注册功能正在开发中');
            });
        }

        // 添加滚动动画效果
        function handleScroll() {
            const scrollPosition = window.scrollY;
            const heroTitle = document.querySelector('.hero-title');
            const createProjectBtn = document.querySelector('.create-project-btn');
            
            if (heroTitle) {
                heroTitle.style.opacity = 1 - scrollPosition * 0.002;
                heroTitle.style.transform = `translateY(${scrollPosition * 0.2}px)`;
            }
            
            if (createProjectBtn) {
                createProjectBtn.style.opacity = 1 - scrollPosition * 0.002;
                createProjectBtn.style.transform = `translateY(${scrollPosition * 0.1}px)`;
            }
        }

        // 监听滚动事件
        window.addEventListener('scroll', handleScroll);

        // 添加页面加载动画
        document.body.classList.add('loaded');

        // 添加键盘快捷键支持
        document.addEventListener('keydown', function(e) {
            // 按下Enter键创建项目
            if (createProjectBtn && (!modalOverlay || !modalOverlay.classList.contains('show'))) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    createProjectBtn.click();
                }
            }
        });
});