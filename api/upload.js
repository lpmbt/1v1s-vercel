export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, msg: 'upload endpoint (POST) available' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = req.headers['x-api-key'] || (req.body && req.body.apiKey);
    if (!process.env.UPLOAD_API_KEY || apiKey !== process.env.UPLOAD_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename, content } = req.body || {};
    if (!filename || typeof content === 'undefined') {
      return res.status(400).json({ error: 'filename and content required' });
    }

    const owner = process.env.GH_OWNER;
    const repo = process.env.GH_REPO;
    const token = process.env.GH_TOKEN;
    const branch = process.env.GH_BRANCH || 'main';
    if (!owner || !repo || !token) {
      return res.status(500).json({ error: 'GH_OWNER/GH_REPO/GH_TOKEN not configured' });
    }

    const path = `saves/${filename}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    // 尝试 GET 已有文件以获取 sha（用于 update）
    let sha = null;
    try {
      const getRes = await fetch(url + `?ref=${encodeURIComponent(branch)}`, {
        method: 'GET',
        headers: { Authorization: `token ${token}`, 'User-Agent': '1v1s-uploader' }
      });
      if (getRes.ok) {
        const js = await getRes.json();
        if (js && js.sha) sha = js.sha;
      }
    } catch (e) {
      // ignore
    }

    const contentBase64 = Buffer.from(JSON.stringify(content, null, 2), 'utf8').toString('base64');
    const body = {
      message: `upload ${filename}`,
      content: contentBase64,
      branch,
      committer: { name: process.env.COMMITTER_NAME || '1v1s-uploader', email: process.env.COMMITTER_EMAIL || 'noreply@example.com' }
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': '1v1s-uploader'
      },
      body: JSON.stringify(body)
    });

    const putJson = await putRes.json();
    if (!putRes.ok) return res.status(500).json({ error: putJson });

    return res.status(200).json({ ok: true, result: putJson });
  } catch (err) {
    console.error('upload handler err', err);
    return res.status(500).json({ error: String(err) });
  }
}
