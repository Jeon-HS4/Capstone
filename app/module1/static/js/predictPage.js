let globalData = []; // 전역 변수로 실제 데이터를 저장
let selectedRegion = null;
let selectedDate = null;
let selectedValue = null;

// 차트를 업데이트하는 함수
async function updateChart(dataType = 'PM10', highlightDate = null) {
  const regionInput = document.getElementById('region-input');
  
  if (!regionInput || !regionInput.value) {
    console.error("지역 입력 요소를 찾을 수 없거나 값이 비어 있습니다.");
    selectedRegion = '02';
  } else {
    selectedRegion = regionInput.value;
  }


  try {
    const response = await fetch(`http://127.0.0.1:3000/api/data?region=${selectedRegion}&type=${dataType}`);
    if (!response.ok) {
      throw new Error('데이터를 가져오는 중 문제가 발생했습니다.');
    }
    const data = await response.json();
    globalData = data; // 데이터 전역 저장
    console.log("데이터 로드 완료:", data);

    // 데이터 가공 및 차트 업데이트 로직
    const dates = data.map(row => new Date(row.date));
    const values = data.map(row => parseFloat(row.value));

    const trace = {
      x: dates,
      y: values,
      type: 'scatter',
      mode: 'lines',
      name: '데이터'
    };

    const dataPlot = [trace];

    if (highlightDate) {
      const highlightTrace = {
        x: [highlightDate],
        y: [values[dates.findIndex(date => date.toDateString() === new Date(highlightDate).toDateString())]],
        type: 'scatter',
        mode: 'markers',
        marker: { color: 'red', size: 10 },
        name: '선택날짜'
      };
      dataPlot.push(highlightTrace);
    }

    const layout = {
      title: `${selectedRegion} 예측데이터 (${dataType})`,
      xaxis: { title: '날짜' },
      yaxis: { title: '측정값' }
    };

    Plotly.newPlot('chart-plot', dataPlot, layout);

    const chartPlot = document.getElementById('chart-plot');
    chartPlot.on('plotly_click', function (data) {
      const point = data.points[0];
      const date = point.x;
      const value = point.y;
      showPopup(date, value, point.data.name === '예측 데이터');
    });

  } catch (error) {
    console.error('데이터를 가져오거나 플로팅하는 중 오류 발생:', error);
  }
}

// 날짜 선택 시 차트를 업데이트하는 함수
function highlightDate() {
  const dateInput = document.getElementById('date-input').value;
  const dataTypeList = document.getElementById('data-type-list');
  const selectedTypeElement = dataTypeList.querySelector('.selected');
  const dataType = selectedTypeElement ? selectedTypeElement.getAttribute('data-type') : 'PM10';

  if (!dateInput) {
    updateChart(dataType);
    return;
  }

  const highlightDate = new Date(dateInput);
  if (isNaN(highlightDate.getTime())) {
    console.error("유효하지 않은 날짜입니다.");
    return;
  }

  updateChart(dataType, highlightDate);
}

// 연관 검색어를 가져오는 함수
async function fetchSuggestions(searchTerm) {
  if (searchTerm.length < 2) {
    displaySuggestions([]);
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:3000/api/region-suggestions?q=${searchTerm}`);
    if (!response.ok) {
      throw new Error('연관 검색어를 가져오는 중 문제가 발생했습니다.');
    }
    const suggestions = await response.json();
    displaySuggestions(suggestions);
  } catch (error) {
    console.error('연관 검색어를 가져오는 중 오류 발생:', error);
  }
}

// 연관 검색어를 표시하는 함수
function displaySuggestions(suggestions) {
  const suggestionsContainer = document.getElementById('suggestions');
  suggestionsContainer.innerHTML = '';
  suggestions.forEach(suggestion => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.textContent = suggestion;
    suggestionItem.onclick = () => {
      document.getElementById('region-input').value = suggestion;
      suggestionsContainer.innerHTML = '';
    };
    suggestionsContainer.appendChild(suggestionItem);
  });
}

// 팝업 관련 함수
function showPopup(date, value, isFuture) {
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');

  let grade = '';
  let instruction = '';
  let imageUrl = '';

  if (value <= 30) {
    grade = '좋음';
    instruction = '야외 활동에 적합합니다.';
    imageUrl = 'static/img/condition_good.png';
  } else if (value <= 80) {
    grade = '보통';
    instruction = '민감한 사람들은 장시간 야외 활동을 자제하세요.';
    imageUrl = 'static/img/condition_common.png';
  } else if (value <= 150) {
    grade = '나쁨';
    instruction = '노약자, 어린이, 호흡기 질환자는 실외 활동을 자제하세요.';
    imageUrl = 'static/img/condition_bad.png';
  } else {
    grade = '매우나쁨';
    instruction = '모든 사람은 실외 활동을 피하세요.';
    imageUrl = 'static/img/condition_vetyBad.png';
  }

  const formattedDate = new Date(date).toLocaleDateString();

  popupContent.innerHTML = `
    <div style="text-align: center;">
      <img src="${imageUrl}" alt="${grade}" style="max-width: 100px;">
      <h2>${grade}</h2>
    </div>
    <p style="text-align: left;">행동 요령: ${instruction}</p>
    <p style="text-align: left;">예측 값: ${value}</p>
    <p style="text-align: left;">날짜: ${formattedDate}</p>
    <p style="text-align: left;">${isFuture ? '미래 예측 값' : '현재 값'}</p>
  `;
  popup.style.display = 'block';
}

function closePopup() {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
}

// 챗봇 관련 함수
async function fetchSummaryFromChatGPT() {
  const prompt = "챗봇입니다. 질문해주세요.";
  showChatbotPopup(prompt);
}

function showChatbotPopup(prompt) {
  const chatbotPopup = document.getElementById('chatbot-popup');
  chatbotPopup.style.display = 'block';

  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  // 초기 메시지를 한 번만 추가
  if (document.querySelector('.message.bot') === null) {
    appendMessage('bot', prompt);
  }
}

function getRelevantCSVData(data, date, range = 30) {
  const selectedDate = new Date(date);
  const startDate = new Date(selectedDate);
  startDate.setDate(startDate.getDate() - range);
  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + range);

  return data.filter(row => {
    const rowDate = new Date(row['날짜']);
    return rowDate >= startDate && rowDate <= endDate;
  });
}

function handleSendButtonClick() {
  const chatInput = document.getElementById('chat-input');
  const userMessage = chatInput.value;
  if (userMessage.trim() === '') return;

  appendMessage('user', userMessage);
  chatInput.value = '';

  const date = selectedDate ? new Date(selectedDate).toLocaleDateString() : new Date().toLocaleDateString();
  const relevantCSVData = getRelevantCSVData(globalData, date);

  // 차트 데이터 정보
  const chartData = {
    region: selectedRegion || "서울",
    date: date,
    value: selectedValue || 50,
    csvData: relevantCSVData // 필요한 부분만 전송
  };

  fetch('http://127.0.0.1:3000/api/gpt-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userMessage }
      ],
      chartData: chartData
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.choices && data.choices.length > 0) {
      appendMessage('bot', data.choices[0].message.content);
    } else {
      appendMessage('bot', '요약 정보를 가져오는 데 오류가 발생했습니다.');
    }
  })
  .catch(error => {
    console.error('Error fetching summary:', error);
    appendMessage('bot', '요약 정보를 가져오는 데 오류가 발생했습니다.');
  });
}

function handleChatInputKeyPress(event) {
  if (event.key === 'Enter') {
    handleSendButtonClick();
  }
}

function appendMessage(sender, message) {
  const chatOutput = document.getElementById('chat-output');
  if (!chatOutput) {
    console.error('Chat output element not found');
    return;
  }

  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  messageElement.textContent = message;
  chatOutput.appendChild(messageElement);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function closeChatbotPopup() {
  const chatbotPopup = document.getElementById('chatbot-popup');
  chatbotPopup.style.display = 'none';

  // 메시지 초기화
  const chatOutput = document.getElementById('chat-output');
  if (chatOutput) {
    chatOutput.innerHTML = '';
  }
}

function downloadChartAsImage() {
  const chartPlot = document.getElementById('chart-plot');
  Plotly.toImage(chartPlot, { format: 'png', height: 600, width: 800 })
      .then(function (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'chart.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      })
      .catch(function (error) {
          console.error('Error downloading chart as image:', error);
      });
}

document.addEventListener('DOMContentLoaded', function () {
  const searchButton = document.getElementById('search-button');
  searchButton.addEventListener('click', function () {
    updateChart();
  });

  const regionInput = document.getElementById('region-input');
  regionInput.addEventListener('input', function() {
    fetchSuggestions(regionInput.value);
  });

  const dataTypeList = document.getElementById('data-type-list');
  dataTypeList.addEventListener('click', function (event) {
    const target = event.target;
    if (target.tagName === 'LI') {
      const dataType = target.getAttribute('data-type');
      dataTypeList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
      target.classList.add('selected');
      updateChart(dataType);
    }
  });

  const dateInput = document.getElementById('date-input');
  dateInput.addEventListener('change', function () {
    highlightDate();
  });

  const dataSummaryHeader = document.getElementById('data-summary-header');
  dataSummaryHeader.addEventListener('click', fetchSummaryFromChatGPT);

  // 챗봇 관련 이벤트 리스너 추가
  document.getElementById('send-button').addEventListener('click', handleSendButtonClick);
  document.getElementById('chat-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      handleSendButtonClick();
    }
  });
  updateChart();
});
