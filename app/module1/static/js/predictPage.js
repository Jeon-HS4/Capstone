async function fetchCSVData(filePath) {
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

let globalData = []; // 전역 변수로 실제 데이터를 저장
let futureData = []; // 전역 변수로 예측 데이터를 저장
let selectedDate = null;
let selectedValue = null;
let selectedRegion = null;

async function updateChart(dataType = 'PM10', highlightDate = null) {
    const regionSelect = document.getElementById('region-select');
    if (!regionSelect) {
        console.error("지역 선택 요소를 찾을 수 없습니다.");
        return;
    }

    selectedRegion = regionSelect.value;
    let filePath;

    switch (selectedRegion) {
        case 'seoul':
            filePath = 'static/data/미세먼지.csv';
            break;
        case 'incheon':
            filePath = 'static/data/dataAPI20240510incheon.csv';
            break;
        case 'busan':
            filePath = 'static/data/dataAPI20240510busan.csv';
            break;
        default:
            console.error("지원하지 않는 지역이 선택되었습니다.");
            return;
    }

    try {
        const data = await fetchCSVData(filePath);
        globalData = data; // 데이터 전역 저장
        console.log("데이터 로드 완료:", data);

        if (data.length > 0) {
            console.log("첫 번째 행:", data[0]);
        }

        let endDate = highlightDate ? new Date(highlightDate) : new Date();
        let startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);

        const dates = data.map(row => {
            const date = new Date(row['날짜']);
            return isNaN(date.getTime()) ? null : date;
        });

        let values;
        if (dataType === 'O3') {
            values = data.map(row => {
                const value = parseFloat(row['오 존']);
                return isNaN(value) ? null : value;
            });
        } else {
            values = data.map(row => {
                const value = parseFloat(row[dataType]);
                return isNaN(value) ? null : value;
            });
        }

        console.log("파싱된 날짜들:", dates);
        console.log("파싱된 값들:", values);

        const validData = dates.map((date, index) => ({ date, value: values[index] }))
            .filter(entry => entry.date && entry.value !== null && entry.date >= startDate);

        const filteredDates = validData.map(entry => entry.date);
        const filteredValues = validData.map(entry => entry.value);

        let futureFilePath;
        switch (dataType) {
            case 'PM10':
                futureFilePath = 'static/data/predictions_future.csv';
                break;
            case 'PM2.5':
                futureFilePath = 'static/data/predicion.csv';
                break;
            case 'O3':
                futureFilePath = 'static/data/predicion_o3.csv';
                break;
            default:
                console.error("지원하지 않는 데이터 유형이 선택되었습니다.");
                return;
        }

        futureData = await fetchCSVData(futureFilePath);

        const futureDates = futureData.map(row => {
            const date = new Date(row['Date']);
            return isNaN(date.getTime()) ? null : date;
        });

        const futureValues = futureData.map(row => {
            const value = parseFloat(row[`Predicted ${dataType.toUpperCase()}`]);
            return isNaN(value) ? null : value;
        });

        const validFutureData = futureDates.map((date, index) => ({ date, value: futureValues[index] }))
            .filter(entry => entry.date && entry.value !== null && entry.date >= new Date('2024-05-26'));

        const filteredFutureDates = validFutureData.map(entry => entry.date);
        const filteredFutureValues = validFutureData.map(entry => entry.value);

        // 실제 데이터와 예측 데이터를 연결하는 부분 추가
        const lastActualDate = new Date('2024-05-25'); // 5월 25일 날짜 지정
        const lastActualValue = filteredValues[filteredDates.findIndex(date => date.toDateString() === 'Sat May 25 2024')];
        const firstFutureDate = new Date('2024-05-26'); // 5월 26일 날짜 지정
        const firstFutureValue = filteredFutureValues[0];

        console.log("마지막 실제 데이터 날짜:", lastActualDate);
        console.log("마지막 실제 데이터 값:", lastActualValue);
        console.log("첫 번째 예측 데이터 날짜:", firstFutureDate);
        console.log("첫 번째 예측 데이터 값:", firstFutureValue);

        const traceActual = {
            x: filteredDates,
            y: filteredValues,
            type: 'scatter',
            mode: 'lines',
            name: '실제 데이터'
        };

        const tracePredicted = {
            x: filteredFutureDates,
            y: filteredFutureValues,
            type: 'scatter',
            mode: 'lines',
            name: '예측 데이터',
            line: {
                dash: 'dot',
                color: 'red'
            }
        };

        // 연결 선 추가
        const traceConnection = {
            x: [lastActualDate, firstFutureDate],
            y: [lastActualValue, firstFutureValue],
            type: 'scatter',
            mode: 'lines',
            line: {
                dash: 'dot',
                color: 'red'
            },
            showlegend: false,
            hoverinfo: 'skip' // 여기서 hover 정보를 건너뛰도록 설정합니다.
        };

        const dataPlot = [traceActual, tracePredicted, traceConnection];

        if (highlightDate) {
            const highlightIndex = filteredDates.findIndex(date => date.toDateString() === new Date(highlightDate).toDateString());
            const highlightFutureIndex = filteredFutureDates.findIndex(date => date.toDateString() === new Date(highlightDate).toDateString());
            const highlightTraces = [];

            if (highlightIndex !== -1) {
                const highlightTrace = {
                    x: [filteredDates[highlightIndex]],
                    y: [filteredValues[highlightIndex]],
                    type: 'scatter',
                    mode: 'markers',
                    marker: { color: 'red', size: 10 },
                    name: '선택날짜'
                };
                highlightTraces.push(highlightTrace);
            }

            if (highlightFutureIndex !== -1) {
                const highlightFutureTrace = {
                    x: [filteredFutureDates[highlightFutureIndex]],
                    y: [filteredFutureValues[highlightFutureIndex]],
                    type: 'scatter',
                    mode: 'markers',
                    marker: { color: 'red', size: 10 },
                    name: '선택날짜'
                };
                highlightTraces.push(highlightFutureTrace);
            }

            dataPlot.push(...highlightTraces);

            // 선택된 날짜의 값을 이용하여 팝업을 표시합니다.
            selectedDate = highlightDate;
            selectedValue = highlightIndex !== -1 ? filteredValues[highlightIndex] :
                (highlightFutureIndex !== -1 ? filteredFutureValues[highlightFutureIndex] : null);

            if (selectedValue !== null) {
                showPopup(highlightDate, selectedValue, highlightFutureIndex !== -1);
            }
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
        console.error("데이터를 가져오거나 플로팅하는 중 오류 발생:", error);
    }
}

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
    updateChart();

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
});
