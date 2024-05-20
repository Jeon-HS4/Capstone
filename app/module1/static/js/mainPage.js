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
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateString = `${year}년${month}월${day}일`;
    const timeString = `${hours}시${minutes}분${seconds}초`;
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

function updateExtraContent(content1, content2) {
    document.getElementById('extra1').textContent = content1;
    document.getElementById('extra2').textContent = content2;
}






window.addEventListener('load', function() {
    // svg 이미지 작업 변수
    const svgObject = document.getElementById('svgMap');
    var svgDoc;

    function setupSVG(svgDoc) {
      if (svgDoc) {
          const paths = svgDoc.querySelectorAll('path');
  
          console.log("Found paths:", paths.length); // 로그에 경로의 수를 출력하여 실제로 찾았는지 확인
  
          paths.forEach(path => {
              path.addEventListener('mouseenter', function() {
                  this.style.fill = '#ff0000'; // 마우스 오버 시 색상 변경
              });
              path.addEventListener('mouseleave', function() {
                  this.style.fill = ''; // 원래 색상으로 복원
              });
          });
          region_datas.forEach(function(data) {
              var region = data.region;
              var regionId = data.regionId;
              var pmValue = parseInt(data.pmValue);
              console.log(data);
  
              // PM 값에 따라 색상 지정
              var color = '';
              if (pmValue <= 30) {
                  color = '#4173b6';
              } else if (pmValue <= 80) {
                  color = '#4e8f4b';
              } else if (pmValue <= 150) {
                  color = '#e7933d';
              } else {
                  color = '#b03730';
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

});