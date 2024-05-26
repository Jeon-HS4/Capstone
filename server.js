const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '50mb' })); // 요청 본문 크기 제한 증가
app.use(cors()); // 모든 도메인에서의 요청을 허용
app.use(helmet()); // 보안 헤더 추가

app.post('/api/gpt-summary', async (req, res) => {
    const { model, messages, chartData } = req.body;

    const prompt = `
        사용자는 차트에 대해 질문하고 있습니다. 
        차트 정보는 다음과 같습니다:
        지역: ${chartData.region}
        날짜: ${chartData.date}
        미세먼지 수치: ${chartData.value}
        질문: ${messages[1].content}
        
        차트의 CSV 데이터는 다음과 같습니다:
        ${JSON.stringify(chartData.csvData)}
        
        차트를 바탕으로 질문에 대한 답변을 제공해주세요.
    `;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching summary:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching summary from ChatGPT' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
