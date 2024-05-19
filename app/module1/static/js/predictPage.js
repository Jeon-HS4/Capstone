// 데이터셋 (예시 데이터)
const data = {
    서울: [
        { date: '2023-01-01', value: 10 },
        { date: '2023-02-01', value: 15 },
        { date: '2023-03-01', value: 13 },
        { date: '2023-04-01', value: 17 },
        { date: '2023-05-01', value: 20 }
    ],
    인천: [
        { date: '2023-01-01', value: 20 },
        { date: '2023-02-01', value: 25 },
        { date: '2023-03-01', value: 23 },
        { date: '2023-04-01', value: 27 },
        { date: '2023-05-01', value: 30 }
    ],
    부산: [
        { date: '2023-01-01', value: 30 },
        { date: '2023-02-01', value: 35 },
        { date: '2023-03-01', value: 33 },
        { date: '2023-04-01', value: 37 },
        { date: '2023-05-01', value: 40 }
    ]
};

// 데이터 전처리 및 차트 업데이트
function updateChart() {
    const region = document.getElementById('region-select').value;
    const regionData = data[region];
    const dates = regionData.map(d => d.date);
    const values = regionData.map(d => d.value);

    const forecastedValues = forecast(values, 5);
    const forecastedDates = ['2023-06-01', '2023-07-01', '2023-08-01', '2023-09-01', '2023-10-01'];

    const trace1 = {
        x: dates,
        y: values,
        mode: 'lines+markers',
        name: '실제 데이터'
    };

    const trace2 = {
        x: forecastedDates,
        y: forecastedValues,
        mode: 'lines+markers',
        name: '예측 데이터',
        line: { dash: 'dot', color: 'red' }
    };

    const layout = {
        title: `실제데이터 및 예측 그래프 - ${region}`,
        xaxis: { title: '날짜' },
        yaxis: { title: '값' }
    };

    Plotly.newPlot('chart-plot', [trace1, trace2], layout);

    document.getElementById('chart-title').innerText = `미래 정보 예측`;

    // 데이터 요약 업데이트
    const summary = `
        최대 값: ${Math.max(...values)}<br>
        최소 값: ${Math.min(...values)}<br>
        평균 값: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}
    `;
    document.getElementById('summary').innerHTML = summary;
}

// 간단한 예측 알고리즘 (선형 회귀를 가정)
function forecast(values, steps) {
    const lastValue = values[values.length - 1];
    const trend = (values[values.length - 1] - values[0]) / (values.length - 1);
    let forecastedValues = [];
    for (let i = 1; i <= steps; i++) {
        forecastedValues.push(lastValue + trend * i);
    }
    return forecastedValues;
}