# Google OAuth 配置教程（3分钟）

## 步骤 1：创建 Google Cloud 项目
1. 打开 https://console.cloud.google.com
2. 点击顶部 **选择项目** → **新建项目**
3. 项目名称输入 `CODELAB`，点击 **创建**

## 步骤 2：配置 OAuth 同意屏幕
1. 左侧菜单 → **APIs & Services** → **OAuth consent screen**
2. 选择 **External**，点击 **创建**
3. 填写：
   - 应用名称：`CODELAB`
   - 用户支持电子邮件：你的邮箱
   - 开发者联系信息：你的邮箱
4. 点击 **保存并继续**（Scopes 和 Test users 都直接跳过）

## 步骤 3：创建 OAuth Client ID
1. 左侧菜单 → **APIs & Services** → **Credentials**
2. 点击 **+ CREATE CREDENTIALS** → **OAuth client ID**
3. 应用类型选 **Web application**
4. 名称：`CODELAB Web`
5. **Authorized JavaScript origins** 添加：
   - `http://localhost:3000`（本地开发）
   - 你的部署域名（如 `https://codelab.xxx.com`）
6. 点击 **创建**

## 步骤 4：复制 Client ID
创建成功后会显示 Client ID，类似：
```
123456789-abcdefg.apps.googleusercontent.com
```

## 步骤 5：替换代码中的占位符
打开 `public/index.html`，搜索 `YOUR_GOOGLE_CLIENT_ID`，替换为你的 Client ID：

```html
data-client_id="123456789-abcdefg.apps.googleusercontent.com"
```

保存文件，刷新页面即可使用 Google 登录！
