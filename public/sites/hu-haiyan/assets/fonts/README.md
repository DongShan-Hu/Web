# 本地中文字体

- `display-serif.woff2`：Noto Serif SC，字重范围 400–500，244,144 bytes。
- `body-sans.woff2`：Noto Sans SC，字重范围 400–500，192,732 bytes。
- 合计 436,876 bytes（约 426.6 KiB）。
- 两个字体均为真实变量字体，默认字重 400；界面建议使用 400，强调使用 500。
- 字符范围包含当前网站 `index.html`、`app.js`、`artwork-notes.js` 中的字符、ASCII、常用中英文标点及中文数字变体。每个文件包含 824 个 Unicode 映射；已验证当前网站汉字没有缺字，源字体支持的请求字符均保留。

## 官方来源与许可

下载日期：2026-09-20。源文件来自 Google Fonts 官方仓库：

- https://github.com/google/fonts/tree/main/ofl/notoserifsc
- https://github.com/google/fonts/tree/main/ofl/notosanssc

原始字体均采用 SIL Open Font License 1.1，完整许可证随文件保存在 `OFL-NotoSerifSC.txt` 和 `OFL-NotoSansSC.txt`。本地文件仅作字重范围裁减和字符子集化。

## 使用

```css
@font-face {
  font-family: "Haiyan Serif";
  src: url("./assets/fonts/display-serif.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 500;
  font-display: swap;
}

@font-face {
  font-family: "Haiyan Sans";
  src: url("./assets/fonts/body-sans.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 500;
  font-display: swap;
}
```

文件由项目内 `qa/hu-haiyan/fonts/build_fonts.py` 生成。为了减少静态作品集的首次下载量，不保留完整 GB2312 字库；每次修改网站文案后，应重新运行两个字体的生成命令。脚本自动收集 `index.html`、`app.js` 与作品解读文件 `artwork-notes.js` 的字符，并验证生成字库没有丢失源字体支持的字符。源 TTF 和转换依赖放在 QA 目录，不随网站部署。

```powershell
& '<Python 路径>' 'qa/hu-haiyan/fonts/build_fonts.py' serif
& '<Python 路径>' 'qa/hu-haiyan/fonts/build_fonts.py' sans
```
