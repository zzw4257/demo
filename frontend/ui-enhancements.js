/**
 * DeSci Platform UI Enhancements
 * 生产级用户界面增强功能
 */

class UIEnhancements {
    constructor() {
        this.init();
        this.bindEvents();
        this.setupAnimations();
    }

    init() {
        // 初始化主题和偏好设置
        this.loadUserPreferences();
        this.setupResponsiveDesign();
        this.initializeTooltips();
        this.setupKeyboardShortcuts();

        // 初始化状态指示器
        this.updateStatusIndicators();

        // 初始化表单验证
        this.setupFormValidation();

        // 初始化加载状态
        this.setupLoadingStates();

        // 初始化通知系统
        this.initializeNotifications();
    }

    bindEvents() {
        // 窗口事件
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        // 键盘事件
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // 触摸事件 (移动端)
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }

        // 网络状态事件
        window.addEventListener('online', this.handleNetworkChange.bind(this, true));
        window.addEventListener('offline', this.handleNetworkChange.bind(this, false));
    }

    setupAnimations() {
        // 页面加载动画
        this.animateOnLoad();

        // 滚动触发动画
        this.setupScrollAnimations();

        // 悬停效果
        this.setupHoverEffects();

        // 过渡动画
        this.setupTransitionEffects();
    }

    // 加载用户偏好设置
    loadUserPreferences() {
        const preferences = this.getStoredPreferences();

        // 应用主题
        if (preferences.theme) {
            document.documentElement.setAttribute('data-theme', preferences.theme);
        }

        // 应用语言
        if (preferences.language) {
            this.setLanguage(preferences.language);
        }

        // 应用动画偏好
        if (preferences.reduceMotion) {
            document.documentElement.setAttribute('data-reduced-motion', 'true');
        }

        // 应用字体大小
        if (preferences.fontSize) {
            document.documentElement.setAttribute('data-font-size', preferences.fontSize);
        }
    }

    // 获取存储的偏好设置
    getStoredPreferences() {
        try {
            const stored = localStorage.getItem('desci-preferences');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('无法加载用户偏好设置:', error);
            return {};
        }
    }

    // 保存用户偏好设置
    savePreferences(preferences) {
        try {
            localStorage.setItem('desci-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('无法保存用户偏好设置:', error);
        }
    }

    // 设置语言
    setLanguage(language) {
        document.documentElement.setAttribute('lang', language);
        // 这里可以实现多语言切换逻辑
        this.savePreferences({ ...this.getStoredPreferences(), language });
    }

    // 响应式设计设置
    setupResponsiveDesign() {
        const updateResponsiveClasses = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // 移除旧的响应式类
            document.body.classList.remove('mobile', 'tablet', 'desktop', 'large-screen');

            // 添加新的响应式类
            if (width <= 768) {
                document.body.classList.add('mobile');
            } else if (width <= 1024) {
                document.body.classList.add('tablet');
            } else if (width <= 1440) {
                document.body.classList.add('desktop');
            } else {
                document.body.classList.add('large-screen');
            }

            // 高度类
            if (height <= 600) {
                document.body.classList.add('short-screen');
            }
        };

        updateResponsiveClasses();
        window.addEventListener('resize', updateResponsiveClasses);
    }

    // 初始化工具提示
    initializeTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');

        tooltips.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip.bind(this));
            element.addEventListener('mouseleave', this.hideTooltip.bind(this));
            element.addEventListener('focus', this.showTooltip.bind(this));
            element.addEventListener('blur', this.hideTooltip.bind(this));
        });
    }

    // 显示工具提示
    showTooltip(event) {
        const element = event.target;
        const tooltipText = element.getAttribute('data-tooltip');

        if (!tooltipText) return;

        // 移除现有工具提示
        this.hideTooltip();

        // 创建工具提示元素
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;

        document.body.appendChild(tooltip);

        // 定位工具提示
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // 确保工具提示在视窗内
        if (top < 10) {
            top = rect.bottom + 10;
            tooltip.classList.add('tooltip-bottom');
        } else {
            tooltip.classList.add('tooltip-top');
        }

        if (left < 10) {
            left = 10;
        } else if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        // 存储引用
        element._tooltip = tooltip;
    }

    // 隐藏工具提示
    hideTooltip(event) {
        const element = event ? event.target : null;

        if (element && element._tooltip) {
            element._tooltip.remove();
            delete element._tooltip;
        } else {
            // 隐藏所有工具提示
            document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
        }
    }

    // 设置键盘快捷键
    setupKeyboardShortcuts() {
        const shortcuts = {
            'Escape': () => this.handleEscape(),
            'Control+r': () => this.refreshData(),
            'Control+/': () => this.showHelp(),
            'Control+b': () => this.toggleBlockchainView(),
            'Control+a': () => this.toggleAnalyticsView(),
            'Control+d': () => this.toggleDemoMode(),
            'F11': () => this.toggleFullscreen(),
            'Control+Shift+I': () => this.openDevTools(),
        };

        document.addEventListener('keydown', (event) => {
            const key = event.key;
            const ctrl = event.ctrlKey;
            const shift = event.shiftKey;
            const alt = event.altKey;

            let shortcut = key;

            if (ctrl) shortcut = `Control+${shortcut}`;
            if (shift) shortcut = `Shift+${shortcut}`;
            if (alt) shortcut = `Alt+${shortcut}`;

            if (shortcuts[shortcut]) {
                event.preventDefault();
                shortcuts[shortcut]();
            }
        });
    }

    // 处理键盘快捷键
    handleKeyboard(event) {
        // 数字键切换标签页
        if (event.key >= '1' && event.key <= '4' && !event.ctrlKey && !event.altKey) {
            const tabs = ['dashboard', 'research', 'blockchain', 'analytics'];
            const tabIndex = parseInt(event.key) - 1;

            if (tabs[tabIndex]) {
                this.switchTab(tabs[tabIndex]);
            }
        }
    }

    // 处理Escape键
    handleEscape() {
        // 关闭模态框
        const modals = document.querySelectorAll('.modal, .overlay');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });

        // 隐藏工具提示
        this.hideTooltip();
    }

    // 刷新数据
    refreshData() {
        this.showNotification('正在刷新数据...', 'info');
        // 触发数据刷新逻辑
        if (window.refreshAllData) {
            window.refreshAllData();
        }
        this.showNotification('数据已刷新', 'success');
    }

    // 显示帮助
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal help-modal';
        helpModal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>键盘快捷键帮助</h3>
                    <button onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl+R</kbd>
                            <span>刷新数据</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>关闭模态框</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>1-4</kbd>
                            <span>切换标签页</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+B</kbd>
                            <span>切换区块链视图</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl+A</kbd>
                            <span>切换数据分析视图</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>F11</kbd>
                            <span>切换全屏</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);
    }

    // 切换标签页
    switchTab(tabName) {
        if (window.switchTab) {
            window.switchTab(tabName);
        }
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    // 更新状态指示器
    updateStatusIndicators() {
        const updateStatus = () => {
            // 区块链连接状态
            const blockchainStatus = document.getElementById('blockchainStatus');
            if (blockchainStatus) {
                const isConnected = window.isBlockchainConnected ? window.isBlockchainConnected() : false;
                blockchainStatus.className = isConnected ? 'status-online' : 'status-offline';
                blockchainStatus.innerHTML = `<i class="fas fa-circle"></i> ${isConnected ? '已连接' : '未连接'}`;
            }

            // API状态
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
                apiStatus.className = 'status-online';
                apiStatus.innerHTML = '<i class="fas fa-circle"></i> 正常';
            }

            // 数据同步状态
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.className = 'status-good';
                syncStatus.innerHTML = '<i class="fas fa-circle"></i> 最新';
            }
        };

        updateStatus();
        setInterval(updateStatus, 30000); // 每30秒更新一次
    }

    // 设置表单验证
    setupFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!this.validateForm(form)) {
                    event.preventDefault();
                    this.showNotification('请检查表单填写是否正确', 'error');
                }
            });

            // 实时验证
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    // 验证表单
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // 验证字段
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('data-field-name') || field.name || field.id;

        // 清除之前的错误
        this.clearFieldError(field);

        // 必填验证
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, `${fieldName}不能为空`);
            return false;
        }

        // 邮箱验证
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, '请输入有效的邮箱地址');
                return false;
            }
        }

        // URL验证
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                this.showFieldError(field, '请输入有效的URL地址');
                return false;
            }
        }

        // 长度验证
        const minLength = field.getAttribute('minlength');
        const maxLength = field.getAttribute('maxlength');

        if (minLength && value.length < parseInt(minLength)) {
            this.showFieldError(field, `${fieldName}至少需要${minLength}个字符`);
            return false;
        }

        if (maxLength && value.length > parseInt(maxLength)) {
            this.showFieldError(field, `${fieldName}不能超过${maxLength}个字符`);
            return false;
        }

        return true;
    }

    // 显示字段错误
    showFieldError(field, message) {
        field.classList.add('error');

        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    // 清除字段错误
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // 设置加载状态
    setupLoadingStates() {
        // 为所有按钮添加加载状态
        const buttons = document.querySelectorAll('button[type="submit"], .btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.form || button.classList.contains('async-action')) {
                    this.setButtonLoading(button, true);
                }
            });
        });
    }

    // 设置按钮加载状态
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
            button.classList.remove('loading');
        }
    }

    // 初始化通知系统
    initializeNotifications() {
        // 创建通知容器
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    // 显示通知
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getNotificationIcon(type);

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    // 设置触摸事件
    setupTouchEvents() {
        // 滑动切换标签页
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (event) => {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
        });

        document.addEventListener('touchend', (event) => {
            if (!startX || !startY) return;

            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // 水平滑动距离大于垂直滑动距离，且水平距离足够大
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                const tabs = ['dashboard', 'research', 'blockchain', 'analytics'];
                const currentTab = document.querySelector('.tab-btn.active');
                const currentIndex = currentTab ? Array.from(document.querySelectorAll('.tab-btn')).indexOf(currentTab) : 0;

                if (diffX > 0 && currentIndex < tabs.length - 1) {
                    // 向左滑动，切换到下一个标签页
                    this.switchTab(tabs[currentIndex + 1]);
                } else if (diffX < 0 && currentIndex > 0) {
                    // 向右滑动，切换到上一个标签页
                    this.switchTab(tabs[currentIndex - 1]);
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    // 处理网络状态变化
    handleNetworkChange(isOnline) {
        if (isOnline) {
            this.showNotification('网络连接已恢复', 'success');
            this.refreshData();
        } else {
            this.showNotification('网络连接已断开，请检查网络设置', 'error');
        }
    }

    // 处理窗口大小变化
    handleResize() {
        // 重新计算响应式布局
        this.setupResponsiveDesign();

        // 重新定位工具提示
        document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
    }

    // 处理滚动
    handleScroll() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');

        // 头部滚动效果
        if (header) {
            if (scrolled > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // 触发滚动动画
        this.triggerScrollAnimations();
    }

    // 处理页面卸载
    handleBeforeUnload(event) {
        // 保存用户状态
        const currentTab = document.querySelector('.tab-btn.active');
        if (currentTab) {
            const tabName = currentTab.getAttribute('data-tab');
            this.savePreferences({ ...this.getStoredPreferences(), lastTab: tabName });
        }

        // 显示离开确认（如果有未保存的数据）
        const hasUnsavedData = document.querySelector('form[data-has-changes="true"]');
        if (hasUnsavedData) {
            event.preventDefault();
            event.returnValue = '您有未保存的数据，确定要离开吗？';
        }
    }

    // 页面加载动画
    animateOnLoad() {
        const elements = document.querySelectorAll('.stat-card, .action-btn, .status-item');

        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';

            setTimeout(() => {
                element.style.transition = 'all 0.6s ease-out';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // 设置滚动动画
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        const animateElements = document.querySelectorAll('.chart-container, .metric-card, .contract-card');
        animateElements.forEach(element => {
            element.classList.add('animate-on-scroll');
            observer.observe(element);
        });
    }

    // 触发现画
    triggerScrollAnimations() {
        const elements = document.querySelectorAll('.animate-on-scroll:not(.animate-in)');

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                element.classList.add('animate-in');
            }
        });
    }

    // 设置悬停效果
    setupHoverEffects() {
        // 卡片悬停效果
        const cards = document.querySelectorAll('.stat-card, .contract-card, .metric-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 按钮悬停效果
        const buttons = document.querySelectorAll('.btn, .action-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '';
            });
        });
    }

    // 设置过渡效果
    setupTransitionEffects() {
        // 标签页切换过渡
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 添加点击涟漪效果
                const ripple = document.createElement('span');
                ripple.className = 'ripple-effect';
                button.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // 开发工具相关方法
    openDevTools() {
        // 仅在开发环境中启用
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // 触发浏览器开发者工具
            console.log('开发者工具快捷键已触发');
        }
    }

    toggleBlockchainView() {
        this.switchTab('blockchain');
    }

    toggleAnalyticsView() {
        this.switchTab('analytics');
    }

    toggleDemoMode() {
        // 切换演示模式
        if (window.toggleDemoMode) {
            window.toggleDemoMode();
        }
    }
}

// 初始化UI增强功能
document.addEventListener('DOMContentLoaded', () => {
    window.uiEnhancements = new UIEnhancements();
});

// 导出类供全局使用
window.UIEnhancements = UIEnhancements;
