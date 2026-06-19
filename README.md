包含 Vercel serverless 接口：
- GET  / -> /api/health
- POST /api/upload  (请将 api/upload.js 添加到仓库/api/)

快速部署与测试：
1. 将仓库推到 GitHub（main 分支）。
2. Vercel 控制台 Import Project -> 选择该仓库。
3. 在 Vercel 项目 Settings -> Environment Variables 添加 .env.sample 中的真实值（切勿提交 secret）。
4. 推送后等待部署完成，访问 https://<your-vercel-domain>/ 验证 health。
5. 在可上外网的机器上测试上传：
   curl -v -X POST "https://<your-vercel-domain>/api/upload" \
     -H "Content-Type: application/json" \
     -H "x-api-key: <UPLOAD_API_KEY>" \
     -d '{"filename":"test.json","content":{"ts":123}}'

安全注意：
- 不要把 GH_TOKEN 或 UPLOAD_API_KEY 提交到仓库或写入前端代码。
- 如果客户端网络对 vercel.app 不可达，考虑使用国内云函数作为中转。
