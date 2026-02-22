# Auto-Company v2.0.0

🤖 Autonomous AI company running 24/7 on Linux/Windows/macOS

[English](./README.md) | [中文](./README-ZH.md)

## ✨ 新特性 (v2.0.0)

- **纯 Node.js 重构** - 不依赖 Make/bash，原生支持 Linux
- **详细日志** - 彩色日志 + 独立周期日志文件 + Web 实时查看
- **Web 看板** - 浏览器实时监控运行状态
- **更好的错误处理** - 断路器机制 + 速率限制等待 + 状态恢复
- **WebSocket 实时推送** - 状态变化即时通知

## 🐧 Linux 支持

本版本专为 Linux 优化，支持：

- ✅ Ubuntu / Debian / CentOS / Fedora / Arch
- ✅ WSL (Windows Subsystem for Linux)
- ✅ Raspberry Pi (ARM64)
- ✅ 服务器环境 (无图形界面)

## 🚀 快速开始

### 前置要求

1. **Node.js 18+**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 或使用 nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   ```

2. **Codex CLI 或 Claude Code**（二选一）
   ```bash
   # 安装 Codex CLI
   npm install -g @openai/codex
   
   # 或安装 Claude Code
   npm install -g @anthropic-ai/claude-code
   
   # 验证安装
   codex --version
   # 或
   claude --version
   ```

3. **配置 API 认证**
   ```bash
   # Codex
   codex auth login
   
   # Claude Code
   claude auth login
   ```

### 安装

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/Auto-Company.git
cd Auto-Company

# 安装依赖
npm install
```

### 配置

创建 `.env` 文件（可选）：

```bash
# 引擎选择: codex 或 claude-code
ENGINE=codex

# 模型覆盖（可选）
MODEL=gpt-4o

# 循环间隔（秒）
INTERVAL=30

# 单周期超时（秒）
TIMEOUT=1800

# 日志级别: debug, info, warn, error
LOG_LEVEL=info

# 看板端口
DASHBOARD_PORT=3456
```

### 启动

```bash
# 前台运行（查看实时输出）
npm start

# 后台守护进程运行
npm run start:daemon

# 查看状态
npm run status

# 查看日志
npm run logs

# 停止运行
npm run stop
```

### Web 看板

启动后访问: `http://localhost:3456`

功能：
- 📊 实时状态监控
- 📈 周期历史记录
- 📝 当前共识查看
- 🔄 实时日志流

![Dashboard](dashboard-preview.png)

## 📋 命令参考

| 命令 | 说明 |
|------|------|
| `npm start` | 前台启动循环 |
| `npm run start:daemon` | 后台守护进程启动 |
| `npm run stop` | 停止循环 |
| `npm run status` | 查看状态 |
| `npm run logs` | 查看最近日志 |
| `npm run dashboard` | 单独启动看板 |
| `npm run install-daemon` | 安装系统服务 |
| `npm run uninstall-daemon` | 卸载系统服务 |

## 🔧 Linux 系统服务（可选）

### 使用 systemd（推荐）

```bash
# 安装服务
npm run install-daemon

# 启动
systemctl --user start auto-company

# 查看状态
systemctl --user status auto-company

# 开机自启
systemctl --user enable auto-company

# 查看日志
journalctl --user -u auto-company -f
```

### 手动服务配置

创建 `~/.config/systemd/user/auto-company.service`：

```ini
[Unit]
Description=Auto Company - Autonomous AI Company
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/Auto-Company
ExecStart=/usr/bin/node /path/to/Auto-Company/src/index.js start:daemon
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

然后：
```bash
systemctl --user daemon-reload
systemctl --user enable auto-company
systemctl --user start auto-company
```

## 🔐 安全注意事项

项目内置以下安全限制（不可绕过）：

- ❌ 禁止删除 GitHub 仓库
- ❌ 禁止删除 Cloudflare 项目
- ❌ 禁止删除系统目录 (`~/.ssh/`, `~/.config/` 等)
- ❌ 禁止非法活动
- ❌ 禁止向公开仓库泄露凭据
- ❌ 禁止强制推送到 main/master

## 📁 项目结构

```
Auto-Company/
├── src/
│   ├── index.js          # 主入口
│   ├── config.js        # 配置管理
│   ├── logger.js        # 日志模块
│   ├── engine.js        # 引擎检测与运行
│   ├── loop.js          # 核心循环逻辑
│   └── dashboard/
│       └── server.js    # Web 看板服务
├── dashboard/
│   └── index.html       # 看板前端
├── memories/            # AI 记忆存储
├── logs/                # 日志文件
├── PROMPT.md            # AI 角色提示词
├── CLAUDE.md            # AI 行为规范
└── package.json         # Node.js 配置
```

## 🐛 故障排除

### Codex/Claude 找不到

```bash
# 确认安装
which codex
which claude

# 尝试手动指定路径
CODEX_BIN=/full/path/to/codex npm start
```

### 卡在 "Beginning work cycle"

1. 检查网络连接
2. 确认 API 配额充足
3. 查看详细日志：`npm run logs`
4. 尝试设置更长的超时：`TIMEOUT=3600 npm start`

### 看板无法访问

```bash
# 检查端口
netstat -tlnp | grep 3456

# 防火墙问题
sudo ufw allow 3456/tcp
```

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🙏 致谢

基于 [MaxMiksa/Auto-Company](https://github.com/MaxMiksa/Auto-Company) 重构
