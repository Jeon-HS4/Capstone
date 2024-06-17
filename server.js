const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());
app.use(helmet());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // 생성한 사용자로 변경
  password: 'yky21c2094!', // 새로운 비밀번호로 변경
  database: 'capstone_db'
});

connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  console.log('MySQL에 성공적으로 연결되었습니다.');
});

// 연관 검색어를 제공하는 엔드포인트 추가
app.get('/api/region-suggestions', (req, res) => {
  const searchTerm = req.query.q;
  const query = 'SELECT DISTINCT regionCode1 FROM air_pollution_data WHERE regionCode1 LIKE ? LIMIT 10';
  
  connection.query(query, [`%${searchTerm}%`], (error, results) => {
    if (error) {
      console.error('Error fetching region suggestions:', error);
      return res.status(500).json({ error });
    }
    res.json(results.map(row => row.regionCode1));
  });
});

app.get('/api/regions', (req, res) => {
  connection.query('SELECT DISTINCT regionCode1 AS region FROM air_pollution_data', (error, results) => {
    if (error) {
      console.error('Error fetching regions:', error);
      return res.status(500).json({ error });
    }
    res.json(results);
  });
});

app.get('/api/data', (req, res) => {
  const { region, type } = req.query;
  let query;

  switch(type) {
    case 'PM10':
      query = 'SELECT dataTime AS date, pm10Value AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    case 'PM2.5':
      query = 'SELECT dataTime AS date, pm25Value AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    case 'SO2':
      query = 'SELECT dataTime AS date, so2Value AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    case 'CO':
      query = 'SELECT dataTime AS date, coValue AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    case 'O3':
      query = 'SELECT dataTime AS date, o3Value AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    case 'NO2':
      query = 'SELECT dataTime AS date, no2Value AS value FROM air_pollution_data WHERE regionCode1 = ?';
      break;
    default:
      return res.status(400).json({ error: 'Invalid type' });
  }

  console.log(`Executing query: ${query} with region=${region} and type=${type}`);

  connection.query(query, [region], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error });
    }
    console.log('Query results:', results);
    res.json(results);
  });
});

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
