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

let globalData = []; // Global variable to hold the data for highlighting
let futureData = []; // Global variable to hold the future data

async function updateChart(dataType = 'pm10Value') {
    const regionSelect = document.getElementById('region-select');
    if (!regionSelect) {
        console.error("Region select element not found");
        return;
    }

    const region = regionSelect.value;
    let filePath;

    switch(region) {
        case 'seoul':
            filePath = 'static/data/dataAPI20240510seoul.csv';
            break;
        case 'incheon':
            filePath = 'static/data/dataAPI20240510incheon.csv';
            break;
        case 'busan':
            filePath = 'static/data/dataAPI20240510busan.csv';
            break;
        default:
            console.error("Unsupported region selected");
            return;
    }
    
    try {
        const data = await fetchCSVData(filePath);
        globalData = data; // Store data globally
        console.log("Data loaded:", data);

        if (data.length > 0) {
            console.log("First row:", data[0]);
        }

        const dates = data.map(row => {
            const date = new Date(row.dataTime);
            return isNaN(date.getTime()) ? null : date;
        });

        const values = data.map(row => {
            const value = parseFloat(row[dataType]);
            return isNaN(value) ? null : value;
        });

        console.log("Dates:", dates);
        console.log("Values:", values);

        const validData = dates.map((date, index) => ({ date, value: values[index] }))
                                .filter(entry => entry.date && entry.value !== null);

        const filteredDates = validData.map(entry => entry.date);
        const filteredValues = validData.map(entry => entry.value);

        futureData = await fetchCSVData('static/data/future_predictions.csv');
        const futureDates = futureData.map(row => new Date(row.dataTime));
        const futureValues = futureData.map(row => parseFloat(row[dataType]));

        const traceActual = {
            x: filteredDates,
            y: filteredValues,
            type: 'scatter',
            mode: 'lines',
            name: '실제 데이터'
        };

        const tracePredicted = {
            x: futureDates,
            y: futureValues,
            type: 'scatter',
            mode: 'lines',
            name: '예측 데이터',
            line: {
                dash: 'dot',
                color: 'red'
            }
        };

        const dataPlot = [traceActual, tracePredicted];
        const layout = {
            title: `${region} 예측데이터`,
            xaxis: { title: '날짜' },
            yaxis: { title: '측정값' }
        };

        Plotly.newPlot('chart-plot', dataPlot, layout);

        // Add event listener for data point click
        const chartPlot = document.getElementById('chart-plot');
        chartPlot.on('plotly_click', function(data) {
            const point = data.points[0];
            const date = point.x;
            const value = point.y;
            showPopup(date, value, false);
        });

    } catch (error) {
        console.error("Error fetching or plotting data:", error);
    }
}

function highlightDate() {
    const dateInput = document.getElementById('date-input').value;
    if (!dateInput) return;

    const highlightDate = new Date(dateInput);
    if (isNaN(highlightDate.getTime())) {
        console.error("Invalid date");
        return;
    }

    const dates = globalData.map(row => new Date(row.dataTime));
    const values = globalData.map(row => parseFloat(row['pm10Value']));

    const validData = dates.map((date, index) => ({ date, value: values[index] }))
                            .filter(entry => entry.date && entry.value !== null);

    const filteredDates = validData.map(entry => entry.date);
    const filteredValues = validData.map(entry => entry.value);

    const futureDates = futureData.map(row => new Date(row.dataTime));
    const futureValues = futureData.map(row => parseFloat(row['pm10Value']));

    const highlightIndex = filteredDates.findIndex(d => d.getTime() === highlightDate.getTime());
    const highlightValue = highlightIndex !== -1 ? filteredValues[highlightIndex] : null;

    const futureHighlightIndex = futureDates.findIndex(d => d.getTime() === highlightDate.getTime());
    const futureHighlightValue = futureHighlightIndex !== -1 ? futureValues[futureHighlightIndex] : null;

    const traceActual = {
        x: filteredDates,
        y: filteredValues,
        type: 'scatter',
        mode: 'lines',
        name: '실제데이터'
    };

    const tracePredicted = {
        x: futureDates,
        y: futureValues,
        type: 'scatter',
        mode: 'lines',
        name: '예측데이터',
        line: {
            dash: 'dot',
            color: 'red'
        }
    };

    const dataPlot = [traceActual, tracePredicted];

    if (highlightValue !== null) {
        const traceHighlight = {
            x: [highlightDate],
            y: [highlightValue],
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: 'red',
                size: 10
            },
            name: '선택날짜'
        };
        dataPlot.push(traceHighlight);
        showPopup(highlightDate, highlightValue, false);
    } else if (futureHighlightValue !== null) {
        const traceFutureHighlight = {
            x: [highlightDate],
            y: [futureHighlightValue],
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: 'red',
                size: 10
            },
            name: '선택날짜'
        };
        dataPlot.push(traceFutureHighlight);
        showPopup(highlightDate, futureHighlightValue, true);
    }

    const layout = {
        title: `예측`,
        xaxis: { title: '날짜' },
        yaxis: { title: '측정값' }
    };

    Plotly.newPlot('chart-plot', dataPlot, layout);

    const chartPlot = document.getElementById('chart-plot');
    chartPlot.on('plotly_click', function(data) {
        const point = data.points[0];
        const date = point.x;
        const value = point.y;
        showPopup(date, value, false);
    });
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
    try {
        const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
            },
            body: JSON.stringify({
                prompt: "Provide a summary of the current air quality data for Seoul, Incheon, and Busan.",
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices.length) {
            throw new Error('No choices in response');
        }

        return data.choices[0].text;
    } catch (error) {
        console.error('Error fetching summary from ChatGPT:', error);
        return '요약 정보를 가져오는 데 오류가 발생했습니다.';
    }
}

async function showSummaryPopup() {
    const summary = await fetchSummaryFromChatGPT();
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popup-content');
    
    popupContent.innerHTML = `<p>${summary}</p>`;
    popup.style.display = 'block';
}

function downloadChartAsImage() {
    const chartPlot = document.getElementById('chart-plot');
    Plotly.toImage(chartPlot, {format: 'png', width: 800, height: 600}).then(function(url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chart.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateChart();

    const dataTypeList = document.getElementById('data-type-list');
    dataTypeList.addEventListener('click', function(event) {
        const target = event.target;
        if (target.tagName === 'LI') {
            const dataType = target.getAttribute('data-type');
            updateChart(dataType);
        }
    });
});
