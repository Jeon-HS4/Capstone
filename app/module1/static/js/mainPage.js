let currentSlide = 0;
let currentFooterSlide = 0;

const slideWidth = 25; // 한 슬라이드의 너비 (%)
const totalSlides = 6 // 총 슬라이드 수
const footerSlides = document.querySelectorAll('.footer-slide');
const totalFooterSlides = footerSlides.length;


function moveSlides(direction) {
    currentSlide += direction;
    if (currentSlide < 0) {
        currentSlide = 0; // 첫 번째 슬라이드 이전으로는 넘어갈 수 없음
    } else if (currentSlide > totalSlides - 4) {
        currentSlide = totalSlides - 4; // 마지막 네 개의 슬라이드를 초과할 수 없음
    }
    const slideContainer = document.querySelector('.slides');
    slideContainer.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
}

function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더해줍니다.
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateString = `${year}년 ${month}월 ${day}일  `;
    const timeString = `${hours}시${minutes}분`;
    document.getElementById('clock').textContent = `${dateString} ${timeString}`;
}

function resetSlidePosition() {
    footerSlides.forEach((slide, index) => {
        slide.style.transition = 'none';  // 트랜지션을 일시적으로 비활성화합니다.
        slide.style.transform = `translateY(${index * 100}%)`; // 각 슬라이드를 원래 위치로 리셋합니다.
    });

    // 짧은 지연 후 첫 번째 슬라이드로 슬라이드를 다시 설정합니다.
    setTimeout(() => {
        footerSlides.forEach(slide => {
            slide.style.transition = 'transform 0.5s ease-in-out'; // 트랜지션 다시 활성화
        });
        currentFooterSlide = 0; // 슬라이드 인덱스 초기화
        moveFooterSlide(); // 첫 번째 슬라이드로 즉시 이동
    }, 20);
}

function moveFooterSlide() {
    if (currentFooterSlide >= totalFooterSlides - 1) {
        // 마지막 슬라이드에서는 슬라이드 위치를 리셋합니다.
        resetSlidePosition();
    } else {
        // 현재 슬라이드 인덱스를 증가시키고 슬라이드 이동
        currentFooterSlide++;
        footerSlides.forEach((slide, index) => {
            slide.style.transform = `translateY(-${(index - currentFooterSlide) * 100}%)`;
        });
    }
}


const rgbToHex = (rgb) => {
    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    return result ? "#" + ((1 << 24) + (parseInt(result[1]) << 16) + (parseInt(result[2]) << 8) + parseInt(result[3])).toString(16).slice(1).toUpperCase() : rgb;
};


window.addEventListener('load', function() {
    // svg 이미지 작업 변수
    const svgObject = document.getElementById('svgMap');
    var svgDoc;
    const goodConditionColor = '#D0ECFF';
    const commonConditionColor = '#B8DCCA';
    const badConditionColor = '#F8F7C6';
    const veryBadConditionColor = '#FF6362';

    const goodConditionColorMouseOn = '#80CFFF';
    const commonConditionColorMouseOn = '#73E7A4';
    const badConditionColorMouseOn = '#FEDF71';
    const veryBadConditionColorMouseOn = '#C21715';

    var someElement = document.getElementById('clock');
    var button = document.querySelector('.subMap-container button');
    const subSvgMap = document.getElementById('totalMap_033');

    console.log(subSvgMap);

    function setupSVG(svgDoc) {
      if (svgDoc) {
          const paths = svgDoc.querySelectorAll('path');
  
          console.log("Found paths:", paths.length); // 로그에 경로의 수를 출력하여 실제로 찾았는지 확인
  
          paths.forEach(path => {
                path.addEventListener('mouseenter', function() {
                    const currentColor = rgbToHex(this.style.fill.trim());
                    if(currentColor == goodConditionColor){
                        this.style.fill = goodConditionColorMouseOn; // 마우스 오버 시 색상 변경
                    }else if(currentColor == commonConditionColor){
                        this.style.fill = commonConditionColorMouseOn;
                    }else if(currentColor == badConditionColor){
                        this.style.fill = badConditionColorMouseOn;
                    }else{
                        this.style.fill = veryBadConditionColorMouseOn;
                    }
                });
                path.addEventListener('mouseleave', function() {
                    const currentColor = rgbToHex(this.style.fill.trim());
                    if(currentColor == goodConditionColorMouseOn){
                        this.style.fill = goodConditionColor; // 마우스 오버 시 색상 변경
                    }else if(currentColor == commonConditionColorMouseOn){
                        this.style.fill = commonConditionColor;
                    }else if(currentColor == badConditionColorMouseOn){
                        this.style.fill = badConditionColor;
                    }else{
                        this.style.fill = veryBadConditionColor;
                    }
                });
          });
          region_datas.forEach(function(data) {
              var regionId = data.regionCode1;
              var pmValue = parseInt(data.pm10Value);
              console.log(data);
  
              // PM 값에 따라 색상 지정
              var color = '';
              if (pmValue <= 30) {
                  color = goodConditionColor;
              } else if (pmValue <= 80) {
                  color = commonConditionColor;
              } else if (pmValue <= 150) {
                  color = badConditionColor;
              } else {
                  color = veryBadConditionColor;
              }
  
              // 해당 지역의 title 속성 값을 사용하여 SVG 요소를 찾고, fill 속성을 변경
              var path = svgDoc.getElementById('totalMap_'+regionId);
              if (path) {
                  path.style.fill = color;
              }
              console.log(regionId, color);
          });
  
        } else {
          console.log("SVG Document is not accessible.");
        }
    }
    if (svgObject.contentDocument) {
        // 이미 로드된 경우
        console.log("SVG is already loaded.");
        setupSVG(svgObject.contentDocument);
    } else {
        // 로드를 기다림
        svgObject.addEventListener('load', function() {
            setupSVG(svgObject.contentDocument);
        });
    }

    if (someElement) {
        someElement.addEventListener('click', function() {
            fnShowTab3Detail('033');
        });
    } else {
        console.error("Cannot find element with ID 'some-element'");
    }

    // subSvgMap.addEventListener('click', function() {
    //     fnShowTab3Detail('033');
    // });
});



// 클릭 이벤트 발생 시 실행되는 함수
function showNewSVG() {
    var newSVGContainer = document.getElementById('subMap_032');
    if(newSVGContainer.style.display == 'none'){
        newSVGContainer.style.display = 'block'; // 보이게 설정
    }else{
        newSVGContainer.style.display = 'none';
    }
}
function fnShowTab3Detail(id) {
    var newSVGContainer = document.getElementById('subMap_' + id);
    if (newSVGContainer) {
        if (newSVGContainer.style.display === 'none') {
            newSVGContainer.style.display = 'block'; // 보이게 설정
        } else {
            newSVGContainer.style.display = 'none';
        }
    } else {
        console.error("Cannot find element with ID 'subMap_" + id + "'");
    }
}


function getAddressFromCoordinates(lon, lat, api_key) {
    var url = 'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=' + lon + '&y=' + lat;
    var headers = {"Authorization": "KakaoAK " + api_key};
    
    return fetch(url, { headers: headers })
        .then(response => response.json())
        .then(data => {
            var match_first = data.documents[0].address_name;
            return match_first;
        })
        .catch(error => {
            console.error("Error fetching address:", error);
            return null;
        });
}

function setCurrentRegion(address_data) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            console.log(latitude, longitude);
            // 위도와 경도를 사용하여 주소 가져오기
            getAddressFromCoordinates(longitude, latitude, mapAPI)
                .then(address => {
                    // div에 주소 정보 표시
                    var addressDiv = document.getElementById("address");
                    addressDiv.textContent = address;

                    var stationName = address.split(' ').pop();
                    var data = address_data.find(item => item.stationName === stationName);
                    console.log(stationName, data);
                    if (data) {
                        updateSlideInfo(data);
                    } else {
                        console.log("해당 지역의 데이터를 찾을 수 없습니다.");
                    }

                })
                .catch(error => {
                    console.error("Error getting address:", error);
                });
        });
    } else {
        console.log("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
}


function updateSlideInfo(data) {
    document.getElementById("khaiValue").innerText = getKhaiValueQualityText(data.khaiValue);
    document.getElementById("pm10Value").innerText = getPM10QualityText(data.pm10Value);
    document.getElementById("pm25Value").innerText = getPM25QualityText(data.pm25Value);
    document.getElementById("o3Value").innerText = getO3QualityText(data.o3Value);
    document.getElementById("no2Value").innerText = getNO2QualityText(data.no2Value);
    document.getElementById("coValue").innerText = getCOQualityText(data.coValue);
    document.getElementById("so2Value").innerText = getSO2QualityText(data.so2Value);
}

// 아황산가스 지수에 따른 텍스트 반환 함수
function getSO2QualityText(value) {
    var img = document.getElementById('so2Condition');
    if (value <= 0.02) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 0.05) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 0.15) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 일산화탄소 지수에 따른 텍스트 반환 함수
function getCOQualityText(value) {
    var img = document.getElementById('coCondition');
    if (value <= 2) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 9) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 15) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 오존 지수에 따른 텍스트 반환 함수
function getO3QualityText(value) {
    var img = document.getElementById('o3Condition');
    if (value <= 0.03) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 0.09) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 0.15) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 이산화질소 지수에 따른 텍스트 반환 함수
function getNO2QualityText(value) {
    var img = document.getElementById('no2Condition');
    if (value <= 0.03) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 0.06) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 0.2) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 미세먼지 PM-10 지수에 따른 텍스트 반환 함수
function getPM10QualityText(value) {
    var img = document.getElementById('pm10Condition');
    if (value <= 30) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 80) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 150) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 초미세먼지 PM-2.5 지수에 따른 텍스트 반환 함수
function getPM25QualityText(value) {
    var img = document.getElementById('pm25Condition');
    if (value <= 15) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 35) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 75) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}

// 통합대기환경지수 khaiValue 지수에 따른 텍스트 반환 함수
function getKhaiValueQualityText(value) {
    var img = document.getElementById('khaiCondition');
    if (value <= 50) {
        img.src = "static/img/condition_good.png";
        return "좋음(" + value + ")";
    } else if (value <= 100) {
        img.src = "static/img/condition_common.png";
        return "보통(" + value + ")";
    } else if (value <= 250) {
        img.src = "static/img/condition_bad.png";
        return "나쁨(" + value + ")";
    } else {
        img.src = "static/img/condition_veryBad.png";
        return "매우 나쁨(" + value + ")";
    }
}
